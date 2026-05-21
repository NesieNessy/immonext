CREATE TABLE IF NOT EXISTS comparison_reference_properties (
  reference_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_label TEXT NOT NULL DEFAULT 'Andere Kunden',
  street_house_number TEXT,
  postal_code TEXT NOT NULL,
  city TEXT NOT NULL,
  purchase_price NUMERIC(14, 2) NOT NULL DEFAULT 0,
  cold_rent NUMERIC(14, 2) NOT NULL DEFAULT 0,
  living_area_m2 NUMERIC(10, 2) NOT NULL DEFAULT 0,
  year_of_construction INT NOT NULL DEFAULT 1900,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comparison_reference_properties_location
  ON comparison_reference_properties(postal_code, city);

INSERT INTO comparison_reference_properties (
  street_house_number, postal_code, city, purchase_price, cold_rent, living_area_m2, year_of_construction
) VALUES
  ('Torstraße 101', '10115', 'Berlin', 485000, 1080, 78, 1994),
  ('Invalidenstraße 22', '10115', 'Berlin', 510000, 1150, 83, 1997),
  ('Chausseestraße 8', '10115', 'Berlin', 465000, 920, 72, 1992),
  ('Leopoldstraße 12', '80801', 'München', 950000, 1800, 94, 1981),
  ('Hohenzollernstraße 52', '80801', 'München', 1010000, 1950, 100, 1980),
  ('Beispielstraße 123', '80801', 'München', 800000, 1100, 105, 1982),
  ('Venloer Straße 14', '50672', 'Köln', 420000, 980, 76, 1988),
  ('Aachener Straße 90', '50672', 'Köln', 455000, 1040, 81, 1990),
  ('Karli 10', '04275', 'Leipzig', 260000, 760, 74, 1993),
  ('Südvorstadt 18', '04275', 'Leipzig', 285000, 830, 82, 1996)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS detail_check_comparison (
  comparison_id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES personal_data(user_id) ON DELETE CASCADE,
  quick_check_id INT REFERENCES quick_check(quick_check_id) ON DELETE SET NULL,
  workflow_id TEXT NOT NULL,
  subject JSONB NOT NULL DEFAULT '{}'::jsonb,
  references_result JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, workflow_id)
);

CREATE INDEX IF NOT EXISTS idx_detail_check_comparison_user_workflow
  ON detail_check_comparison(user_id, workflow_id);
