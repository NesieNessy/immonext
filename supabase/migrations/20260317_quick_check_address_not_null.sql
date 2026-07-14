-- The 20260304 migration intended street/city to be NOT NULL, but the
-- constraint was never actually enforced on this database (drifted schema).
-- Backfill any legacy NULL values, then enforce the constraint for real.
UPDATE quick_check SET street = '' WHERE street IS NULL;
UPDATE quick_check SET city = '' WHERE city IS NULL;

ALTER TABLE quick_check
    ALTER COLUMN street SET NOT NULL,
    ALTER COLUMN city SET NOT NULL;
