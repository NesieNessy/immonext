import { requireUserId } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { getRedisClient } from '@/lib/redis';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const userId = await requireUserId(request);
  const url = new URL(request.url);
  const propertyId = url.searchParams.get('propertyId');
  const propertyUnitId = url.searchParams.get('propertyUnitId');

  if (!propertyId) return NextResponse.json({ error: 'propertyId missing' }, { status: 400 });

  const values: unknown[] = [userId, Number(propertyId)];

  // Try Redis cache first (cache-aside)
  const cacheKey = `settlement:user:${userId}:property:${propertyId}:unit:${propertyUnitId ?? '0'}`;
  try {
    const redis = getRedisClient();
    const cached = await redis.get(cacheKey);
    if (cached) {
      return NextResponse.json(JSON.parse(cached));
    }
  } catch {
    // ignore cache errors and fall back to DB
    console.warn('Redis cache unavailable, continuing without cache');
  }

  // Fetch units and current settlement and tenancy in parallel where possible
  const unitsPromise = db.query(
    `SELECT r.* FROM property_unit r WHERE EXISTS (SELECT 1 FROM property p WHERE p.property_id = r.property_id AND p.user_id = $1) AND r.property_id = $2 ORDER BY sort_order, property_unit_id`,
    values,
  );

  const settlementPromise = db.query(
    `SELECT r.* FROM service_charge_settlement r WHERE EXISTS (SELECT 1 FROM property p WHERE p.property_id = r.property_id AND p.user_id = $1) AND r.property_id = $2 ORDER BY period_end DESC LIMIT 1`,
    values,
  );

  const tenancyPromise = propertyUnitId
    ? db.query(
        `SELECT r.* FROM tenancy r WHERE EXISTS (SELECT 1 FROM property p WHERE p.property_id = r.property_id AND p.user_id = $1) AND r.property_unit_id = $2 ORDER BY (tenancy_end_date IS NULL) DESC, tenancy_start_date DESC NULLS LAST LIMIT 1`,
        [userId, Number(propertyUnitId)],
      )
    : Promise.resolve({ rows: [] } as { rows: unknown[] });

  const [unitsRes, settlementRes, tenancyRes] = await Promise.all([unitsPromise, settlementPromise, tenancyPromise]);

  let costItems: unknown[] = [];
  if (settlementRes.rows[0]) {
    const settlementId = settlementRes.rows[0].service_charge_settlement_id;
    const costRes = await db.query(
      `SELECT r.* FROM service_charge_cost_item r WHERE EXISTS (SELECT 1 FROM property p WHERE p.property_id = r.property_id AND p.user_id = $1) AND r.service_charge_settlement_id = $2 ORDER BY sort_order, service_charge_cost_item_id`,
      [userId, settlementId],
    );
    costItems = costRes.rows;
  }
  const result = { units: unitsRes.rows, settlement: settlementRes.rows[0] ?? null, tenancy: tenancyRes.rows[0] ?? null, costItems };

  try {
    const redis = getRedisClient();
    await redis.set(cacheKey, JSON.stringify(result), 'EX', 60);
  } catch {
    // ignore cache set errors
  }

  return NextResponse.json(result);
}
