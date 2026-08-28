-- Tenant history: per-past-tenancy move-out checklist (move-out protocol,
-- deposit paid out) plus an "Abnahme" document type for the move-out
-- protocol upload alongside Mietvertrag/Schufa in the documents column.

ALTER TABLE tenancy
    ADD COLUMN IF NOT EXISTS acceptance_protocol BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS deposit_paid_out BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE tenancy_document DROP CONSTRAINT tenancy_document_document_type_check;
ALTER TABLE tenancy_document ADD CONSTRAINT tenancy_document_document_type_check
    CHECK (document_type IN ('Ausweis', 'Schufa', 'Bürgschaft', 'Mietvertrag', 'Mieterbescheinigung', 'Mieterhöhungsschreiben', 'Sanierungsanpassungsschreiben', 'Abnahme'));
