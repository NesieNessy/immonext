CREATE TABLE IF NOT EXISTS detail_check_location_score (
  location_score_id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES personal_data(user_id) ON DELETE CASCADE,
  quick_check_id INT REFERENCES quick_check(quick_check_id) ON DELETE SET NULL,
  workflow_id TEXT NOT NULL,
  city TEXT,
  postal_code TEXT,
  street_house_number TEXT,
  total_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
  macro_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
  micro_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, workflow_id)
);

CREATE INDEX IF NOT EXISTS idx_detail_check_location_score_user_workflow
  ON detail_check_location_score(user_id, workflow_id);
