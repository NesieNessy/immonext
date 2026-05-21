CREATE TABLE IF NOT EXISTS detail_check_recommendation (
  recommendation_id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES personal_data(user_id) ON DELETE CASCADE,
  quick_check_id INT REFERENCES quick_check(quick_check_id) ON DELETE SET NULL,
  workflow_id TEXT NOT NULL,
  recommendation_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
  recommendation_level TEXT NOT NULL DEFAULT 'CHECK',
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, workflow_id)
);

CREATE INDEX IF NOT EXISTS idx_detail_check_recommendation_user_workflow
  ON detail_check_recommendation(user_id, workflow_id);
