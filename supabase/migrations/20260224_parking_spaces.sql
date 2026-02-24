-- 1. Create the ENUM type for the parking space (Adjust the values as needed!)
CREATE TYPE parking_space_type_enum AS ENUM (
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
    
    parking_space_type          parking_space_type_enum,
    number_of_parking_spaces    INT,

    created_at                  TIMESTAMP WITH TIME ZONE    DEFAULT NOW(),
    updated_at                  TIMESTAMP WITH TIME ZONE    DEFAULT NOW()
);

-- 3. Add an index for the foreign key to ensure fast lookups
CREATE INDEX IF NOT EXISTS idx_parking_space_property_id ON parking_space (property_id);

-- Optional: Auto-update updated_at on changes (reusing the trigger style from your other tables)
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