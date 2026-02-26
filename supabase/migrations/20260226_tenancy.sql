-- 1. Create the tenancy table
CREATE TYPE tenancy_type_enum AS ENUM (
    'Standard',
    'Indexmiete',
    'Nießbrauch',
    'Erbpacht',
    'Sondervermietung',
    'Gewerbe',
    'Altenheim',
    'Zwangsversteigerung'
);

CREATE TABLE IF NOT EXISTS tenancy (
    tenancy_id                  SERIAL                      PRIMARY KEY,
    
    -- Foreign Keys
    maintenance_costs_id        INT                         NOT NULL, -- Add 'REFERENCES maintenance_costs(maintenance_costs_id)' here if that table exists
    parking_space_id            INT                         NOT NULL REFERENCES parking_space(parking_space_id) ON DELETE CASCADE,
    property_id                 INT                         NOT NULL REFERENCES property(property_id) ON DELETE CASCADE,
    
    -- Tenancy details
    is_rented                   BOOLEAN,
    tenancy_start_date           DATE,
    tenancy_end_date             DATE,
    tenancy_type                 VARCHAR(150),
    tenancy_units                INT,
    
    -- Financials (Using NUMERIC(10,2) for decimals/currency)
    tenancy_units_price         NUMERIC(10, 2),
    parking_space_rent          NUMERIC(10, 2),
    misc_rent                   NUMERIC(10, 2),
    warm_rent                   NUMERIC(10, 2),
    cold_rent                   NUMERIC(10, 2),

    -- Timestamps
    created_at                  TIMESTAMP WITH TIME ZONE    DEFAULT NOW(),
    updated_at                  TIMESTAMP WITH TIME ZONE    DEFAULT NOW()
);

-- 2. Add indexes for the foreign keys to ensure fast lookups
CREATE INDEX IF NOT EXISTS idx_tenancy_maintenance_costs_id ON tenancy (maintenance_costs_id);
CREATE INDEX IF NOT EXISTS idx_tenancy_parking_space_id     ON tenancy (parking_space_id);
CREATE INDEX IF NOT EXISTS idx_tenancy_property_id          ON tenancy (property_id);

-- 3. Auto-update updated_at on changes
CREATE OR REPLACE FUNCTION update_tenancy_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenancy_updated_at
    BEFORE UPDATE ON tenancy
    FOR EACH ROW EXECUTE FUNCTION update_tenancy_updated_at();