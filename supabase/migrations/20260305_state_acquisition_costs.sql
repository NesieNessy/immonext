CREATE TABLE IF NOT EXISTS state_acquisition_costs (
    state                          CHAR(2) PRIMARY KEY,
    broker_percent                 NUMERIC(5, 2) NOT NULL DEFAULT 3.57,
    notary_percent                 NUMERIC(5, 2) NOT NULL DEFAULT 1.50,
    land_registry_percent          NUMERIC(5, 2) NOT NULL DEFAULT 0.50,
    property_transfer_tax_percent  NUMERIC(5, 2) NOT NULL,
    created_at                     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at                     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

INSERT INTO state_acquisition_costs (
    state,
    broker_percent,
    notary_percent,
    land_registry_percent,
    property_transfer_tax_percent
) VALUES
    ('BY', 3.57, 1.50, 0.50, 3.50),
    ('BE', 3.57, 1.50, 0.50, 6.00),
    ('HH', 3.57, 1.50, 0.50, 4.50),
    ('HB', 3.57, 1.50, 0.50, 5.00),
    ('SH', 3.57, 1.50, 0.50, 6.50),
    ('MV', 3.57, 1.50, 0.50, 5.00),
    ('BB', 3.57, 1.50, 0.50, 6.50),
    ('ST', 3.57, 1.50, 0.50, 5.00),
    ('TH', 3.57, 1.50, 0.50, 6.50),
    ('SN', 3.57, 1.50, 0.50, 3.50),
    ('NI', 3.57, 1.50, 0.50, 5.00),
    ('NW', 3.57, 1.50, 0.50, 6.50),
    ('HE', 3.57, 1.50, 0.50, 6.00),
    ('RP', 3.57, 1.50, 0.50, 5.00),
    ('SL', 3.57, 1.50, 0.50, 6.50),
    ('BW', 3.57, 1.50, 0.50, 5.00)
ON CONFLICT (state) DO UPDATE SET
    broker_percent = EXCLUDED.broker_percent,
    notary_percent = EXCLUDED.notary_percent,
    land_registry_percent = EXCLUDED.land_registry_percent,
    property_transfer_tax_percent = EXCLUDED.property_transfer_tax_percent,
    updated_at = NOW();

CREATE TABLE IF NOT EXISTS detail_check_acquisition_costs (
    acquisition_cost_id             SERIAL PRIMARY KEY,
    user_id                         UUID NOT NULL REFERENCES personal_data(user_id) ON DELETE CASCADE,
    quick_check_id                  INT REFERENCES quick_check(quick_check_id) ON DELETE SET NULL,
    workflow_id                     TEXT NOT NULL,
    state                           CHAR(2),
    postal_code                     VARCHAR(10),
    living_area_m2                  NUMERIC(10, 2),
    purchase_price                  NUMERIC(14, 2) NOT NULL DEFAULT 0,
    parking_purchase_price          NUMERIC(14, 2) NOT NULL DEFAULT 0,
    broker_percent                  NUMERIC(5, 2) NOT NULL DEFAULT 3.57,
    notary_percent                  NUMERIC(5, 2) NOT NULL DEFAULT 1.50,
    land_registry_percent           NUMERIC(5, 2) NOT NULL DEFAULT 0.50,
    property_transfer_tax_percent   NUMERIC(5, 2),
    purchase_price_per_m2           NUMERIC(14, 2),
    broker_amount                   NUMERIC(14, 2) NOT NULL DEFAULT 0,
    notary_amount                   NUMERIC(14, 2) NOT NULL DEFAULT 0,
    land_registry_amount            NUMERIC(14, 2) NOT NULL DEFAULT 0,
    property_transfer_tax_amount    NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_additional_costs          NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_costs                     NUMERIC(14, 2) NOT NULL DEFAULT 0,
    created_at                      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, workflow_id)
);

CREATE INDEX IF NOT EXISTS idx_detail_check_acquisition_costs_user_id
    ON detail_check_acquisition_costs(user_id);
CREATE INDEX IF NOT EXISTS idx_detail_check_acquisition_costs_quick_check_id
    ON detail_check_acquisition_costs(quick_check_id);
