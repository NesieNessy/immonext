CREATE TABLE IF NOT EXISTS detail_check_financing (
    financing_id                    SERIAL PRIMARY KEY,
    user_id                         UUID NOT NULL REFERENCES personal_data(user_id) ON DELETE CASCADE,
    quick_check_id                  INT REFERENCES quick_check(quick_check_id) ON DELETE SET NULL,
    workflow_id                     TEXT NOT NULL,
    selected_variant                TEXT NOT NULL DEFAULT 'OFFER',
    offer_renovation_costs          NUMERIC(14, 2) NOT NULL DEFAULT 0,
    offer_equity                    NUMERIC(14, 2) NOT NULL DEFAULT 0,
    offer_interest_period_years     INT NOT NULL DEFAULT 10,
    offer_interest_rate             NUMERIC(5, 2) NOT NULL DEFAULT 3.40,
    offer_monthly_debt_service      NUMERIC(14, 2) NOT NULL DEFAULT 0,
    individual_purchase_price       NUMERIC(14, 2) NOT NULL DEFAULT 0,
    individual_parking_price        NUMERIC(14, 2) NOT NULL DEFAULT 0,
    individual_renovation_costs     NUMERIC(14, 2) NOT NULL DEFAULT 0,
    individual_equity               NUMERIC(14, 2) NOT NULL DEFAULT 0,
    individual_interest_period_years INT NOT NULL DEFAULT 10,
    individual_interest_rate        NUMERIC(5, 2) NOT NULL DEFAULT 3.40,
    individual_monthly_debt_service NUMERIC(14, 2) NOT NULL DEFAULT 0,
    repayment_rate                  NUMERIC(5, 2) NOT NULL DEFAULT 2.00,
    interest_adjustment_factor      NUMERIC(6, 3) NOT NULL DEFAULT 1.000,
    created_at                      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, workflow_id)
);

CREATE INDEX IF NOT EXISTS idx_detail_check_financing_user_id
    ON detail_check_financing(user_id);
CREATE INDEX IF NOT EXISTS idx_detail_check_financing_quick_check_id
    ON detail_check_financing(quick_check_id);
