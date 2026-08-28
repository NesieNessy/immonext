CREATE TABLE IF NOT EXISTS detail_check_rent_increases (
  rent_increase_id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES personal_data(user_id) ON DELETE CASCADE,
  workflow_id TEXT NOT NULL,
  legal_basis TEXT NOT NULL CHECK (legal_basis IN ('558', '559')),
  source_type TEXT NOT NULL CHECK (source_type IN ('RENT_INDEX', 'RENOVATION', 'MANUAL')),
  source_id TEXT,
  sequence_number INTEGER NOT NULL CHECK (sequence_number > 0),
  effective_yyyymm TEXT NOT NULL CHECK (effective_yyyymm ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  monthly_amount NUMERIC(14, 2) NOT NULL CHECK (monthly_amount >= 0),
  UNIQUE (user_id, workflow_id, legal_basis, sequence_number)
);

CREATE INDEX IF NOT EXISTS idx_detail_check_rent_increases_workflow
  ON detail_check_rent_increases(user_id, workflow_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_detail_check_rent_increases_source
  ON detail_check_rent_increases(user_id, workflow_id, legal_basis, source_id)
  WHERE source_id IS NOT NULL;

-- Preserve existing plans stored inside the former calculator result JSON.
INSERT INTO detail_check_rent_increases (
  user_id,
  workflow_id,
  legal_basis,
  source_type,
  source_id,
  sequence_number,
  effective_yyyymm,
  monthly_amount
)
SELECT
  calculator.user_id,
  calculator.workflow_id,
  '558',
  'RENT_INDEX',
  NULL,
  increase.ordinality::INTEGER,
  increase.item->>'effectiveYyyymm',
  COALESCE((increase.item->>'monthlyDelta')::NUMERIC, 0)
FROM detail_check_rent_calculator calculator
CROSS JOIN LATERAL jsonb_array_elements(
  CASE
    WHEN jsonb_typeof(calculator.result->'increases558') = 'array' THEN calculator.result->'increases558'
    ELSE '[]'::jsonb
  END
) WITH ORDINALITY AS increase(item, ordinality)
WHERE increase.item->>'effectiveYyyymm' ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'
ON CONFLICT (user_id, workflow_id, legal_basis, sequence_number) DO NOTHING;

INSERT INTO detail_check_rent_increases (
  user_id,
  workflow_id,
  legal_basis,
  source_type,
  source_id,
  sequence_number,
  effective_yyyymm,
  monthly_amount
)
SELECT
  calculator.user_id,
  calculator.workflow_id,
  '559',
  'RENOVATION',
  increase.item->>'id',
  increase.ordinality::INTEGER,
  increase.item->>'effectiveYyyymm',
  COALESCE((increase.item->>'monthlyDelta')::NUMERIC, 0)
FROM detail_check_rent_calculator calculator
CROSS JOIN LATERAL jsonb_array_elements(
  CASE
    WHEN jsonb_typeof(calculator.result->'modernizationPlan') = 'array' THEN calculator.result->'modernizationPlan'
    ELSE '[]'::jsonb
  END
) WITH ORDINALITY AS increase(item, ordinality)
WHERE increase.item->>'id' IS NOT NULL
  AND increase.item->>'effectiveYyyymm' ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'
ON CONFLICT (user_id, workflow_id, legal_basis, sequence_number) DO NOTHING;
