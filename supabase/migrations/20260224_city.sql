-- ==============================================================================
-- ImmoNext – CREATE TABLE: city
-- Reference / lookup table — not user-owned.
-- All authenticated users can read; only admins/service role can write.
-- ==============================================================================

CREATE TYPE metropolitan_area_type AS ENUM (
    'METROPOLITAN',
    'URBAN',
    'RURAL'
);

CREATE TABLE IF NOT EXISTS city (
    city_id             SERIAL                      PRIMARY KEY,

    city_name           VARCHAR(100)                NOT NULL,
    building_share      NUMERIC(5, 4)               NOT NULL CHECK (building_share BETWEEN 0 AND 1),
    land_share          NUMERIC(5, 4)               NOT NULL CHECK (land_share BETWEEN 0 AND 1),
    metropolitan_area   metropolitan_area_type      NOT NULL,

    created_at          TIMESTAMP WITH TIME ZONE    DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE    DEFAULT NOW(),

    -- building_share + land_share must equal 1
    CONSTRAINT chk_city_shares CHECK (
        ROUND(building_share + land_share, 4) = 1.0
    ),

    -- City names must be unique
    CONSTRAINT uq_city_name UNIQUE (city_name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_city_name              ON city (city_name);
CREATE INDEX IF NOT EXISTS idx_city_metropolitan_area ON city (metropolitan_area);

-- Comments
COMMENT ON TABLE  city                     IS 'Reference table of cities used across property, depreciation, rent index and legal requirements.';
COMMENT ON COLUMN city.building_share      IS 'Proportion of property value attributed to the building (0–1). E.g. 0.70 = 70%.';
COMMENT ON COLUMN city.land_share          IS 'Proportion of property value attributed to land (0–1). building_share + land_share must = 1.';
COMMENT ON COLUMN city.metropolitan_area   IS 'Classification: METROPOLITAN | URBAN | RURAL.';

-- Enable Row Level Security
ALTER TABLE city ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read city data
CREATE POLICY "Authenticated users can view cities"
    ON city FOR SELECT
    USING (auth.role() = 'authenticated');

-- Only service role / admin can insert, update, delete
-- (managed via Supabase dashboard or migrations — no user-facing write policies)

-- Auto-update updated_at on changes
CREATE OR REPLACE FUNCTION update_city_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER city_updated_at
    BEFORE UPDATE ON city
    FOR EACH ROW EXECUTE FUNCTION update_city_updated_at();
