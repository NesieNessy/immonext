-- ==============================================================================
-- ImmoNext – CREATE TABLE: development_tomorrow
-- Depends on: property, tenancy, city, legal_requirements, rent_index, financing
-- ==============================================================================

CREATE TABLE IF NOT EXISTS development_tomorrow (
    development_tomorrow_id             SERIAL                      PRIMARY KEY,
    property_id                         INT                         NOT NULL REFERENCES property(property_id) ON DELETE CASCADE,
    tenancy_id                          INT                         REFERENCES tenancy(tenancy_id) ON DELETE SET NULL,
    city_id                             INT                         REFERENCES city(city_id) ON DELETE RESTRICT,
    legal_requirements_id               INT                         REFERENCES legal_requirements(legal_requirements_id) ON DELETE SET NULL,
    rent_index_id                       INT                         REFERENCES rent_index(rent_index_id) ON DELETE SET NULL,
    financing_id                        INT                         REFERENCES financing(financing_id) ON DELETE SET NULL,

    development_year                    INT,
    year_start                          INT,
    date_start                          INT,
    metropolitan_area                   BOOLEAN,

    cold_rent_increase                  NUMERIC(10, 2),
    cold_rent_increase_eligible         BOOLEAN,
    cold_rent_increase_lock_period      NUMERIC(6, 2),
    cold_rent_increase_reminder         BOOLEAN,
    cold_rent_increase_percent          NUMERIC(6, 4),
    cold_rent_increase_3year_average_percent NUMERIC(6, 4),

    last_rent_increase                  NUMERIC(10, 2),
    last_rent_increase_relevance        BOOLEAN,
    last_rent_increase_value            NUMERIC(10, 2),
    last_rent_increase_percent          NUMERIC(6, 4),

    created_at                          TIMESTAMP WITH TIME ZONE    DEFAULT NOW(),
    updated_at                          TIMESTAMP WITH TIME ZONE    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_development_tomorrow_property_id ON development_tomorrow (property_id);
CREATE INDEX IF NOT EXISTS idx_development_tomorrow_tenancy_id  ON development_tomorrow (tenancy_id);

COMMENT ON TABLE  development_tomorrow                          IS 'Input parameters for future rent development scenarios.';
COMMENT ON COLUMN development_tomorrow.cold_rent_increase_3year_average_percent IS 'Average rent increase over 3 years as required by §558 BGB.';

ALTER TABLE development_tomorrow ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own development tomorrow"
    ON development_tomorrow FOR SELECT
    USING (EXISTS (SELECT 1 FROM property WHERE property.property_id = development_tomorrow.property_id AND property.user_id = auth.uid()));

CREATE POLICY "Users can insert own development tomorrow"
    ON development_tomorrow FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM property WHERE property.property_id = development_tomorrow.property_id AND property.user_id = auth.uid()));

CREATE POLICY "Users can update own development tomorrow"
    ON development_tomorrow FOR UPDATE
    USING (EXISTS (SELECT 1 FROM property WHERE property.property_id = development_tomorrow.property_id AND property.user_id = auth.uid()));

CREATE POLICY "Users can delete own development tomorrow"
    ON development_tomorrow FOR DELETE
    USING (EXISTS (SELECT 1 FROM property WHERE property.property_id = development_tomorrow.property_id AND property.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION update_development_tomorrow_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER development_tomorrow_updated_at BEFORE UPDATE ON development_tomorrow FOR EACH ROW EXECUTE FUNCTION update_development_tomorrow_updated_at();


-- ==============================================================================
-- ImmoNext – CREATE TABLE: development_tomorrow_metrics
-- Depends on: development_tomorrow (development_tomorrow_id)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS development_tomorrow_metrics (
    metrics_id                              SERIAL                      PRIMARY KEY,
    development_tomorrow_id                 INT                         NOT NULL REFERENCES development_tomorrow(development_tomorrow_id) ON DELETE CASCADE,

    sqm_price_with_ri                       NUMERIC(10, 2),
    sqm_price_without_ri                    NUMERIC(10, 2),
    total_rent_with_ri                      NUMERIC(10, 2),
    total_rent_without_ri                   NUMERIC(10, 2),
    debt_service_diff_with_ri               NUMERIC(10, 2),
    debt_service_diff_without_ri            NUMERIC(10, 2),
    net_rent_yield_pre_tax_with_ri          NUMERIC(8, 6),
    net_rent_yield_pre_tax_without_ri       NUMERIC(8, 6),
    net_rent_yield_after_tax_with_ri        NUMERIC(8, 6),
    net_rent_yield_after_tax_without_ri     NUMERIC(8, 6),
    operative_cashflow_with_ri              NUMERIC(10, 2),
    operative_cashflow_without_ri           NUMERIC(10, 2),
    after_tax_cashflow_with_ri              NUMERIC(10, 2),
    after_tax_cashflow_without_ri           NUMERIC(10, 2),
    computed_at                             TIMESTAMP WITH TIME ZONE    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dev_tomorrow_metrics_dev_id ON development_tomorrow_metrics (development_tomorrow_id);

COMMENT ON TABLE  development_tomorrow_metrics             IS 'Computed output metrics split from development_tomorrow inputs.';
COMMENT ON COLUMN development_tomorrow_metrics.computed_at IS 'Timestamp of last computation run.';

ALTER TABLE development_tomorrow_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own development tomorrow metrics"
    ON development_tomorrow_metrics FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM development_tomorrow dt
        JOIN property p ON p.property_id = dt.property_id
        WHERE dt.development_tomorrow_id = development_tomorrow_metrics.development_tomorrow_id
        AND p.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert own development tomorrow metrics"
    ON development_tomorrow_metrics FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM development_tomorrow dt
        JOIN property p ON p.property_id = dt.property_id
        WHERE dt.development_tomorrow_id = development_tomorrow_metrics.development_tomorrow_id
        AND p.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete own development tomorrow metrics"
    ON development_tomorrow_metrics FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM development_tomorrow dt
        JOIN property p ON p.property_id = dt.property_id
        WHERE dt.development_tomorrow_id = development_tomorrow_metrics.development_tomorrow_id
        AND p.user_id = auth.uid()
    ));


-- ==============================================================================
-- ImmoNext – CREATE TABLE: renovation
-- Depends on: property (property_id), legal_requirements (legal_requirements_id)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS renovation (
    renovation_id               SERIAL                      PRIMARY KEY,
    property_id                 INT                         NOT NULL REFERENCES property(property_id) ON DELETE CASCADE,
    legal_requirements_id       INT                         REFERENCES legal_requirements(legal_requirements_id) ON DELETE SET NULL,

    modernisation_property      VARCHAR(255),
    modernisation_date          DATE,
    modernisation_value         NUMERIC(14, 2),
    limit_15_percent            NUMERIC(14, 2),
    three_year_value            NUMERIC(14, 2),
    last_modernisation          DATE,
    last_modernisation_relevance VARCHAR(255),
    last_modernisation_value    NUMERIC(14, 2),
    last_modernisation_percent  NUMERIC(6, 4),
    purchase_depreciation       NUMERIC(14, 2),

    created_at                  TIMESTAMP WITH TIME ZONE    DEFAULT NOW(),
    updated_at                  TIMESTAMP WITH TIME ZONE    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_renovation_property_id ON renovation (property_id);

COMMENT ON TABLE  renovation                          IS '1:n with property. Tracks modernisation measures and their rent-increase relevance.';
COMMENT ON COLUMN renovation.limit_15_percent         IS 'Mieterhöhungskappungsgrenze — maximum allowable rent increase from modernisation.';
COMMENT ON COLUMN renovation.purchase_depreciation    IS 'Anschaffungsnahe Herstellungskosten — acquisition-related production costs.';

ALTER TABLE renovation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own renovations"
    ON renovation FOR SELECT
    USING (EXISTS (SELECT 1 FROM property WHERE property.property_id = renovation.property_id AND property.user_id = auth.uid()));

CREATE POLICY "Users can insert own renovations"
    ON renovation FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM property WHERE property.property_id = renovation.property_id AND property.user_id = auth.uid()));

CREATE POLICY "Users can update own renovations"
    ON renovation FOR UPDATE
    USING (EXISTS (SELECT 1 FROM property WHERE property.property_id = renovation.property_id AND property.user_id = auth.uid()));

CREATE POLICY "Users can delete own renovations"
    ON renovation FOR DELETE
    USING (EXISTS (SELECT 1 FROM property WHERE property.property_id = renovation.property_id AND property.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION update_renovation_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER renovation_updated_at BEFORE UPDATE ON renovation FOR EACH ROW EXECUTE FUNCTION update_renovation_updated_at();


-- ==============================================================================
-- ImmoNext – CREATE TABLE: legal_requirements
-- Depends on: city (city_id)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS legal_requirements (
    legal_requirements_id   SERIAL                      PRIMARY KEY,
    city_id                 INT                         NOT NULL REFERENCES city(city_id) ON DELETE RESTRICT,

    rent_cap_limit          NUMERIC(10, 2),
    sqm_increase_low        NUMERIC(6, 4),
    sqm_increase_high       NUMERIC(6, 4),
    renovation_limit_percent NUMERIC(6, 4),
    valid_from              DATE                        NOT NULL,
    valid_until             DATE,

    created_at              TIMESTAMP WITH TIME ZONE    DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE    DEFAULT NOW(),

    CONSTRAINT chk_legal_requirements_dates CHECK (valid_until IS NULL OR valid_until > valid_from)
);

CREATE INDEX IF NOT EXISTS idx_legal_requirements_city_id    ON legal_requirements (city_id);
CREATE INDEX IF NOT EXISTS idx_legal_requirements_valid_from ON legal_requirements (valid_from);

COMMENT ON TABLE  legal_requirements                      IS 'Versioned legal rent regulations per city (Mietrechtsvorschriften).';
COMMENT ON COLUMN legal_requirements.rent_cap_limit       IS 'Mietpreisbremse cap limit per sqm.';
COMMENT ON COLUMN legal_requirements.sqm_increase_low     IS 'Lower bound of allowed rent increase per sqm.';
COMMENT ON COLUMN legal_requirements.sqm_increase_high    IS 'Upper bound of allowed rent increase per sqm.';
COMMENT ON COLUMN legal_requirements.renovation_limit_percent IS 'Max % of renovation cost passable to tenant per §559 BGB.';

ALTER TABLE legal_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view legal requirements"
    ON legal_requirements FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE OR REPLACE FUNCTION update_legal_requirements_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER legal_requirements_updated_at BEFORE UPDATE ON legal_requirements FOR EACH ROW EXECUTE FUNCTION update_legal_requirements_updated_at();


-- ==============================================================================
-- ImmoNext – CREATE TABLE: system_config
-- Key/value configuration table — replaces single-row SystemData
-- ==============================================================================

CREATE TABLE IF NOT EXISTS system_config (
    config_id       SERIAL                      PRIMARY KEY,
    config_key      VARCHAR(100)                NOT NULL,
    config_value    TEXT                        NOT NULL,
    description     TEXT,

    created_at      TIMESTAMP WITH TIME ZONE    DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE    DEFAULT NOW(),

    CONSTRAINT uq_system_config_key UNIQUE (config_key)
);

COMMENT ON TABLE  system_config             IS 'Global key/value config. e.g. current_year, afa_rate_new_build.';
COMMENT ON COLUMN system_config.config_key  IS 'Unique key identifying the config entry, e.g. ''current_year''.';
COMMENT ON COLUMN system_config.config_value IS 'Value stored as TEXT — cast to required type in application layer.';

-- Seed default values
INSERT INTO system_config (config_key, config_value, description)
VALUES
    ('current_year',         EXTRACT(YEAR FROM NOW())::TEXT, 'Current fiscal year used in AfA calculations'),
    ('afa_rate_new_build',   '0.03',  'AfA rate for new builds post-2023 (3%)'),
    ('afa_rate_existing',    '0.02',  'AfA rate for existing buildings (2%)')
ON CONFLICT (config_key) DO NOTHING;

ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view system config"
    ON system_config FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE OR REPLACE FUNCTION update_system_config_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER system_config_updated_at BEFORE UPDATE ON system_config FOR EACH ROW EXECUTE FUNCTION update_system_config_updated_at();


-- ==============================================================================
-- ImmoNext – CREATE TABLE: notifications
-- Depends on: personal_data (user_id), property (property_id)
-- ==============================================================================

CREATE TYPE notification_type_enum AS ENUM (
    'TRADESPERSON',
    'FINANCIAL_BROKER',
    'SYSTEM'
);

CREATE TABLE IF NOT EXISTS notifications (
    notification_id     SERIAL                      PRIMARY KEY,
    user_id             UUID                        NOT NULL REFERENCES personal_data(user_id) ON DELETE CASCADE,
    property_id         INT                         REFERENCES property(property_id) ON DELETE SET NULL,

    type                notification_type_enum      NOT NULL,
    message             TEXT                        NOT NULL,
    tradesperson        VARCHAR(255),
    financial_broker    VARCHAR(255),
    read_at             TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id     ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_property_id ON notifications (property_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at     ON notifications (read_at) WHERE read_at IS NULL;

COMMENT ON TABLE  notifications             IS 'User-owned notifications. read_at IS NULL = unread.';
COMMENT ON COLUMN notifications.read_at     IS 'NULL = unread. Set to NOW() when user views the notification.';

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications"
    ON notifications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
    ON notifications FOR DELETE
    USING (auth.uid() = user_id);
