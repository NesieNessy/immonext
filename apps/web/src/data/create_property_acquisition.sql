-- ==============================================================================
-- ImmoNext – CREATE TABLE: property_acquisition
-- Depends on: property (property_id) — 1:1
-- ==============================================================================

CREATE TABLE IF NOT EXISTS property_acquisition (
    property_acquisition_id SERIAL                      PRIMARY KEY,
    property_id             INT                         NOT NULL UNIQUE REFERENCES property(property_id) ON DELETE CASCADE,

    house_completion_year   DATE,
    purchase_date           DATE                        NOT NULL,
    transfer_date           DATE,

    created_at              TIMESTAMP WITH TIME ZONE    DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_acquisition_property_id ON property_acquisition (property_id);

COMMENT ON TABLE  property_acquisition                      IS '1:1 with property. Stores acquisition dates.';
COMMENT ON COLUMN property_acquisition.house_completion_year IS 'Year the building was completed (may differ from purchase date).';
COMMENT ON COLUMN property_acquisition.transfer_date         IS 'Date ownership was legally transferred.';

ALTER TABLE property_acquisition ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own property acquisitions"
    ON property_acquisition FOR SELECT
    USING (EXISTS (SELECT 1 FROM property WHERE property.property_id = property_acquisition.property_id AND property.user_id = auth.uid()));

CREATE POLICY "Users can insert own property acquisitions"
    ON property_acquisition FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM property WHERE property.property_id = property_acquisition.property_id AND property.user_id = auth.uid()));

CREATE POLICY "Users can update own property acquisitions"
    ON property_acquisition FOR UPDATE
    USING (EXISTS (SELECT 1 FROM property WHERE property.property_id = property_acquisition.property_id AND property.user_id = auth.uid()));

CREATE POLICY "Users can delete own property acquisitions"
    ON property_acquisition FOR DELETE
    USING (EXISTS (SELECT 1 FROM property WHERE property.property_id = property_acquisition.property_id AND property.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION update_property_acquisition_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER property_acquisition_updated_at
    BEFORE UPDATE ON property_acquisition
    FOR EACH ROW EXECUTE FUNCTION update_property_acquisition_updated_at();
