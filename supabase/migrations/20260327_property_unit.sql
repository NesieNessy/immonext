-- 1:n with property — a rentable Wohneinheit (e.g. "Whg. 1 (EG links)").
-- Every property has at least one row here, even when number_of_units = 1.
CREATE TABLE IF NOT EXISTS property_unit (
    property_unit_id   SERIAL                      PRIMARY KEY,
    property_id         INT                         NOT NULL REFERENCES property(property_id) ON DELETE CASCADE,
    unit_label           TEXT                        NOT NULL,
    sort_order            INT                         NOT NULL DEFAULT 0,
    created_at            TIMESTAMP WITH TIME ZONE    NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMP WITH TIME ZONE    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_unit_property_id ON property_unit (property_id);

COMMENT ON TABLE property_unit IS '1:n with property — a rentable Wohneinheit.';

ALTER TABLE property_unit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own property units"
    ON property_unit FOR SELECT
    USING (EXISTS (SELECT 1 FROM property WHERE property.property_id = property_unit.property_id AND property.user_id = auth.uid()));

CREATE POLICY "Users can insert own property units"
    ON property_unit FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM property WHERE property.property_id = property_unit.property_id AND property.user_id = auth.uid()));

CREATE POLICY "Users can update own property units"
    ON property_unit FOR UPDATE
    USING (EXISTS (SELECT 1 FROM property WHERE property.property_id = property_unit.property_id AND property.user_id = auth.uid()));

CREATE POLICY "Users can delete own property units"
    ON property_unit FOR DELETE
    USING (EXISTS (SELECT 1 FROM property WHERE property.property_id = property_unit.property_id AND property.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION update_property_unit_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER property_unit_updated_at
    BEFORE UPDATE ON property_unit
    FOR EACH ROW EXECUTE FUNCTION update_property_unit_updated_at();
