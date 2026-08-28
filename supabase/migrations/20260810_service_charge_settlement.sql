-- Annual, property-wide service-charge settlement (Nebenkostenabrechnung).
-- One settlement row per property per billing period, holding the shared
-- cost-position line items (each with both the settlement year's actual
-- amount and next year's budget amount (Wirtschaftsplan) side by side, as
-- shown on the settlement screen). Per-unit shares are computed at
-- read time from living-area proportions — not stored, so they stay correct
-- if a unit's living area is ever corrected after the fact.

-- ==============================================================================
-- CREATE TABLE: service_charge_settlement
-- ==============================================================================
CREATE TABLE IF NOT EXISTS service_charge_settlement (
    service_charge_settlement_id  SERIAL                      PRIMARY KEY,
    property_id                   INT                         NOT NULL REFERENCES property(property_id) ON DELETE CASCADE,
    period_start                  DATE                        NOT NULL,
    period_end                    DATE                        NOT NULL,
    -- Optional attached source document (the utility/property-management invoice
    -- this settlement was built from) — a single reference file, not a full
    -- documents table like tenancy_document; uploaded via the "Upload" action.
    source_document_name          TEXT,
    source_document_path          TEXT,

    created_at                    TIMESTAMP WITH TIME ZONE    DEFAULT NOW(),
    updated_at                    TIMESTAMP WITH TIME ZONE    DEFAULT NOW(),

    CONSTRAINT chk_service_charge_settlement_period CHECK (period_end > period_start)
);

CREATE INDEX IF NOT EXISTS idx_service_charge_settlement_property_id ON service_charge_settlement (property_id);

COMMENT ON TABLE service_charge_settlement IS '1:n with property. One annual Nebenkostenabrechnung billing period per row; cost lines live in service_charge_cost_item.';

ALTER TABLE service_charge_settlement ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own service charge settlements"
    ON service_charge_settlement FOR SELECT
    USING (EXISTS (SELECT 1 FROM property WHERE property.property_id = service_charge_settlement.property_id AND property.user_id = auth.uid()));

CREATE POLICY "Users can insert own service charge settlements"
    ON service_charge_settlement FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM property WHERE property.property_id = service_charge_settlement.property_id AND property.user_id = auth.uid()));

CREATE POLICY "Users can update own service charge settlements"
    ON service_charge_settlement FOR UPDATE
    USING (EXISTS (SELECT 1 FROM property WHERE property.property_id = service_charge_settlement.property_id AND property.user_id = auth.uid()));

CREATE POLICY "Users can delete own service charge settlements"
    ON service_charge_settlement FOR DELETE
    USING (EXISTS (SELECT 1 FROM property WHERE property.property_id = service_charge_settlement.property_id AND property.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION update_service_charge_settlement_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER service_charge_settlement_updated_at
    BEFORE UPDATE ON service_charge_settlement
    FOR EACH ROW EXECUTE FUNCTION update_service_charge_settlement_updated_at();

-- ==============================================================================
-- CREATE TABLE: service_charge_cost_item
-- property_id is denormalized from the settlement (same reasoning as
-- tenancy_adjustment_history) so the generic property-resources dispatcher,
-- which requires a property_id column on every table it serves, can handle it.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS service_charge_cost_item (
    service_charge_cost_item_id   SERIAL                      PRIMARY KEY,
    service_charge_settlement_id  INT                         NOT NULL REFERENCES service_charge_settlement(service_charge_settlement_id) ON DELETE CASCADE,
    property_id                   INT                         NOT NULL REFERENCES property(property_id) ON DELETE CASCADE,
    sort_order                    INT                         NOT NULL DEFAULT 0,
    label                         TEXT                        NOT NULL,
    -- true = allocable (recharged to tenants), false = non-allocable
    -- (e.g. management costs, maintenance reserve contributions) — excluded from the
    -- per-unit share recharge, matching the same distinction already used
    -- for the per-tenancy service-charge breakdown (maintenance_costs.cost_items).
    allocable                     BOOLEAN                     NOT NULL DEFAULT TRUE,
    -- Settlement <settlement year> — the actual incurred cost, whole building.
    actual_amount                 NUMERIC(12, 2),
    -- Budget plan <settlement year + 1> — next year's budgeted cost, whole building.
    budget_amount                 NUMERIC(12, 2),

    created_at                    TIMESTAMP WITH TIME ZONE    DEFAULT NOW(),
    updated_at                    TIMESTAMP WITH TIME ZONE    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_charge_cost_item_settlement_id ON service_charge_cost_item (service_charge_settlement_id);
CREATE INDEX IF NOT EXISTS idx_service_charge_cost_item_property_id ON service_charge_cost_item (property_id);

COMMENT ON TABLE service_charge_cost_item IS '1:n with service_charge_settlement. One cost position (e.g. Wasserversorgung, Aufzug) per row, carrying both the settlement year actual and next year budget amount.';

ALTER TABLE service_charge_cost_item ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own service charge cost items"
    ON service_charge_cost_item FOR SELECT
    USING (EXISTS (SELECT 1 FROM property WHERE property.property_id = service_charge_cost_item.property_id AND property.user_id = auth.uid()));

CREATE POLICY "Users can insert own service charge cost items"
    ON service_charge_cost_item FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM property WHERE property.property_id = service_charge_cost_item.property_id AND property.user_id = auth.uid()));

CREATE POLICY "Users can update own service charge cost items"
    ON service_charge_cost_item FOR UPDATE
    USING (EXISTS (SELECT 1 FROM property WHERE property.property_id = service_charge_cost_item.property_id AND property.user_id = auth.uid()));

CREATE POLICY "Users can delete own service charge cost items"
    ON service_charge_cost_item FOR DELETE
    USING (EXISTS (SELECT 1 FROM property WHERE property.property_id = service_charge_cost_item.property_id AND property.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION update_service_charge_cost_item_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER service_charge_cost_item_updated_at
    BEFORE UPDATE ON service_charge_cost_item
    FOR EACH ROW EXECUTE FUNCTION update_service_charge_cost_item_updated_at();

-- ==============================================================================
-- tenancy_document: generating the PDF attaches the finished statement here too
-- (per "also gets filed under Documents"), same as Mieterhöhungsschreiben.
-- ==============================================================================
ALTER TABLE tenancy_document DROP CONSTRAINT tenancy_document_document_type_check;
ALTER TABLE tenancy_document ADD CONSTRAINT tenancy_document_document_type_check
    CHECK (document_type IN ('Ausweis', 'Schufa', 'Bürgschaft', 'Mietvertrag', 'Mieterbescheinigung', 'Mieterhöhungsschreiben', 'Sanierungsanpassungsschreiben', 'Abnahme', 'Nebenkostenabrechnung'));
