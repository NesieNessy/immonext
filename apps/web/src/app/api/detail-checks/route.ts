import { requireUserId } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const userId = await requireUserId(request);
  const { rows } = await db.query(
    `
      SELECT
        pd.workflow_id,
        pd.quick_check_id,
        pd.street_house_number,
        pd.postal_code,
        pd.city,
        pd.year_of_construction,
        pd.living_area_m2,
        pd.property_category,
        pd.created_at,
        GREATEST(pd.updated_at, COALESCE(rec.updated_at, pd.updated_at)) AS updated_at,
        COALESCE(costs.purchase_price, 0) AS purchase_price,
        rec.recommendation_score,
        rec.recommendation_level
      FROM detail_check_property_data pd
      LEFT JOIN detail_check_acquisition_costs costs
        ON costs.user_id = pd.user_id
       AND costs.workflow_id = pd.workflow_id
      LEFT JOIN detail_check_recommendation rec
        ON rec.user_id = pd.user_id
       AND rec.workflow_id = pd.workflow_id
      WHERE pd.user_id = $1
      ORDER BY updated_at DESC
      LIMIT 100
    `,
    [userId],
  );

  return NextResponse.json(rows);
}
