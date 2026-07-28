-- Persist the resolved RND/AfA values alongside the mode, mirroring
-- detail_check_depreciation's remaining_useful_life_years / afa_percent.
-- This lets a Standard-mode save overwrite any stale individually-computed
-- values instead of only clearing the modernization selections.
ALTER TABLE property_rnd
    ADD COLUMN IF NOT EXISTS remaining_useful_life_years NUMERIC(10, 2) NOT NULL DEFAULT 50,
    ADD COLUMN IF NOT EXISTS afa_percent                  NUMERIC(7, 4) NOT NULL DEFAULT 2;

UPDATE property_rnd
SET remaining_useful_life_years = 50,
    afa_percent = 2
WHERE rnd_mode = 'STANDARD';
