-- Mieterhöhungsschreiben and Sanierungsanpassungsschreiben are now saved as
-- real generated PDFs (like Mietvertrag/Mieterbescheinigung already are),
-- shown in the Anpassungen boxes and the global Dokumente overview.

ALTER TABLE tenancy_document DROP CONSTRAINT tenancy_document_document_type_check;
ALTER TABLE tenancy_document ADD CONSTRAINT tenancy_document_document_type_check
    CHECK (document_type IN ('Ausweis', 'Schufa', 'Bürgschaft', 'Mietvertrag', 'Mieterbescheinigung', 'Mieterhöhungsschreiben', 'Sanierungsanpassungsschreiben'));
