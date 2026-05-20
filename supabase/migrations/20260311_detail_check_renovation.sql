CREATE TABLE IF NOT EXISTS detail_check_renovation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quick_check_id INTEGER REFERENCES quick_check(quick_check_id) ON DELETE SET NULL,
  workflow_id TEXT NOT NULL,
  cases JSONB NOT NULL DEFAULT '[]'::jsonb,
  pricing JSONB NOT NULL DEFAULT '{}'::jsonb,
  financing_mode TEXT NOT NULL DEFAULT 'FREMD',
  financed_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, workflow_id)
);

CREATE INDEX IF NOT EXISTS idx_detail_check_renovation_user_workflow
  ON detail_check_renovation(user_id, workflow_id);
