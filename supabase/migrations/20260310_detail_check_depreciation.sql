CREATE TABLE IF NOT EXISTS city_purchase_price_split (
    city_name               TEXT PRIMARY KEY,
    city_type               TEXT,
    population              INT,
    market_tier             TEXT,
    building_share_percent  NUMERIC(5, 2) NOT NULL,
    land_share_percent      NUMERIC(5, 2) NOT NULL,
    note                    TEXT,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

INSERT INTO city_purchase_price_split (
    city_name, city_type, population, market_tier,
    building_share_percent, land_share_percent, note
) VALUES
    ('Berlin', 'Stadt', 3782202, 'A', 65.00, 35.00, 'Faustwert ohne Gutachten; basiert auf Einwohnergröße als Proxy für Preisniveau.'),
    ('Hamburg', 'Freie und Hansestadt', 1910160, 'A', 65.00, 35.00, 'Faustwert ohne Gutachten; basiert auf Einwohnergröße als Proxy für Preisniveau.'),
    ('München', 'Landeshauptstadt', 1510378, 'A', 65.00, 35.00, 'Faustwert ohne Gutachten; basiert auf Einwohnergröße als Proxy für Preisniveau.'),
    ('Köln', 'Stadt', 1087353, 'A', 65.00, 35.00, 'Faustwert ohne Gutachten; basiert auf Einwohnergröße als Proxy für Preisniveau.'),
    ('Frankfurt am Main', 'Stadt', 775790, 'A', 65.00, 35.00, 'Faustwert ohne Gutachten; basiert auf Einwohnergröße als Proxy für Preisniveau.')
ON CONFLICT (city_name) DO UPDATE SET
    building_share_percent = EXCLUDED.building_share_percent,
    land_share_percent = EXCLUDED.land_share_percent,
    note = EXCLUDED.note;

CREATE TABLE IF NOT EXISTS detail_check_depreciation (
    depreciation_id             SERIAL PRIMARY KEY,
    user_id                     UUID NOT NULL REFERENCES personal_data(user_id) ON DELETE CASCADE,
    quick_check_id              INT REFERENCES quick_check(quick_check_id) ON DELETE SET NULL,
    workflow_id                 TEXT NOT NULL,
    depreciation_mode           TEXT NOT NULL DEFAULT 'STANDARD',
    price_split_mode            TEXT NOT NULL DEFAULT 'STANDARD',
    modernization_roof          TEXT,
    modernization_windows       TEXT,
    modernization_lines         TEXT,
    modernization_heating       TEXT,
    modernization_facade        TEXT,
    modernization_bathrooms     TEXT,
    modernization_interior      TEXT,
    land_reference_value        NUMERIC(14, 2) NOT NULL DEFAULT 0,
    plot_area_m2                NUMERIC(14, 2) NOT NULL DEFAULT 0,
    co_ownership_numerator      NUMERIC(14, 2) NOT NULL DEFAULT 0,
    co_ownership_denominator    NUMERIC(14, 2) NOT NULL DEFAULT 0,
    remaining_useful_life_years NUMERIC(10, 2) NOT NULL DEFAULT 50,
    afa_percent                 NUMERIC(7, 4) NOT NULL DEFAULT 2,
    building_value              NUMERIC(14, 2) NOT NULL DEFAULT 0,
    building_share_percent      NUMERIC(5, 2) NOT NULL DEFAULT 65,
    land_value                  NUMERIC(14, 2) NOT NULL DEFAULT 0,
    land_share_percent          NUMERIC(5, 2) NOT NULL DEFAULT 35,
    created_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, workflow_id)
);

CREATE INDEX IF NOT EXISTS idx_detail_check_depreciation_user_id
    ON detail_check_depreciation(user_id);
CREATE INDEX IF NOT EXISTS idx_detail_check_depreciation_quick_check_id
    ON detail_check_depreciation(quick_check_id);
