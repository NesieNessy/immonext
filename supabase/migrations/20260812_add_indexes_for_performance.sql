-- Add indexes to speed up property_unit lookups and tenancy_adjustment_history
CREATE INDEX IF NOT EXISTS idx_property_unit_property_sort ON property_unit(property_id, sort_order, property_unit_id);

CREATE INDEX IF NOT EXISTS idx_tenancy_adj_property_created_at ON tenancy_adjustment_history(property_id, created_at DESC);

-- Note: Run these in your Supabase or Postgres instance. They are low-risk but
-- should be applied in staging first and monitored.
