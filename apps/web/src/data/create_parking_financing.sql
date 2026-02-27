-- ==============================================================================
-- ImmoNext – CREATE TABLE: parking_spaces
-- ==============================================================================

CREATE TYPE parking_space_type_enum AS ENUM (
    'GARAGE',
    'OUTDOOR',
    'UNDERGROUND',
    'CARPORT',
    'DUPLEX'
);

CREATE TABLE IF NOT EXISTS parking_spaces (
    parking_space_id        SERIAL                      PRIMARY KEY,
    property_id             INT                         NOT NULL REFERENCES property(property_id) ON DELETE CASCADE,

    parking_space_type      parking_space_type_enum     NOT NULL,
    number_of_parking_spaces INT                        NOT NULL CHECK (number_of_parking_spaces > 0),

    created_at              TIMESTAMP WITH TIME ZONE    DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parking_spaces_property_id ON parking_spaces (property_id);

ALTER TABLE parking_spaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own parking spaces"    ON parking_spaces FOR SELECT USING (EXISTS (SELECT 1 FROM property WHERE property.property_id = parking_spaces.property_id AND property.user_id = auth.uid()));
CREATE POLICY "Users can insert own parking spaces"  ON parking_spaces FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM property WHERE property.property_id = parking_spaces.property_id AND property.user_id = auth.uid()));
CREATE POLICY "Users can update own parking spaces"  ON parking_spaces FOR UPDATE USING (EXISTS (SELECT 1 FROM property WHERE property.property_id = parking_spaces.property_id AND property.user_id = auth.uid()));
CREATE POLICY "Users can delete own parking spaces"  ON parking_spaces FOR DELETE USING (EXISTS (SELECT 1 FROM property WHERE property.property_id = parking_spaces.property_id AND property.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION update_parking_spaces_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER parking_spaces_updated_at BEFORE UPDATE ON parking_spaces FOR EACH ROW EXECUTE FUNCTION update_parking_spaces_updated_at();


-- ==============================================================================
-- ImmoNext – CREATE TABLE: acquisition_costs
-- ==============================================================================

CREATE TABLE IF NOT EXISTS acquisition_costs (
    acquisition_costs_id        SERIAL                      PRIMARY KEY,
    property_id                 INT                         NOT NULL REFERENCES property(property_id) ON DELETE CASCADE,
    parking_space_id            INT                         REFERENCES parking_spaces(parking_space_id) ON DELETE SET NULL,

    property_purchase_price     NUMERIC(14, 2)              NOT NULL,
    price_per_sqm               NUMERIC(10, 2),
    broker                      NUMERIC(6, 4),
    broker_value                NUMERIC(14, 2),
    notary                      NUMERIC(6, 4),
    notary_value                NUMERIC(14, 2),
    land_registry               NUMERIC(6, 4),
    land_registry_value         NUMERIC(14, 2),
    real_estate_tax             NUMERIC(6, 4),
    real_estate_tax_value       NUMERIC(14, 2),
    adjustment_variable         NUMERIC(14, 2),
    adjustment_variable_value   NUMERIC(14, 2),
    total_ancillary_costs_value NUMERIC(14, 2),
    total_ancillary_costs       NUMERIC(6, 4),
    parking_space_purchase_price NUMERIC(14, 2),

    created_at                  TIMESTAMP WITH TIME ZONE    DEFAULT NOW(),
    updated_at                  TIMESTAMP WITH TIME ZONE    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_acquisition_costs_property_id ON acquisition_costs (property_id);

COMMENT ON TABLE acquisition_costs IS '1:n with property. Stores all purchase-related costs (Kaufkosten).';

ALTER TABLE acquisition_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own acquisition costs"    ON acquisition_costs FOR SELECT USING (EXISTS (SELECT 1 FROM property WHERE property.property_id = acquisition_costs.property_id AND property.user_id = auth.uid()));
CREATE POLICY "Users can insert own acquisition costs"  ON acquisition_costs FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM property WHERE property.property_id = acquisition_costs.property_id AND property.user_id = auth.uid()));
CREATE POLICY "Users can update own acquisition costs"  ON acquisition_costs FOR UPDATE USING (EXISTS (SELECT 1 FROM property WHERE property.property_id = acquisition_costs.property_id AND property.user_id = auth.uid()));
CREATE POLICY "Users can delete own acquisition costs"  ON acquisition_costs FOR DELETE USING (EXISTS (SELECT 1 FROM property WHERE property.property_id = acquisition_costs.property_id AND property.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION update_acquisition_costs_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER acquisition_costs_updated_at BEFORE UPDATE ON acquisition_costs FOR EACH ROW EXECUTE FUNCTION update_acquisition_costs_updated_at();


-- ==============================================================================
-- ImmoNext – CREATE TABLE: financing
-- ==============================================================================

CREATE TABLE IF NOT EXISTS financing (
    financing_id                    SERIAL                      PRIMARY KEY,
    property_id                     INT                         NOT NULL REFERENCES property(property_id) ON DELETE CASCADE,

    number_of_loans                 INT                         NOT NULL DEFAULT 1 CHECK (number_of_loans > 0),
    weighted_loan_amount            NUMERIC(14, 2),
    weighted_equity                 NUMERIC(14, 2),
    weighted_interest_rate          NUMERIC(6, 4),
    weighted_repayment_rate         NUMERIC(6, 4),
    weighted_monthly_debt_service   NUMERIC(10, 2),
    single_loan_amount              NUMERIC(14, 2),
    single_equity                   NUMERIC(14, 2),
    single_interest_rate            NUMERIC(6, 4),
    single_repayment_rate           NUMERIC(6, 4),
    single_monthly_debt_service     NUMERIC(10, 2),
    single_repayment_start_date     DATE,
    fixed_interest_period           NUMERIC(6, 2),
    interest_rate                   NUMERIC(6, 4),
    regular_interest_rate           NUMERIC(6, 4),

    created_at                      TIMESTAMP WITH TIME ZONE    DEFAULT NOW(),
    updated_at                      TIMESTAMP WITH TIME ZONE    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financing_property_id ON financing (property_id);

COMMENT ON TABLE financing IS '1:n with property. Tracks loan structure and debt service.';

ALTER TABLE financing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own financing"    ON financing FOR SELECT USING (EXISTS (SELECT 1 FROM property WHERE property.property_id = financing.property_id AND property.user_id = auth.uid()));
CREATE POLICY "Users can insert own financing"  ON financing FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM property WHERE property.property_id = financing.property_id AND property.user_id = auth.uid()));
CREATE POLICY "Users can update own financing"  ON financing FOR UPDATE USING (EXISTS (SELECT 1 FROM property WHERE property.property_id = financing.property_id AND property.user_id = auth.uid()));
CREATE POLICY "Users can delete own financing"  ON financing FOR DELETE USING (EXISTS (SELECT 1 FROM property WHERE property.property_id = financing.property_id AND property.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION update_financing_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER financing_updated_at BEFORE UPDATE ON financing FOR EACH ROW EXECUTE FUNCTION update_financing_updated_at();


-- ==============================================================================
-- ImmoNext – CREATE TABLE: financing_calculation
-- ==============================================================================

CREATE TABLE IF NOT EXISTS financing_calculation (
    financing_calculation_id    SERIAL                      PRIMARY KEY,
    financing_id                INT                         NOT NULL REFERENCES financing(financing_id) ON DELETE CASCADE,

    month                       INT                         NOT NULL CHECK (month > 0),
    monthly_debt_service        NUMERIC(10, 2),
    single_monthly_debt_service INT,
    interest_portion            NUMERIC(10, 2),
    repayment_portion           NUMERIC(10, 2),
    remaining_debt              NUMERIC(14, 2),
    repayment_year              INT,
    repayment_month             INT,

    created_at                  TIMESTAMP WITH TIME ZONE    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financing_calculation_financing_id ON financing_calculation (financing_id);

COMMENT ON TABLE financing_calculation IS '1:n with financing. Monthly amortisation schedule.';

ALTER TABLE financing_calculation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own financing calculations"
    ON financing_calculation FOR SELECT
    USING (EXISTS (SELECT 1 FROM financing JOIN property ON property.property_id = financing.property_id WHERE financing.financing_id = financing_calculation.financing_id AND property.user_id = auth.uid()));

CREATE POLICY "Users can insert own financing calculations"
    ON financing_calculation FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM financing JOIN property ON property.property_id = financing.property_id WHERE financing.financing_id = financing_calculation.financing_id AND property.user_id = auth.uid()));

CREATE POLICY "Users can delete own financing calculations"
    ON financing_calculation FOR DELETE
    USING (EXISTS (SELECT 1 FROM financing JOIN property ON property.property_id = financing.property_id WHERE financing.financing_id = financing_calculation.financing_id AND property.user_id = auth.uid()));


-- ==============================================================================
-- ImmoNext – CREATE TABLE: interest_calculation
-- ==============================================================================

CREATE TABLE IF NOT EXISTS interest_calculation (
    interest_calculation_id     SERIAL                      PRIMARY KEY,
    financing_id                INT                         NOT NULL REFERENCES financing(financing_id) ON DELETE CASCADE,

    modification_variable       NUMERIC(6, 4),
    fixed_interest_period       NUMERIC(6, 2),
    fixed_interest_period_percent NUMERIC(6, 4),
    estimated_interest_rate     NUMERIC(6, 4),
    loan_to_value_equity_share  NUMERIC(6, 4),
    equity_thresholds           NUMERIC(6, 4),
    equity_thresholds_corridor  NUMERIC(6, 4),
    equity_thresholds_percent   NUMERIC(6, 4),

    created_at                  TIMESTAMP WITH TIME ZONE    DEFAULT NOW(),
    updated_at                  TIMESTAMP WITH TIME ZONE    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interest_calculation_financing_id ON interest_calculation (financing_id);

COMMENT ON TABLE interest_calculation IS '1:n with financing. Models interest rate scenarios and modifications.';

ALTER TABLE interest_calculation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own interest calculations"
    ON interest_calculation FOR SELECT
    USING (EXISTS (SELECT 1 FROM financing JOIN property ON property.property_id = financing.property_id WHERE financing.financing_id = interest_calculation.financing_id AND property.user_id = auth.uid()));

CREATE POLICY "Users can insert own interest calculations"
    ON interest_calculation FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM financing JOIN property ON property.property_id = financing.property_id WHERE financing.financing_id = interest_calculation.financing_id AND property.user_id = auth.uid()));

CREATE POLICY "Users can update own interest calculations"
    ON interest_calculation FOR UPDATE
    USING (EXISTS (SELECT 1 FROM financing JOIN property ON property.property_id = financing.property_id WHERE financing.financing_id = interest_calculation.financing_id AND property.user_id = auth.uid()));

CREATE POLICY "Users can delete own interest calculations"
    ON interest_calculation FOR DELETE
    USING (EXISTS (SELECT 1 FROM financing JOIN property ON property.property_id = financing.property_id WHERE financing.financing_id = interest_calculation.financing_id AND property.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION update_interest_calculation_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER interest_calculation_updated_at BEFORE UPDATE ON interest_calculation FOR EACH ROW EXECUTE FUNCTION update_interest_calculation_updated_at();
