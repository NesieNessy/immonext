-- 1. Create the property_acquisition table
CREATE TABLE IF NOT EXISTS property_acquisition (
    property_acquisition_id     SERIAL                      PRIMARY KEY,
    property_id                 INT                         NOT NULL REFERENCES property(property_id) ON DELETE CASCADE,
    
    house_completion_year       INT,
    purchase_date               DATE,
    transfer_date               DATE,

    created_at                  TIMESTAMP WITH TIME ZONE    DEFAULT NOW(),
    updated_at                  TIMESTAMP WITH TIME ZONE    DEFAULT NOW()

    CONSTRAINT chk_valid_completion_year 
CHECK (house_completion_year BETWEEN 1800 AND EXTRACT(YEAR FROM NOW())::INT);
);

-- 2. Add an index for the foreign key to ensure fast lookups
CREATE INDEX IF NOT EXISTS idx_property_acq_property_id ON property_acquisition (property_id);

-- Optional: Auto-update updated_at on changes
CREATE OR REPLACE FUNCTION update_property_acquisition_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER property_acquisition_updated_at
    BEFORE UPDATE ON property_acquisition
    FOR EACH ROW EXECUTE FUNCTION update_property_acquisition_updated_at();