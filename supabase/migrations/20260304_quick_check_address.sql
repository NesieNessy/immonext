-- Store the full first-assessment form snapshot for local and fresh databases.
ALTER TABLE quick_check
    ADD COLUMN IF NOT EXISTS street VARCHAR(120) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS city VARCHAR(120) NOT NULL DEFAULT '';

ALTER TABLE quick_check
    ALTER COLUMN street DROP DEFAULT,
    ALTER COLUMN city DROP DEFAULT;

COMMENT ON COLUMN quick_check.street IS 'Street and house number snapshot entered during quick-check.';
COMMENT ON COLUMN quick_check.city IS 'City snapshot entered during quick-check.';

DROP VIEW IF EXISTS quick_check_overview;

CREATE VIEW quick_check_overview AS
SELECT
    qc.quick_check_id,
    qc.user_id,
    qc.created_at           AS ingest_date,
    qc.portal_id,
    qc.data_entry_source,
    qc.kpf_multiplier,
    qc.purchase_price,
    qc.cold_rent,
    qc.street,
    qc.postal_code,
    qc.city,
    qc.year_of_construction,
    qc.condition,
    qc.status,
    qc.finalised_action,
    qc.detail_check,
    qc.property_id
FROM quick_check qc;
