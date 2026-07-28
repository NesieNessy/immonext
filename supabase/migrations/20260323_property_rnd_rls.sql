-- Row Level Security, matching the pattern used by property_acquisition
-- (1:1 child table, ownership derived from the parent property row).
ALTER TABLE property_rnd ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own property rnd"
    ON property_rnd FOR SELECT
    USING (EXISTS (SELECT 1 FROM property WHERE property.property_id = property_rnd.property_id AND property.user_id = auth.uid()));

CREATE POLICY "Users can insert own property rnd"
    ON property_rnd FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM property WHERE property.property_id = property_rnd.property_id AND property.user_id = auth.uid()));

CREATE POLICY "Users can update own property rnd"
    ON property_rnd FOR UPDATE
    USING (EXISTS (SELECT 1 FROM property WHERE property.property_id = property_rnd.property_id AND property.user_id = auth.uid()));

CREATE POLICY "Users can delete own property rnd"
    ON property_rnd FOR DELETE
    USING (EXISTS (SELECT 1 FROM property WHERE property.property_id = property_rnd.property_id AND property.user_id = auth.uid()));

-- Auto-update updated_at on changes
CREATE OR REPLACE FUNCTION update_property_rnd_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER property_rnd_updated_at
    BEFORE UPDATE ON property_rnd
    FOR EACH ROW EXECUTE FUNCTION update_property_rnd_updated_at();
