-- Determines whether the tenant-data screen shows the units
-- overview first (>1) or goes straight to the single unit's tenant page (=1).
ALTER TABLE property ADD COLUMN IF NOT EXISTS number_of_units INT NOT NULL DEFAULT 1 CHECK (number_of_units > 0);
COMMENT ON COLUMN property.number_of_units IS 'How many rentable Wohneinheiten this property has.';
