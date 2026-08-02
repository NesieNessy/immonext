-- Backs the "Unterlagen" table on the tenant-unit-detail page. Ausweis/
-- Schufa/Bürgschaft are per tenancy_person; Mietvertrag is per tenancy
-- (tenancy_person_id NULL). Actual file bytes live in Supabase Storage
-- (see 20260403_tenancy_document_storage.sql) — this table just tracks
-- which file belongs to which storage object.

CREATE TABLE IF NOT EXISTS tenancy_document (
    tenancy_document_id  SERIAL                      PRIMARY KEY,
    tenancy_id             INT                         NOT NULL REFERENCES tenancy(tenancy_id) ON DELETE CASCADE,
    tenancy_person_id      INT                         REFERENCES tenancy_person(tenancy_person_id) ON DELETE CASCADE,
    document_type          TEXT                        NOT NULL CHECK (document_type IN ('Ausweis', 'Schufa', 'Bürgschaft', 'Mietvertrag')),
    file_name               TEXT                        NOT NULL,
    storage_path            TEXT                        NOT NULL UNIQUE,
    content_type             TEXT,
    file_size                INT,
    created_at               TIMESTAMP WITH TIME ZONE    NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMP WITH TIME ZONE    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenancy_document_tenancy_id ON tenancy_document (tenancy_id);
CREATE INDEX IF NOT EXISTS idx_tenancy_document_tenancy_person_id ON tenancy_document (tenancy_person_id);

-- One current file per (tenancy, person-or-shared, document type) — a
-- re-upload replaces the previous row rather than adding a second one.
CREATE UNIQUE INDEX IF NOT EXISTS uq_tenancy_document_slot
    ON tenancy_document (tenancy_id, document_type, COALESCE(tenancy_person_id, 0));

COMMENT ON TABLE tenancy_document IS 'Metadata for files uploaded in the Unterlagen section; bytes live in the tenancy-documents storage bucket.';

ALTER TABLE tenancy_document ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenancy documents"
    ON tenancy_document FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM tenancy
        JOIN property ON property.property_id = tenancy.property_id
        WHERE tenancy.tenancy_id = tenancy_document.tenancy_id AND property.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert own tenancy documents"
    ON tenancy_document FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM tenancy
        JOIN property ON property.property_id = tenancy.property_id
        WHERE tenancy.tenancy_id = tenancy_document.tenancy_id AND property.user_id = auth.uid()
    ));

CREATE POLICY "Users can update own tenancy documents"
    ON tenancy_document FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM tenancy
        JOIN property ON property.property_id = tenancy.property_id
        WHERE tenancy.tenancy_id = tenancy_document.tenancy_id AND property.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete own tenancy documents"
    ON tenancy_document FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM tenancy
        JOIN property ON property.property_id = tenancy.property_id
        WHERE tenancy.tenancy_id = tenancy_document.tenancy_id AND property.user_id = auth.uid()
    ));

CREATE OR REPLACE FUNCTION update_tenancy_document_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenancy_document_updated_at
    BEFORE UPDATE ON tenancy_document
    FOR EACH ROW EXECUTE FUNCTION update_tenancy_document_updated_at();
