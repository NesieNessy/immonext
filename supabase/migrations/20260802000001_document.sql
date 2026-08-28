-- Backs the global "Dokumente" page — a cross-property document library,
-- distinct from tenancy_document (which only covers per-tenancy Unterlagen).
-- A document belongs to the user and, depending on its category, is
-- optionally linked to one Bestandsobjekt (property) or one Detailbewertung
-- (quick_check with detail_check = true). "Persönlich" documents link to
-- neither. Actual file bytes live in Supabase Storage (bucket "documents")
-- — this table just tracks which file belongs to what.

CREATE TABLE IF NOT EXISTS document (
    document_id     SERIAL                      PRIMARY KEY,
    user_id         UUID                        NOT NULL,
    category        TEXT                        NOT NULL CHECK (category IN ('Persönlich', 'Bestandsobjekt', 'Detailbewertung')),
    name            TEXT                        NOT NULL,
    property_id     INT                         REFERENCES property(property_id) ON DELETE CASCADE,
    quick_check_id  INT                         REFERENCES quick_check(quick_check_id) ON DELETE CASCADE,
    document_date   DATE,
    file_name       TEXT                        NOT NULL,
    storage_path    TEXT                        NOT NULL UNIQUE,
    content_type    TEXT,
    file_size       INT,
    created_at      TIMESTAMP WITH TIME ZONE    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_user_id ON document (user_id);
CREATE INDEX IF NOT EXISTS idx_document_property_id ON document (property_id);
CREATE INDEX IF NOT EXISTS idx_document_quick_check_id ON document (quick_check_id);

COMMENT ON TABLE document IS 'Metadata for files shown on the global Dokumente page; bytes live in the documents storage bucket.';

ALTER TABLE document ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents"
    ON document FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own documents"
    ON document FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own documents"
    ON document FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete own documents"
    ON document FOR DELETE
    USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION update_document_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER document_updated_at
    BEFORE UPDATE ON document
    FOR EACH ROW EXECUTE FUNCTION update_document_updated_at();
