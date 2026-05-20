-- 1. Create the tenancy table
CREATE TYPE tenancy_type AS ENUM (
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
    property_id                 INT                         NOT NULL REFERENCES property(property_id) ON DELETE CASCADE,
    parking_space_id            INT                         REFERENCES parking_space(parking_space_id) ON DELETE SET NULL,
    maintenance_costs_id        INT                         REFERENCES maintenance_costs(maintenance_costs_id) ON DELETE SET NULL,

    -- Tenancy details
    is_rented                   BOOLEAN                     NOT NULL DEFAULT FALSE,
    tenancy_start_date          DATE,
    tenancy_end_date            DATE,
    tenancy_type                VARCHAR(150),
    tenancy_units               INT                         CHECK (tenancy_units > 0),

    -- Financials (Using NUMERIC(10,2) for decimals/currency)
    tenancy_units_price         NUMERIC(10, 2),
    parking_space_rent          NUMERIC(10, 2),
    misc_rent                   NUMERIC(10, 2),
    warm_rent                   NUMERIC(10, 2),
    cold_rent                   NUMERIC(10, 2),

    -- Tenant info
    tenant_first_name           VARCHAR(150)                NOT NULL DEFAULT '',
    tenant_last_name            VARCHAR(150)                NOT NULL DEFAULT '',
    deposit                     NUMERIC(10, 2),

    -- Timestamps
    created_at                  TIMESTAMP WITH TIME ZONE    DEFAULT NOW(),
    updated_at                  TIMESTAMP WITH TIME ZONE    DEFAULT NOW(),

    CONSTRAINT chk_tenancy_dates CHECK (tenancy_end_date IS NULL OR tenancy_end_date > tenancy_start_date)
);

-- 2. Add indexes for the foreign keys to ensure fast lookups
CREATE INDEX IF NOT EXISTS idx_tenancy_property_id          ON tenancy (property_id);
CREATE INDEX IF NOT EXISTS idx_tenancy_parking_space_id     ON tenancy (parking_space_id);
CREATE INDEX IF NOT EXISTS idx_tenancy_maintenance_costs_id ON tenancy (maintenance_costs_id);

-- 3. Table and column comments
COMMENT ON TABLE  tenancy                       IS '1:n with property. Tracks rental periods and rent amounts.';
COMMENT ON COLUMN tenancy.warm_rent             IS 'Warm rent = cold rent + allocable maintenance costs.';
COMMENT ON COLUMN tenancy.cold_rent             IS 'Pure rent without ancillary costs.';

-- 4. Row Level Security
ALTER TABLE tenancy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenancies"
    ON tenancy FOR SELECT
    USING (EXISTS (SELECT 1 FROM property WHERE property.property_id = tenancy.property_id AND property.user_id = auth.uid()));

CREATE POLICY "Users can insert own tenancies"
    ON tenancy FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM property WHERE property.property_id = tenancy.property_id AND property.user_id = auth.uid()));

CREATE POLICY "Users can update own tenancies"
    ON tenancy FOR UPDATE
    USING (EXISTS (SELECT 1 FROM property WHERE property.property_id = tenancy.property_id AND property.user_id = auth.uid()));

CREATE POLICY "Users can delete own tenancies"
    ON tenancy FOR DELETE
    USING (EXISTS (SELECT 1 FROM property WHERE property.property_id = tenancy.property_id AND property.user_id = auth.uid()));

-- 5. Auto-update updated_at on changes
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
