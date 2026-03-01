-- 1. Create the ENUM type for the parking space
CREATE TYPE parking_space_type AS ENUM (
    'GARAGE',
    'CARPORT',
    'OUTDOOR',
    'UNDERGROUND',
    'OTHER'
);

-- 2. Create the parking_space table
CREATE TABLE IF NOT EXISTS parking_space (
    parking_space_id            SERIAL                      PRIMARY KEY,
    property_id                 INT                         NOT NULL REFERENCES property(property_id) ON DELETE CASCADE,

    parking_space_type          parking_space_type          NOT NULL,
    number_of_parking_spaces    INT                         NOT NULL CHECK (number_of_parking_spaces > 0),

    created_at                  TIMESTAMP WITH TIME ZONE    DEFAULT NOW(),
    updated_at                  TIMESTAMP WITH TIME ZONE    DEFAULT NOW()
);

-- 3. Add an index for the foreign key to ensure fast lookups
CREATE INDEX IF NOT EXISTS idx_parking_space_property_id ON parking_space (property_id);

-- 4. Row Level Security
ALTER TABLE parking_space ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own parking spaces"
    ON parking_space FOR SELECT
    USING (EXISTS (SELECT 1 FROM property WHERE property.property_id = parking_space.property_id AND property.user_id = auth.uid()));

CREATE POLICY "Users can insert own parking spaces"
    ON parking_space FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM property WHERE property.property_id = parking_space.property_id AND property.user_id = auth.uid()));

CREATE POLICY "Users can update own parking spaces"
    ON parking_space FOR UPDATE
    USING (EXISTS (SELECT 1 FROM property WHERE property.property_id = parking_space.property_id AND property.user_id = auth.uid()));

CREATE POLICY "Users can delete own parking spaces"
    ON parking_space FOR DELETE
    USING (EXISTS (SELECT 1 FROM property WHERE property.property_id = parking_space.property_id AND property.user_id = auth.uid()));

-- 5. Auto-update updated_at on changes
CREATE OR REPLACE FUNCTION update_parking_space_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER parking_space_updated_at
    BEFORE UPDATE ON parking_space
    FOR EACH ROW EXECUTE FUNCTION update_parking_space_updated_at();
