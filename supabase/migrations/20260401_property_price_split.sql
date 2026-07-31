-- Persists the Kaufpreisaufteilung (Gebäude/Grund und Boden split) shown on
-- the adjust-distribution page — mirrors the property_rnd 1:1 child-table
-- pattern. Only the raw inputs are stored; both Standard and Individual
-- percentages are cheap to recompute from purchase price + city share +
-- these fields, so nothing derived is cached here.

CREATE TABLE IF NOT EXISTS property_price_split (
    property_price_split_id  SERIAL PRIMARY KEY,
    property_id               INT NOT NULL UNIQUE REFERENCES property(property_id) ON DELETE CASCADE,
    split_mode                TEXT NOT NULL DEFAULT 'STANDARD',
    plot_area_m2               NUMERIC,
    land_reference_value       NUMERIC,
    co_ownership_numerator     NUMERIC,
    co_ownership_denominator   NUMERIC,
    created_at                 TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at                 TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_price_split_property_id
    ON property_price_split(property_id);

-- Row Level Security, matching property_rnd (ownership derived from the
-- parent property row).
ALTER TABLE property_price_split ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own property price split"
    ON property_price_split FOR SELECT
    USING (EXISTS (SELECT 1 FROM property WHERE property.property_id = property_price_split.property_id AND property.user_id = auth.uid()));

CREATE POLICY "Users can insert own property price split"
    ON property_price_split FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM property WHERE property.property_id = property_price_split.property_id AND property.user_id = auth.uid()));

CREATE POLICY "Users can update own property price split"
    ON property_price_split FOR UPDATE
    USING (EXISTS (SELECT 1 FROM property WHERE property.property_id = property_price_split.property_id AND property.user_id = auth.uid()));

CREATE POLICY "Users can delete own property price split"
    ON property_price_split FOR DELETE
    USING (EXISTS (SELECT 1 FROM property WHERE property.property_id = property_price_split.property_id AND property.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION update_property_price_split_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER property_price_split_updated_at
    BEFORE UPDATE ON property_price_split
    FOR EACH ROW EXECUTE FUNCTION update_property_price_split_updated_at();
