CREATE TABLE IF NOT EXISTS detail_check_property_data (
    property_data_id       SERIAL PRIMARY KEY,
    user_id                UUID NOT NULL REFERENCES personal_data(user_id) ON DELETE CASCADE,
    quick_check_id         INT REFERENCES quick_check(quick_check_id) ON DELETE SET NULL,
    workflow_id            TEXT NOT NULL,
    property_category      TEXT NOT NULL,
    data_entry_source      TEXT NOT NULL,
    tenancy_type           TEXT NOT NULL,
    source_url             TEXT,
    street_house_number    VARCHAR(100),
    postal_code            VARCHAR(10),
    city                   VARCHAR(100) NOT NULL,
    year_of_construction   INT NOT NULL CHECK (year_of_construction BETWEEN 1000 AND 2100),
    living_area_m2         NUMERIC(10, 2) NOT NULL CHECK (living_area_m2 > 0 AND living_area_m2 <= 10000),
    parking_spaces         INT NOT NULL DEFAULT 0 CHECK (parking_spaces BETWEEN 0 AND 10),
    energy_efficiency      VARCHAR(2),
    created_at             TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, workflow_id)
);

CREATE INDEX IF NOT EXISTS idx_detail_check_property_data_user_id
    ON detail_check_property_data(user_id);
CREATE INDEX IF NOT EXISTS idx_detail_check_property_data_quick_check_id
    ON detail_check_property_data(quick_check_id);
