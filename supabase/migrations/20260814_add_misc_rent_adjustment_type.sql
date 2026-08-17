-- Allows tenancy_adjustment_history to track NK-Vorauszahlung (miscRent)
-- changes applied from a Nebenkostenabrechnung, alongside the existing
-- 'rent' and 'renovation' types, so future settlements can prorate the
-- annual prepayment total for changes made during the period.

DO $$
DECLARE
    con_name text;
BEGIN
    SELECT conname INTO con_name
    FROM pg_constraint
    WHERE conrelid = 'tenancy_adjustment_history'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%adjustment_type%';
    IF con_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE tenancy_adjustment_history DROP CONSTRAINT %I', con_name);
    END IF;
END $$;

ALTER TABLE tenancy_adjustment_history
    ADD CONSTRAINT tenancy_adjustment_history_adjustment_type_check
    CHECK (adjustment_type IN ('rent', 'renovation', 'miscRent'));
