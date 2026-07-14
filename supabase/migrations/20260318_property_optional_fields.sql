-- The "Übernehmen" flow no longer collects city_id, property_abbreviation,
-- house_number, federal_state, square_meters, number_of_rooms, or
-- energy_efficient via a modal — the property record is now created
-- directly from the quick_check snapshot (street, city, postal_code,
-- year_of_construction), with these fields left for the user to fill in
-- later on the property record itself.
ALTER TABLE property
    ALTER COLUMN city_id               DROP NOT NULL,
    ALTER COLUMN property_abbreviation DROP NOT NULL,
    ALTER COLUMN house_number          DROP NOT NULL,
    ALTER COLUMN federal_state         DROP NOT NULL,
    ALTER COLUMN square_meters         DROP NOT NULL,
    ALTER COLUMN number_of_rooms       DROP NOT NULL,
    ALTER COLUMN energy_efficient      DROP NOT NULL;

-- Re-create finalize_quick_check: ACCEPT no longer requires property_id
-- fields, and street/city/postal_code now come from the quick_check row
-- itself (v_qc) rather than from caller-supplied parameters, since that
-- data was already saved to quick_check by the time Übernehmen is clicked.
CREATE OR REPLACE FUNCTION finalize_quick_check(
    p_quick_check_id        INT,
    p_user_id               UUID,
    p_action                VARCHAR(10),            -- 'ACCEPT' | 'DISCARD'
    p_kpf_multiplier        DECIMAL(5, 1)           DEFAULT NULL,  -- live KPF from UI; NULL = skip kpf_ranges upsert
    -- Optional property fields — only used when p_action = 'ACCEPT'
    p_house_number          VARCHAR(10)             DEFAULT NULL,
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

    -- ── Step 2 (both): finalise the quick_check row ───────────────────────────
    -- (status is intentionally not changed — it tracks portal listing
    -- availability, not finalization state)
    UPDATE quick_check
       SET kpf_multiplier    = COALESCE(p_kpf_multiplier, kpf_multiplier),
           finalised_action  = p_action,
           updated_at        = NOW()
     WHERE quick_check_id = p_quick_check_id;

    -- ── Step 3 (ACCEPT only): create property record ──────────────────────────
    -- street/city/postal_code/year come from the quick_check snapshot itself;
    -- everything else is optional and can be filled in later on the property.
    IF p_action = 'ACCEPT' THEN
        INSERT INTO property (
            user_id, city_id, property_abbreviation,
            street, house_number, city, postal_code, federal_state,
            square_meters, number_of_rooms, year_of_construction, energy_efficient
        ) VALUES (
            p_user_id, p_city_id, p_property_abbreviation,
            v_qc.street, p_house_number, v_qc.city,
            v_qc.postal_code, p_federal_state,
            p_square_meters, p_number_of_rooms,
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

-- Drop the old 13-parameter overload (p_street/p_city_name removed) so only
-- the new signature remains callable.
DROP FUNCTION IF EXISTS finalize_quick_check(
    INT, UUID, VARCHAR, DECIMAL,
    VARCHAR, VARCHAR, VARCHAR, VARCHAR,
    INT, VARCHAR, NUMERIC, NUMERIC,
    energy_efficiency_class
);

GRANT EXECUTE ON FUNCTION finalize_quick_check(
    INT, UUID, VARCHAR, DECIMAL,
    VARCHAR, VARCHAR, INT, VARCHAR,
    NUMERIC, NUMERIC, energy_efficiency_class
) TO authenticated;
