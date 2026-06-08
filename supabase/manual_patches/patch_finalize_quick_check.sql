-- ============================================================================
-- PATCH: finalize_quick_check
-- Run this in Supabase Dashboard → SQL Editor to apply the latest version
-- of finalize_quick_check to the live database.
--
-- Changes vs previous version:
--   • p_kpf_multiplier now has DEFAULT NULL (was required)
--   • kpf_ranges upsert is wrapped in IF p_kpf_multiplier IS NOT NULL
--   • quick_check.kpf_multiplier updated via COALESCE (keeps existing when NULL)
--   • sample_size increments on every conflict (upsert)
--   • status is NO LONGER set to 'INACTIVE' on finalization —
--     status tracks portal listing availability, not finalization state
--   • kpf_ranges only updated when KPF is outside existing [min, max] range
-- ============================================================================

-- ── Fix: resync the quick_check_id SERIAL sequence ────────────────────────────
-- Run this if you get "duplicate key value violates unique constraint
-- quick_check_pkey" when inserting — it means the sequence is behind the
-- highest existing id (e.g. after manual inserts or a partial reset).
SELECT setval(
    pg_get_serial_sequence('quick_check', 'quick_check_id'),
    COALESCE((SELECT MAX(quick_check_id) FROM quick_check), 0) + 1,
    false
);
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION finalize_quick_check(
    p_quick_check_id        INT,
    p_user_id               UUID,
    p_action                VARCHAR(10),            -- 'ACCEPT' | 'DISCARD'
    p_kpf_multiplier        DECIMAL(5, 1)           DEFAULT NULL,  -- live KPF from UI; NULL = skip kpf_ranges upsert
    -- Required only when p_action = 'ACCEPT'
    p_street                VARCHAR(100)            DEFAULT NULL,
    p_house_number          VARCHAR(10)             DEFAULT NULL,
    p_city_name             VARCHAR(100)            DEFAULT NULL,
    p_federal_state         VARCHAR(100)            DEFAULT NULL,
    p_city_id               INT                     DEFAULT NULL,
    p_property_abbreviation VARCHAR(20)             DEFAULT NULL,
    p_square_meters         NUMERIC(10, 2)          DEFAULT NULL,
    p_number_of_rooms       NUMERIC(3, 1)           DEFAULT NULL,
    p_energy_efficient      energy_efficiency_class DEFAULT NULL
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_qc            quick_check%ROWTYPE;
    v_property_id   INT := NULL;
    v_bucket        kpf_construction_year_bucket;
BEGIN
    -- Guard: valid action
    IF p_action NOT IN ('ACCEPT', 'DISCARD') THEN
        RAISE EXCEPTION 'p_action must be ACCEPT or DISCARD, got: %', p_action;
    END IF;

    -- Guard: ACCEPT requires all property fields
    IF p_action = 'ACCEPT' AND (
        p_street IS NULL OR p_house_number IS NULL OR p_city_name IS NULL OR
        p_federal_state IS NULL OR p_city_id IS NULL OR
        p_property_abbreviation IS NULL OR p_square_meters IS NULL OR
        p_number_of_rooms IS NULL OR p_energy_efficient IS NULL
    ) THEN
        RAISE EXCEPTION 'ACCEPT action requires all property fields to be provided.';
    END IF;

    -- Load + lock the row; guard against wrong owner or already-finalised
    SELECT * INTO v_qc
    FROM quick_check
    WHERE quick_check_id = p_quick_check_id
      AND user_id        = p_user_id
      AND status         = 'ACTIVE'
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'quick_check % not found, not owned by user, or already finalised.', p_quick_check_id;
    END IF;

    -- ── Step 1 (both): UPSERT kpf_ranges with the live KPF value ─────────────
    IF p_kpf_multiplier IS NOT NULL THEN
        v_bucket := CASE
            WHEN v_qc.year_of_construction < 1918 THEN '<1918'
            WHEN v_qc.year_of_construction < 1950 THEN '1918-1949'
            WHEN v_qc.year_of_construction < 1960 THEN '1950-1959'
            WHEN v_qc.year_of_construction < 1970 THEN '1960-1969'
            WHEN v_qc.year_of_construction < 1980 THEN '1970-1979'
            WHEN v_qc.year_of_construction < 1990 THEN '1980-1989'
            WHEN v_qc.year_of_construction < 2000 THEN '1990-1999'
            WHEN v_qc.year_of_construction < 2010 THEN '2000-2009'
            WHEN v_qc.year_of_construction < 2015 THEN '2010-2014'
            ELSE '2015+'
        END::kpf_construction_year_bucket;

        INSERT INTO kpf_ranges (postal_code, condition, construction_year_bucket, min_value, max_value, sample_size)
        VALUES (v_qc.postal_code, v_qc.condition, v_bucket, p_kpf_multiplier, p_kpf_multiplier, 1)
        ON CONFLICT (postal_code, condition, construction_year_bucket) DO UPDATE
            SET min_value   = LEAST   (kpf_ranges.min_value,  EXCLUDED.min_value),
                max_value   = GREATEST(kpf_ranges.max_value,  EXCLUDED.max_value),
                sample_size = kpf_ranges.sample_size + 1
            WHERE EXCLUDED.min_value < kpf_ranges.min_value
               OR EXCLUDED.max_value > kpf_ranges.max_value;
    END IF;

-- ==============================================================================
-- NOTE: status (ACTIVE/INACTIVE) is NOT changed here — it tracks portal
--   listing availability, not finalization state. A row stays ACTIVE after
--   Verwerfen/Übernehmen unless the user explicitly marks it INACTIVE.
-- ==============================================================================

    -- ── Step 2 (both): finalise the quick_check row ───────────────────────────
    UPDATE quick_check
       SET kpf_multiplier    = COALESCE(p_kpf_multiplier, kpf_multiplier),
           finalised_action  = p_action,
           updated_at        = NOW()
     WHERE quick_check_id = p_quick_check_id;

    -- ── Step 3 (ACCEPT only): create property record ──────────────────────────
    IF p_action = 'ACCEPT' THEN
        INSERT INTO property (
            user_id, city_id, property_abbreviation,
            street, house_number, city, postal_code, federal_state,
            square_meters, number_of_rooms, year_of_construction, energy_efficient
        ) VALUES (
            p_user_id, p_city_id, p_property_abbreviation,
            p_street, p_house_number, p_city_name,
            v_qc.postal_code,          p_federal_state,
            p_square_meters,           p_number_of_rooms,
            v_qc.year_of_construction, p_energy_efficient
        )
        RETURNING property_id INTO v_property_id;

        UPDATE quick_check
           SET property_id = v_property_id,
               updated_at  = NOW()
         WHERE quick_check_id = p_quick_check_id;
    END IF;

    RETURN v_property_id;
END;
$$;

-- Re-grant after CREATE OR REPLACE
GRANT EXECUTE ON FUNCTION finalize_quick_check(
    INT, UUID, VARCHAR, DECIMAL,
    VARCHAR, VARCHAR, VARCHAR, VARCHAR,
    INT, VARCHAR, NUMERIC, NUMERIC,
    energy_efficiency_class
) TO authenticated;


-- ==============================================================================
-- RPC: upsert_kpf_range
--
-- Called when the user clicks "Verwerfen" on the NEW quick-check page.
-- In that flow the check result is intentionally NOT saved to quick_check —
-- only the market data point (kpf_ranges) is recorded.
--
-- Takes the raw inputs (postal_code, condition, year_of_construction,
-- kpf_multiplier) and performs the same kpf_ranges upsert as finalize_quick_check
-- Step 1, but completely independent of any quick_check row.
--
-- SECURITY DEFINER so the function can write to kpf_ranges (which has no
-- direct RLS write policy for authenticated users).
-- ==============================================================================

CREATE OR REPLACE FUNCTION upsert_kpf_range(
    p_postal_code           VARCHAR(10),
    p_condition             property_condition,
    p_year_of_construction  INT,
    p_kpf_multiplier        DECIMAL(5, 1)
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_bucket kpf_construction_year_bucket;
BEGIN
    v_bucket := CASE
        WHEN p_year_of_construction < 1918 THEN '<1918'
        WHEN p_year_of_construction < 1950 THEN '1918-1949'
        WHEN p_year_of_construction < 1960 THEN '1950-1959'
        WHEN p_year_of_construction < 1970 THEN '1960-1969'
        WHEN p_year_of_construction < 1980 THEN '1970-1979'
        WHEN p_year_of_construction < 1990 THEN '1980-1989'
        WHEN p_year_of_construction < 2000 THEN '1990-1999'
        WHEN p_year_of_construction < 2010 THEN '2000-2009'
        WHEN p_year_of_construction < 2015 THEN '2010-2014'
        ELSE '2015+'
    END::kpf_construction_year_bucket;

    INSERT INTO kpf_ranges (postal_code, condition, construction_year_bucket, min_value, max_value, sample_size)
    VALUES (p_postal_code, p_condition, v_bucket, p_kpf_multiplier, p_kpf_multiplier, 1)
    ON CONFLICT (postal_code, condition, construction_year_bucket) DO UPDATE
        SET min_value   = LEAST   (kpf_ranges.min_value,  EXCLUDED.min_value),
            max_value   = GREATEST(kpf_ranges.max_value,  EXCLUDED.max_value),
            sample_size = kpf_ranges.sample_size + 1
        WHERE EXCLUDED.min_value < kpf_ranges.min_value
           OR EXCLUDED.max_value > kpf_ranges.max_value;
END;
$$;

GRANT EXECUTE ON FUNCTION upsert_kpf_range(
    VARCHAR, property_condition, INT, DECIMAL
) TO authenticated;
