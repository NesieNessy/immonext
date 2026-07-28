CREATE TABLE IF NOT EXISTS property_rnd (
    property_rnd_id          SERIAL PRIMARY KEY,
    property_id              INT NOT NULL UNIQUE REFERENCES property(property_id) ON DELETE CASCADE,
    rnd_mode                 TEXT NOT NULL DEFAULT 'STANDARD',
    modernization_roof       TEXT,
    modernization_windows    TEXT,
    modernization_lines      TEXT,
    modernization_heating    TEXT,
    modernization_facade     TEXT,
    modernization_bathrooms  TEXT,
    modernization_interior   TEXT,
    created_at                TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at                TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_rnd_property_id
    ON property_rnd(property_id);

-- Give every existing property a clean Standard-mode RND row, clearing out
-- any individual modernization selections that may have been recorded.
INSERT INTO property_rnd (property_id, rnd_mode)
SELECT property_id, 'STANDARD' FROM property
ON CONFLICT (property_id) DO UPDATE SET
    rnd_mode = 'STANDARD',
    modernization_roof = NULL,
    modernization_windows = NULL,
    modernization_lines = NULL,
    modernization_heating = NULL,
    modernization_facade = NULL,
    modernization_bathrooms = NULL,
    modernization_interior = NULL,
    updated_at = NOW();
