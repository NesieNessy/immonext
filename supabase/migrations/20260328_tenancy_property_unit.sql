-- Links each tenancy period to the Wohneinheit it belongs to.
ALTER TABLE tenancy ADD COLUMN IF NOT EXISTS property_unit_id INT REFERENCES property_unit(property_unit_id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_tenancy_property_unit_id ON tenancy (property_unit_id);
COMMENT ON COLUMN tenancy.property_unit_id IS 'Which Wohneinheit this tenancy period belongs to.';
