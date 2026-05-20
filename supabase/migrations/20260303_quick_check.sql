-- ==============================================================================
-- ImmoNext - CREATE TABLE: quick_check
--
-- Flow:
--   INSERT   -> user fills QuickCheckPage. Inputs stored in * fields.
--              No property record exists yet.
--
--   ACCEPT   -> finalize_quick_check(p_action := 'ACCEPT'):
--              Step 1 (both): UPSERT kpf_ranges - every check is a data point
--              Step 2 (both): status = 'INACTIVE', finalised_action = 'ACCEPT'
--              Step 3 (ACCEPT only): INSERT property -> appears in Portfolio
--
--   DISCARD  -> finalize_quick_check(p_action := 'DISCARD'):
--              Step 1 (both): UPSERT kpf_ranges - every check is a data point
--              Step 2 (both): status = 'INACTIVE', finalised_action = 'DISCARD'
--              (no property record created)
--
-- Key invariant: kpf_ranges updated on EVERY finalisation, accept or discard.
--
-- Field mapping:
--   Erfassungsdatum  -> created_at                         (auto)
--   Portal ID        -> portal_id                          (own)
--   KPF Faktor       -> kpf_multiplier                         (own, frontend computed)
--   Kaufpreis        -> purchase_price            (own)
--   Straße           -> street                    (own)
--   PLZ              -> postal_code               (own)
--   Stadt            -> city                      (own)
--   Baujahr          -> year_of_construction      (own)
--   Zustand          -> condition                          (reuses property_condition enum)
--   Status           -> status                             (quick_check_status enum)
--   Detailbewertung  -> detail_check                  (boolean)
-- ==============================================================================

CREATE TYPE quick_check_status AS ENUM (
    'ACTIVE',   -- on immo portal online
    'INACTIVE'  -- on immo portal not online anymore
);

CREATE TABLE IF NOT EXISTS quick_check (
    quick_check_id                  SERIAL                      PRIMARY KEY,
    user_id                         UUID                        NOT NULL
                                        REFERENCES personal_data(user_id) ON DELETE CASCADE,

    -- Set only when finalised_action = 'ACCEPT'. NULL for DISCARD.
    property_id                     INT
                                        REFERENCES property(property_id) ON DELETE SET NULL,

    -- External listing reference (e.g. ImmoScout24 expose ID or URL)
    portal_id                       VARCHAR(255),
    data_entry_source               TEXT                        NOT NULL DEFAULT 'MANUELL',

    -- Snapshot fields: entered by user in QuickCheckPage. Immutable after INSERT.
    -- Source of truth for kpf_ranges upsert and (on ACCEPT) property creation.
    purchase_price         NUMERIC(14, 2)              NOT NULL,
    cold_rent              NUMERIC(10, 2)              NOT NULL,
    street                 VARCHAR(120)                NOT NULL,
    postal_code            VARCHAR(10)                 NOT NULL,
    city                   VARCHAR(120)                NOT NULL,
    year_of_construction   INT                         NOT NULL
                                        CHECK (year_of_construction BETWEEN 1800 AND 2100),

    -- Reuses existing property_condition enum (no new type needed):
    -- 'Sanierungsbedürftig' | 'Standard' | 'Gehoben' | 'Luxus'
    condition                       property_condition          NOT NULL,

    -- KPF = purchase_price / (cold_rent * 12), 1 decimal.
    -- Computed in frontend, stored at check time. Not persisted anywhere else.
    kpf_multiplier                     NUMERIC(5, 1)               NOT NULL
                                        CHECK (kpf_multiplier > 0),

    status                          quick_check_status          NOT NULL DEFAULT 'ACTIVE',

    -- Which button the user clicked. NULL while ACTIVE.
    finalised_action                VARCHAR(10)
                                        CHECK (finalised_action IN ('ACCEPT', 'DISCARD')),

    -- TRUE once a full Detailbewertung has been started or completed
    detail_check               BOOLEAN                     NOT NULL DEFAULT FALSE,

    created_at                      TIMESTAMP WITH TIME ZONE    NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMP WITH TIME ZONE    NOT NULL DEFAULT NOW()

);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quick_check_user_id     ON quick_check (user_id);
CREATE INDEX IF NOT EXISTS idx_quick_check_property_id ON quick_check (property_id);
CREATE INDEX IF NOT EXISTS idx_quick_check_status      ON quick_check (status);
CREATE INDEX IF NOT EXISTS idx_quick_check_created_at  ON quick_check (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quick_check_postal_code ON quick_check (postal_code);

-- Comments
COMMENT ON TABLE  quick_check IS 'Quick-check records. All display columns are self-contained snapshots. kpf_ranges updated on every finalisation regardless of action.';
COMMENT ON COLUMN quick_check.portal_id IS 'External listing reference, e.g. ImmoScout24 expose ID or URL.';
COMMENT ON COLUMN quick_check.purchase_price IS 'Kaufpreis at check time. Input to KPF and kpf_ranges upsert.';
COMMENT ON COLUMN quick_check.cold_rent IS 'Kaltmiete at check time. Required for KPF = price / (rent * 12).';
COMMENT ON COLUMN quick_check.street IS 'Street and house number snapshot entered during quick-check.';
COMMENT ON COLUMN quick_check.postal_code IS 'PLZ at check time. Key for kpf_ranges upsert on finalisation.';
COMMENT ON COLUMN quick_check.city IS 'City snapshot entered during quick-check.';
COMMENT ON COLUMN quick_check.year_of_construction IS 'Baujahr at check time. Mapped to kpf_construction_year_bucket on finalisation.';
COMMENT ON COLUMN quick_check.kpf_multiplier IS 'Kaufpreisfaktor = Kaufpreis / (Kaltmiete * 12), 1 decimal. Stored at check time.';
COMMENT ON COLUMN quick_check.status IS 'ACTIVE = Portal ID valid. INACTIVE = Portal ID invalid.';
COMMENT ON COLUMN quick_check.finalised_action IS 'ACCEPT = taken over into Portfolio. DISCARD = dismissed. NULL while ACTIVE.';
COMMENT ON COLUMN quick_check.property_id IS 'Set only when finalised_action = ACCEPT. NULL for DISCARD.';
COMMENT ON COLUMN quick_check.created_at IS 'Erfassungsdatum: when the quick-check was first accepted.';

-- Row Level Security
ALTER TABLE quick_check ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own quick checks"   ON quick_check FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quick checks" ON quick_check FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own quick checks" ON quick_check FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own quick checks" ON quick_check FOR DELETE USING (auth.uid() = user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_quick_check_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER quick_check_updated_at
    BEFORE UPDATE ON quick_check
    FOR EACH ROW EXECUTE FUNCTION update_quick_check_updated_at();


-- ==============================================================================
-- VIEW: quick_check_overview
-- All display columns from snapshot fields — no joins required.
-- Frontend: WHERE status = 'ACTIVE'   -> live overview list
--           WHERE status = 'INACTIVE' -> history / audit view
-- ==============================================================================

CREATE OR REPLACE VIEW quick_check_overview AS
SELECT
    qc.quick_check_id,
    qc.user_id,
    qc.created_at           AS ingest_date,
    qc.portal_id,
    qc.data_entry_source,
    qc.kpf_multiplier,
    qc.purchase_price,
    qc.cold_rent,
    qc.street,
    qc.postal_code,
    qc.city,
    qc.year_of_construction,
    qc.condition,
    qc.status,
    qc.finalised_action,
    qc.detail_check,
    qc.property_id
FROM quick_check qc;

COMMENT ON VIEW quick_check_overview IS 'Read view for the Quick-Check overview table. All columns self-contained — no joins required.';


-- ==============================================================================
-- RPC: finalize_quick_check
--
-- Single entry point for BOTH the "Übernehmen" and "Verwerfen" buttons.
-- p_action: 'ACCEPT' | 'DISCARD'
--
-- Step 1 (both):   UPSERT kpf_ranges — every checked object is a data point.
--                  First entry:      min = max = kpf_multiplier, sample_size = 1
--                  Subsequent entry: expands range, sample_size + 1
-- Step 2 (both):   status = 'INACTIVE', finalised_action = p_action.
-- Step 3 (ACCEPT): INSERT INTO property -> object appears in Portfolio.
--
-- Returns: new property_id for ACCEPT, NULL for DISCARD.
-- ==============================================================================

CREATE OR REPLACE FUNCTION finalize_quick_check(
    p_quick_check_id        INT,
    p_user_id               UUID,
    p_action                VARCHAR(10),            -- 'ACCEPT' | 'DISCARD'
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

    -- ── Step 1 (both): UPSERT kpf_ranges ─────────────────────────────────────
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
    VALUES (v_qc.postal_code, v_qc.condition, v_bucket, v_qc.kpf_multiplier, v_qc.kpf_multiplier, 1)
    ON CONFLICT (postal_code, condition, construction_year_bucket) DO UPDATE
        SET min_value   = LEAST   (kpf_ranges.min_value,  EXCLUDED.min_value),
            max_value   = GREATEST(kpf_ranges.max_value,  EXCLUDED.max_value),
            sample_size = kpf_ranges.sample_size + 1;

    -- ── Step 2 (ACCEPT only): create property record ──────────────────────────
    IF p_action = 'ACCEPT' THEN
        INSERT INTO property (
            user_id, city_id, property_abbreviation,
            street, house_number, city, postal_code, federal_state,
            square_meters, number_of_rooms, year_of_construction, energy_efficient
        ) VALUES (
            p_user_id, p_city_id, p_property_abbreviation,
            p_street, p_house_number, p_city_name,
            v_qc.postal_code,          p_federal_state,
            p_square_meters,                    p_number_of_rooms,
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

GRANT EXECUTE ON FUNCTION finalize_quick_check(
    INT, UUID, VARCHAR,
    VARCHAR, VARCHAR, VARCHAR, VARCHAR,
    INT, VARCHAR, NUMERIC, NUMERIC,
    energy_efficiency_class
) TO authenticated;
