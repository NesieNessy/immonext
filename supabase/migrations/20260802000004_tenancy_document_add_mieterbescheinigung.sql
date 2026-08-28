-- The tenant-certificate (Mieterbescheinigung) generator now also occupies a row in the
-- "Unterlagen" table (for the signed/uploaded copy), so it needs to be an
-- allowed document_type alongside Ausweis/Schufa/Bürgschaft/Mietvertrag.

ALTER TABLE tenancy_document DROP CONSTRAINT tenancy_document_document_type_check;
ALTER TABLE tenancy_document ADD CONSTRAINT tenancy_document_document_type_check
    CHECK (document_type IN ('Ausweis', 'Schufa', 'Bürgschaft', 'Mietvertrag', 'Mieterbescheinigung'));
