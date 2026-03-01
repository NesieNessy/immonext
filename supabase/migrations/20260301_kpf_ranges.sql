-- ==============================================================================
-- ImmoNext – CREATE TABLE: kpf_ranges
-- KPF = Kaufpreisfaktor (purchase price factor / gross yield multiplier)
-- Reference lookup table: read-only for app users, maintained by admin.
-- No sequential PK — composite primary key on (postal_code, condition, construction_year_bucket).
-- Depends on: property_condition type (defined in 20260224_property.sql)
-- ==============================================================================

CREATE TYPE kpf_construction_year_bucket AS ENUM (
    '<1918',
    '1918-1949',
    '1950-1959',
    '1960-1969',
    '1970-1979',
    '1980-1989',
    '1990-1999',
    '2000-2009',
    '2010-2014',
    '2015+'
);

CREATE TABLE IF NOT EXISTS kpf_ranges (
    postal_code                 VARCHAR(10)                     NOT NULL,
    condition                   property_condition              NOT NULL,
    construction_year_bucket    kpf_construction_year_bucket    NOT NULL,

    min_value                   DECIMAL(5, 1)                   NOT NULL,
    max_value                   DECIMAL(5, 1)                   NOT NULL,
    sample_size                 INT                             NOT NULL,

    PRIMARY KEY (postal_code, condition, construction_year_bucket),

    CONSTRAINT chk_kpf_value_range    CHECK (max_value >= min_value),
    CONSTRAINT chk_kpf_sample_size    CHECK (sample_size > 0),
    CONSTRAINT chk_kpf_min_positive   CHECK (min_value > 0)
);

-- Index for fast postal-code lookups (condition + bucket covered by PK)
CREATE INDEX IF NOT EXISTS idx_kpf_ranges_postal_code ON kpf_ranges (postal_code);

COMMENT ON TABLE  kpf_ranges                             IS 'Kaufpreisfaktor reference ranges per postal code, property condition and construction year bucket.';
COMMENT ON COLUMN kpf_ranges.postal_code                 IS 'German 5-digit postal code (PLZ).';
COMMENT ON COLUMN kpf_ranges.condition                   IS 'Property condition matching PropertyCondition enum: Sanierungsbedürftig, Standard, Gehoben, Luxus.';
COMMENT ON COLUMN kpf_ranges.construction_year_bucket    IS 'Construction decade bucket, e.g. ''1960-1969'' or ''<1918''.';
COMMENT ON COLUMN kpf_ranges.min_value                   IS 'Lower bound of KPF range (gross yield multiplier).';
COMMENT ON COLUMN kpf_ranges.max_value                   IS 'Upper bound of KPF range (gross yield multiplier).';
COMMENT ON COLUMN kpf_ranges.sample_size                 IS 'Number of transactions used to derive this range.';

-- Row Level Security — authenticated users can read; writes are admin-only
ALTER TABLE kpf_ranges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view kpf ranges"
    ON kpf_ranges FOR SELECT
    USING (auth.role() = 'authenticated');
