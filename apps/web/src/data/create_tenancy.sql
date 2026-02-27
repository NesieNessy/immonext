-- ==============================================================================
-- ImmoNext – CREATE TABLE: tenancy
-- Depends on: property (property_id), parking_spaces (parking_space_id),
--             maintenance_costs (maintenance_costs_id)
-- ==============================================================================

CREATE TYPE rental_type_enum AS ENUM (
    'RESIDENTIAL',
    'COMMERCIAL',
    'MIXED',
    'SHORT_TERM'
);

CREATE TABLE IF NOT EXISTS tenancy (
    tenancy_id              SERIAL                      PRIMARY KEY,
    property_id             INT                         NOT NULL REFERENCES property(property_id) ON DELETE CASCADE,
    parking_space_id        INT                         REFERENCES parking_spaces(parking_space_id) ON DELETE SET NULL,
    maintenance_costs_id    INT                         REFERENCES maintenance_costs(maintenance_costs_id) ON DELETE SET NULL,

    is_rented               BOOLEAN                     NOT NULL DEFAULT FALSE,
    rental_start_date       DATE,
    rental_end_date         DATE,
    rental_type             rental_type_enum            NOT NULL,
    rental_units            INT                         NOT NULL CHECK (rental_units > 0),
    rental_units_price      NUMERIC(10, 2),
    parking_space_rent      NUMERIC(10, 2),
    misc_rent               NUMERIC(10, 2),
    warm_rent               NUMERIC(10, 2),
    cold_rent               NUMERIC(10, 2),

    created_at              TIMESTAMP WITH TIME ZONE    DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE    DEFAULT NOW(),

    CONSTRAINT chk_tenancy_dates CHECK (rental_end_date IS NULL OR rental_end_date > rental_start_date)
);

CREATE INDEX IF NOT EXISTS idx_tenancy_property_id      ON tenancy (property_id);
CREATE INDEX IF NOT EXISTS idx_tenancy_parking_space_id ON tenancy (parking_space_id);

COMMENT ON TABLE  tenancy              IS '1:n with property. Tracks rental periods and rent amounts.';
COMMENT ON COLUMN tenancy.warm_rent    IS 'Warm rent = cold rent + allocable maintenance costs.';
COMMENT ON COLUMN tenancy.cold_rent    IS 'Pure rent without ancillary costs.';

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

CREATE OR REPLACE FUNCTION update_tenancy_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER tenancy_updated_at
    BEFORE UPDATE ON tenancy
    FOR EACH ROW EXECUTE FUNCTION update_tenancy_updated_at();
