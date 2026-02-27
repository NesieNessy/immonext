-- ==============================================================================
-- ImmoNext – CREATE TABLE: rent_index
-- Depends on: city (city_id)
-- ==============================================================================

CREATE TYPE rent_index_methodology_enum AS ENUM (
    'QUALIFIED',
    'SIMPLE',
    'EMPIRICAL'
);

CREATE TABLE IF NOT EXISTS rent_index (
    rent_index_id   SERIAL                          PRIMARY KEY,
    city_id         INT                             NOT NULL REFERENCES city(city_id) ON DELETE RESTRICT,

    valid_from      DATE                            NOT NULL,
    valid_until     DATE,
    methodology     rent_index_methodology_enum     NOT NULL,
    reference_rents NUMERIC(10, 2)                  NOT NULL,

    created_at      TIMESTAMP WITH TIME ZONE        DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE        DEFAULT NOW(),

    CONSTRAINT chk_rent_index_dates CHECK (valid_until IS NULL OR valid_until > valid_from)
);

CREATE INDEX IF NOT EXISTS idx_rent_index_city_id   ON rent_index (city_id);
CREATE INDEX IF NOT EXISTS idx_rent_index_valid_from ON rent_index (valid_from);

COMMENT ON TABLE  rent_index                  IS 'Mietspiegel — versioned rent index per city.';
COMMENT ON COLUMN rent_index.reference_rents  IS 'Reference rent per sqm in EUR.';
COMMENT ON COLUMN rent_index.valid_until      IS 'NULL = currently active index.';

ALTER TABLE rent_index ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view rent index"
    ON rent_index FOR SELECT
    USING (auth.role() = 'authenticated');


CREATE OR REPLACE FUNCTION update_rent_index_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER rent_index_updated_at BEFORE UPDATE ON rent_index FOR EACH ROW EXECUTE FUNCTION update_rent_index_updated_at();


-- ==============================================================================
-- ImmoNext – CREATE TABLE: building_proportion
-- Depends on: property (property_id), acquisition_costs (acquisition_costs_id)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS building_proportion (
    building_proportion_id  SERIAL                      PRIMARY KEY,
    property_id             INT                         NOT NULL UNIQUE REFERENCES property(property_id) ON DELETE CASCADE,
    acquisition_costs_id    INT                         REFERENCES acquisition_costs(acquisition_costs_id) ON DELETE SET NULL,

    total_area              NUMERIC(10, 2),
    total_area_share        NUMERIC(6, 4),
    land_value              NUMERIC(14, 2),
    land_and_soil           NUMERIC(14, 2),
    building_factor         NUMERIC(8, 4),
    building_value          NUMERIC(14, 2),
    numerator               NUMERIC(10, 4),
    denominator             NUMERIC(10, 4),
    ancillary_cost_share    NUMERIC(6, 4),
    building_depreciation   NUMERIC(10, 2),

    created_at              TIMESTAMP WITH TIME ZONE    DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_building_proportion_property_id ON building_proportion (property_id);

COMMENT ON TABLE  building_proportion                 IS '1:1 with property. Splits total value between land and building for tax depreciation.';
COMMENT ON COLUMN building_proportion.building_factor IS 'Ratio of building value to total property value.';

ALTER TABLE building_proportion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own building proportion"
    ON building_proportion FOR SELECT
    USING (EXISTS (SELECT 1 FROM property WHERE property.property_id = building_proportion.property_id AND property.user_id = auth.uid()));

CREATE POLICY "Users can insert own building proportion"
    ON building_proportion FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM property WHERE property.property_id = building_proportion.property_id AND property.user_id = auth.uid()));

CREATE POLICY "Users can update own building proportion"
    ON building_proportion FOR UPDATE
    USING (EXISTS (SELECT 1 FROM property WHERE property.property_id = building_proportion.property_id AND property.user_id = auth.uid()));

CREATE POLICY "Users can delete own building proportion"
    ON building_proportion FOR DELETE
    USING (EXISTS (SELECT 1 FROM property WHERE property.property_id = building_proportion.property_id AND property.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION update_building_proportion_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER building_proportion_updated_at BEFORE UPDATE ON building_proportion FOR EACH ROW EXECUTE FUNCTION update_building_proportion_updated_at();


-- ==============================================================================
-- ImmoNext – CREATE TABLE: depreciation
-- Merged from: Depreciation (AfA) + DepreciationCalculation (AfA)
-- Depends on: property (property_id), system_config (config_id)
-- ==============================================================================

CREATE TYPE residential_type_enum AS ENUM (
    'NEW_BUILD',
    'EXISTING',
    'LISTED_BUILDING',
    'SOCIAL_HOUSING'
);

CREATE TABLE IF NOT EXISTS depreciation (
    depreciation_id             SERIAL                      PRIMARY KEY,
    property_id                 INT                         NOT NULL UNIQUE REFERENCES property(property_id) ON DELETE CASCADE,
    config_id                   INT                         REFERENCES system_config(config_id) ON DELETE SET NULL,

    -- From original Depreciation table
    depreciation_type           VARCHAR(50),
    depreciation_calculation    NUMERIC(10, 2),
    depreciation_year           INT,

    -- Merged from DepreciationCalculation
    residential_type            residential_type_enum,
    roof_renewal                NUMERIC(6, 4),
    windows_exterior_doors      NUMERIC(6, 4),
    piping_systems              NUMERIC(6, 4),
    heating_system              NUMERIC(6, 4),
    exterior_wall_insulation    NUMERIC(6, 4),
    bathrooms                   NUMERIC(6, 4),
    interior_fitting            NUMERIC(6, 4),
    floorplan_improvement       NUMERIC(6, 4),
    modernisation_points        NUMERIC(6, 2),
    age                         NUMERIC(8, 2),
    total_useful_life           NUMERIC(8, 2),
    remaining_useful_life_years NUMERIC(8, 2),
    depreciation_rate_percent   NUMERIC(6, 4),

    created_at                  TIMESTAMP WITH TIME ZONE    DEFAULT NOW(),
    updated_at                  TIMESTAMP WITH TIME ZONE    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_depreciation_property_id ON depreciation (property_id);

COMMENT ON TABLE  depreciation                          IS '1:1 with property. Merged AfA table — inputs and calculation parameters.';
COMMENT ON COLUMN depreciation.depreciation_rate_percent IS 'Annual AfA rate, e.g. 0.02 = 2%.';
COMMENT ON COLUMN depreciation.modernisation_points      IS 'Points-based modernisation score per §22 Abs. 3 ImmoWertV.';

ALTER TABLE depreciation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own depreciation"
    ON depreciation FOR SELECT
    USING (EXISTS (SELECT 1 FROM property WHERE property.property_id = depreciation.property_id AND property.user_id = auth.uid()));

CREATE POLICY "Users can insert own depreciation"
    ON depreciation FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM property WHERE property.property_id = depreciation.property_id AND property.user_id = auth.uid()));

CREATE POLICY "Users can update own depreciation"
    ON depreciation FOR UPDATE
    USING (EXISTS (SELECT 1 FROM property WHERE property.property_id = depreciation.property_id AND property.user_id = auth.uid()));

CREATE POLICY "Users can delete own depreciation"
    ON depreciation FOR DELETE
    USING (EXISTS (SELECT 1 FROM property WHERE property.property_id = depreciation.property_id AND property.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION update_depreciation_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER depreciation_updated_at BEFORE UPDATE ON depreciation FOR EACH ROW EXECUTE FUNCTION update_depreciation_updated_at();


-- ==============================================================================
-- ImmoNext – VIEW: metrics_today
-- Aggregates key metrics from tenancy, maintenance_costs, financing,
-- depreciation and personal_data per property.
-- No table — computed on demand.
-- ==============================================================================

CREATE OR REPLACE VIEW metrics_today AS
SELECT
    pd.user_id,
    p.property_id,
    t.tenancy_id,
    t.cold_rent,
    t.warm_rent,
    t.is_rented,
    mc.maintenance_costs_id,
    mc.total_costs                          AS maintenance_total_costs,
    mc.allocable_costs,
    mc.non_allocable_costs,
    f.financing_id,
    f.weighted_monthly_debt_service         AS monthly_debt_service,
    f.weighted_interest_rate                AS interest_rate,
    d.depreciation_id,
    d.depreciation_rate_percent,
    d.remaining_useful_life_years,
    dt.development_tomorrow_id              AS development_id
FROM personal_data pd
JOIN property p              ON p.user_id = pd.user_id
LEFT JOIN tenancy t           ON t.property_id = p.property_id AND t.rental_end_date IS NULL
LEFT JOIN maintenance_costs mc ON mc.property_id = p.property_id
LEFT JOIN financing f          ON f.property_id = p.property_id
LEFT JOIN depreciation d       ON d.property_id = p.property_id
LEFT JOIN development_tomorrow dt ON dt.property_id = p.property_id;

COMMENT ON VIEW metrics_today IS 'Live view aggregating current metrics per property. Replaces the former MetricsToday table.';
