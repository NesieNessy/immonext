import { db } from '@/lib/server/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const city = new URL(request.url).searchParams.get('city')?.trim();
  if (!city) return NextResponse.json({ buildingSharePercent: 65, landSharePercent: 35 });
  const { rows } = await db.query(
    'SELECT building_share_percent, land_share_percent FROM city_purchase_price_split WHERE lower(city_name) = lower($1) LIMIT 1',
    [city],
  );
  return NextResponse.json({
    buildingSharePercent: rows[0] ? Number(rows[0].building_share_percent) : 65,
    landSharePercent: rows[0] ? Number(rows[0].land_share_percent) : 35,
  });
}
