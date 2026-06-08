CREATE TABLE IF NOT EXISTS detail_check_rental (
    rental_id                  SERIAL PRIMARY KEY,
    user_id                    UUID NOT NULL REFERENCES personal_data(user_id) ON DELETE CASCADE,
    quick_check_id             INT REFERENCES quick_check(quick_check_id) ON DELETE SET NULL,
    workflow_id                TEXT NOT NULL,
    valuation_date             DATE NOT NULL,
    is_rented                  BOOLEAN NOT NULL DEFAULT TRUE,
    source                     TEXT NOT NULL DEFAULT 'MANUELL',
    cold_rent                  NUMERIC(14, 2) NOT NULL DEFAULT 0,
    parking_rent               NUMERIC(14, 2) NOT NULL DEFAULT 0,
    service_charges_allocable  NUMERIC(14, 2) NOT NULL DEFAULT 0,
    service_charges_non_allocable NUMERIC(14, 2) NOT NULL DEFAULT 0,
    service_charges_total      NUMERIC(14, 2) NOT NULL DEFAULT 0,
    plausibility_warning_nk    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at                 TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at                 TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, workflow_id)
);

CREATE INDEX IF NOT EXISTS idx_detail_check_rental_user_id
    ON detail_check_rental(user_id);
CREATE INDEX IF NOT EXISTS idx_detail_check_rental_quick_check_id
    ON detail_check_rental(quick_check_id);
