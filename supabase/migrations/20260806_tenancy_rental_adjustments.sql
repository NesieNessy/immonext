-- Full "Mietvertrag" tab: Sanierungsanpassung scheduling (start/end/amount),
-- reminder-date overrides for both adjustment types, an itemized Nebenkosten
-- breakdown on maintenance_costs, and a lightweight adjustment history log
-- used by the "Historie" buttons.

ALTER TABLE tenancy
    ADD COLUMN IF NOT EXISTS renovation_adjustment_start_date DATE,
    ADD COLUMN IF NOT EXISTS renovation_adjustment_end_date DATE,
    ADD COLUMN IF NOT EXISTS renovation_adjustment_amount NUMERIC,
    ADD COLUMN IF NOT EXISTS rent_adjustment_reminder_date DATE,
    ADD COLUMN IF NOT EXISTS renovation_adjustment_reminder_date DATE;

ALTER TABLE maintenance_costs
    ADD COLUMN IF NOT EXISTS cost_items JSONB;

-- ==============================================================================
-- CREATE TABLE: tenancy_adjustment_history
-- Append-only log of accepted rent/Sanierungs adjustments, shown in the
-- "Historie" modal next to each Anpassung. property_id is denormalized from
-- tenancy so the resource can be served by the generic property-resources
-- dispatcher (which requires a property_id column on every table it serves).
-- ==============================================================================
CREATE TABLE IF NOT EXISTS tenancy_adjustment_history (
    history_id       SERIAL                      PRIMARY KEY,
    tenancy_id        INT                         NOT NULL REFERENCES tenancy(tenancy_id) ON DELETE CASCADE,
    property_id       INT                         NOT NULL REFERENCES property(property_id) ON DELETE CASCADE,
    adjustment_type   TEXT                        NOT NULL CHECK (adjustment_type IN ('rent', 'renovation')),
    effective_date    DATE,
    amount            NUMERIC,
    note              TEXT,

    created_at        TIMESTAMP WITH TIME ZONE    DEFAULT NOW(),
    updated_at        TIMESTAMP WITH TIME ZONE    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenancy_adjustment_history_tenancy_id ON tenancy_adjustment_history (tenancy_id);

COMMENT ON TABLE tenancy_adjustment_history IS '1:n with tenancy. Append-only log of accepted Mietanpassung/Sanierungsanpassung entries.';

ALTER TABLE tenancy_adjustment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenancy adjustment history"
    ON tenancy_adjustment_history FOR SELECT
    USING (EXISTS (SELECT 1 FROM property WHERE property.property_id = tenancy_adjustment_history.property_id AND property.user_id = auth.uid()));

CREATE POLICY "Users can insert own tenancy adjustment history"
    ON tenancy_adjustment_history FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM property WHERE property.property_id = tenancy_adjustment_history.property_id AND property.user_id = auth.uid()));

CREATE POLICY "Users can update own tenancy adjustment history"
    ON tenancy_adjustment_history FOR UPDATE
    USING (EXISTS (SELECT 1 FROM property WHERE property.property_id = tenancy_adjustment_history.property_id AND property.user_id = auth.uid()));

CREATE POLICY "Users can delete own tenancy adjustment history"
    ON tenancy_adjustment_history FOR DELETE
    USING (EXISTS (SELECT 1 FROM property WHERE property.property_id = tenancy_adjustment_history.property_id AND property.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION update_tenancy_adjustment_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenancy_adjustment_history_updated_at
    BEFORE UPDATE ON tenancy_adjustment_history
    FOR EACH ROW EXECUTE FUNCTION update_tenancy_adjustment_history_updated_at();
