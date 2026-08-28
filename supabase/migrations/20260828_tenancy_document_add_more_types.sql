-- Adds three more per-person tenant document categories: Gehaltsnachweise
-- (salary statements), Vormieterbescheinigung (previous-landlord reference)
-- and Sonstiges (catch-all), alongside the existing Ausweis/Schufa/Bürgschaft.

ALTER TABLE tenancy_document DROP CONSTRAINT tenancy_document_document_type_check;
ALTER TABLE tenancy_document ADD CONSTRAINT tenancy_document_document_type_check
    CHECK (document_type IN ('Ausweis', 'Schufa', 'Bürgschaft', 'Gehaltsnachweise', 'Vormieterbescheinigung', 'Sonstiges', 'Mietvertrag', 'Mieterbescheinigung', 'Mieterhöhungsschreiben', 'Sanierungsanpassungsschreiben', 'Abnahme', 'Nebenkostenabrechnung'));
