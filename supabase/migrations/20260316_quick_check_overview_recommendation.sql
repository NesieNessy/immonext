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
    qc.property_id,
    rec.recommendation_score,
    rec.recommendation_level
FROM quick_check qc
LEFT JOIN detail_check_recommendation rec
  ON rec.user_id = qc.user_id
 AND rec.workflow_id = 'quick-check:' || qc.quick_check_id::text;
