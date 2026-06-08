-- ============================================================================
-- PATCH: get_kpf_range
-- Run this in Supabase Dashboard → SQL Editor.
--
-- Change vs previous version:
--   • Level 4 fallback now filters by condition as well as state —
--     a missing condition never produces a result (condition is always
--     part of the lookup key at every fallback level).
-- ============================================================================

CREATE OR REPLACE FUNCTION get_kpf_range(
    p_postal_code   VARCHAR(10),
    p_condition     property_condition,
    p_bucket        kpf_construction_year_bucket
)
RETURNS TABLE (
    min_value       DECIMAL(5,1),
    max_value       DECIMAL(5,1),
    sample_size     INT,
    fallback_level  INT,   -- 1=exact, 2=any bucket, 3=region, 4=state, 0=no result
    fallback_hint   TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_state   VARCHAR(3);  -- e.g. 'BY', 'NW', 'BE'
BEGIN
    -- Derive federal state prefix from PLZ
    v_state := (
        SELECT state_code FROM postal_code_to_state
        WHERE postal_code = p_postal_code
        LIMIT 1
    );

    -- Level 1: Exact match (PLZ + condition + bucket)
    RETURN QUERY
    SELECT k.min_value, k.max_value, k.sample_size, 1, NULL::TEXT
    FROM kpf_ranges k
    WHERE k.postal_code = p_postal_code
      AND k.condition   = p_condition
      AND k.construction_year_bucket = p_bucket
    LIMIT 1;
    IF FOUND THEN RETURN; END IF;

    -- Level 2: PLZ + condition, any bucket
    RETURN QUERY
    SELECT AVG(k.min_value)::DECIMAL(5,1), AVG(k.max_value)::DECIMAL(5,1),
           SUM(k.sample_size), 2,
           'Kein exakter Baujahr-Treffer – Durchschnitt aller Baujahre dieser PLZ'
    FROM kpf_ranges k
    WHERE k.postal_code = p_postal_code
      AND k.condition   = p_condition;
    IF FOUND THEN RETURN; END IF;

    -- Level 3: Region (Kreis/Stadt) + condition + bucket
    RETURN QUERY
    SELECT AVG(k.min_value)::DECIMAL(5,1), AVG(k.max_value)::DECIMAL(5,1),
           SUM(k.sample_size), 3,
           'Kein PLZ-Treffer – Daten aus der Region verwendet'
    FROM kpf_ranges k
    JOIN postal_code_to_state pts ON pts.postal_code = k.postal_code
    WHERE pts.region_code = (SELECT region_code FROM postal_code_to_state WHERE postal_code = p_postal_code LIMIT 1)
      AND k.condition     = p_condition
      AND k.construction_year_bucket = p_bucket;
    IF FOUND THEN RETURN; END IF;

    -- Level 4: Federal state + condition, any bucket
    -- condition is always required — a state-wide average without matching
    -- condition is not a valid comparison value.
    RETURN QUERY
    SELECT AVG(k.min_value)::DECIMAL(5,1), AVG(k.max_value)::DECIMAL(5,1),
           SUM(k.sample_size), 4,
           'Breiter Korridor mangels lokaler Daten – Bundeslanddurchschnitt'
    FROM kpf_ranges k
    JOIN postal_code_to_state pts ON pts.postal_code = k.postal_code
    WHERE pts.state_code = v_state
      AND k.condition    = p_condition;
    IF FOUND THEN RETURN; END IF;

    -- Level 0: No data at all
    RETURN QUERY SELECT NULL::DECIMAL(5,1), NULL::DECIMAL(5,1), 0, 0, 'Keine Vergleichsdaten gefunden'::TEXT;
END;
$$;

-- Re-grant after CREATE OR REPLACE
GRANT EXECUTE ON FUNCTION get_kpf_range(
    VARCHAR, property_condition, kpf_construction_year_bucket
) TO authenticated;
