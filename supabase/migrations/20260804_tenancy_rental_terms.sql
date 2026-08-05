-- Additional rental-agreement clauses shown on the "Mietvertrag generieren"
-- page (§5-§7 of the generated contract): rent-adjustment schedule, and the
-- Haustierhaltung/Schönheitsreparaturen/Untervermietung clauses. Stored on
-- the tenancy itself since they're per-tenancy terms, same as deposit/rents.

ALTER TABLE tenancy
    ADD COLUMN IF NOT EXISTS next_rent_adjustment_date DATE,
    ADD COLUMN IF NOT EXISTS next_rent_adjustment_amount NUMERIC,
    -- NULL = not captured yet, true = planned, false = not planned.
    ADD COLUMN IF NOT EXISTS renovation_adjustment_planned BOOLEAN,
    ADD COLUMN IF NOT EXISTS pets_allowed TEXT
        CHECK (pets_allowed IN ('Erlaubt', 'Nicht erlaubt', 'Nach Vereinbarung')),
    ADD COLUMN IF NOT EXISTS redecoration_clause TEXT
        CHECK (redecoration_clause IN ('Mieter trägt Kosten (üblich)', 'Vermieter trägt Kosten', 'Individuelle Regelung')),
    ADD COLUMN IF NOT EXISTS sublet_allowed TEXT
        CHECK (sublet_allowed IN ('Erlaubt', 'Nicht erlaubt', 'Nach Zustimmung')),
    ADD COLUMN IF NOT EXISTS additional_terms TEXT;
