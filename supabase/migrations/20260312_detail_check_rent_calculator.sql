CREATE TABLE IF NOT EXISTS detail_check_rent_calculator (
  calculator_id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES personal_data(user_id) ON DELETE CASCADE,
  quick_check_id INT REFERENCES quick_check(quick_check_id) ON DELETE SET NULL,
  workflow_id TEXT NOT NULL,
  start_yyyymm TEXT NOT NULL,
  monthly_rent_start NUMERIC(14, 2) NOT NULL DEFAULT 0,
  rent_index_per_m2 NUMERIC(14, 2),
  last_558_date TEXT,
  last_559_date TEXT,
  mode TEXT NOT NULL DEFAULT 'KNOWN',
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, workflow_id)
);

CREATE INDEX IF NOT EXISTS idx_detail_check_rent_calculator_user_workflow
  ON detail_check_rent_calculator(user_id, workflow_id);
