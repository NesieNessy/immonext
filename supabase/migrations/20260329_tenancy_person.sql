-- 1:n with tenancy — each tenant/person on a lease (Hauptmieter + optional
-- additional persons, e.g. a couple both named on the contract).
CREATE TABLE IF NOT EXISTS tenancy_person (
    tenancy_person_id  SERIAL                      PRIMARY KEY,
    tenancy_id           INT                         NOT NULL REFERENCES tenancy(tenancy_id) ON DELETE CASCADE,
    last_name             TEXT,
    first_name            TEXT,
    tax_id                 TEXT,
    is_primary            BOOLEAN                     NOT NULL DEFAULT FALSE,
    sort_order            INT                         NOT NULL DEFAULT 0,
    created_at            TIMESTAMP WITH TIME ZONE    NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMP WITH TIME ZONE    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenancy_person_tenancy_id ON tenancy_person (tenancy_id);

COMMENT ON TABLE tenancy_person IS '1:n with tenancy — each tenant/person named on the lease.';
COMMENT ON COLUMN tenancy_person.tax_id IS 'Steuer-ID (opt.)';

ALTER TABLE tenancy_person ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenancy persons"
    ON tenancy_person FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM tenancy
        JOIN property ON property.property_id = tenancy.property_id
        WHERE tenancy.tenancy_id = tenancy_person.tenancy_id AND property.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert own tenancy persons"
    ON tenancy_person FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM tenancy
        JOIN property ON property.property_id = tenancy.property_id
        WHERE tenancy.tenancy_id = tenancy_person.tenancy_id AND property.user_id = auth.uid()
    ));

CREATE POLICY "Users can update own tenancy persons"
    ON tenancy_person FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM tenancy
        JOIN property ON property.property_id = tenancy.property_id
        WHERE tenancy.tenancy_id = tenancy_person.tenancy_id AND property.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete own tenancy persons"
    ON tenancy_person FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM tenancy
        JOIN property ON property.property_id = tenancy.property_id
        WHERE tenancy.tenancy_id = tenancy_person.tenancy_id AND property.user_id = auth.uid()
    ));

CREATE OR REPLACE FUNCTION update_tenancy_person_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenancy_person_updated_at
    BEFORE UPDATE ON tenancy_person
    FOR EACH ROW EXECUTE FUNCTION update_tenancy_person_updated_at();
