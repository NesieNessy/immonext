import { db, DEV_USER_ID } from '@/lib/server/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type QuickCheckRow = {
  quick_check_id: number;
  user_id: string;
  ingest_date?: string;
  created_at?: string;
  portal_id: string | null;
  data_entry_source: 'MANUELL' | 'PORTAL_IMPORT';
  kpf_multiplier: string | number;
  purchase_price: string | number;
  cold_rent: string | number;
  street: string;
  postal_code: string;
  city: string;
  year_of_construction: number;
  condition: string;
  status: 'ACTIVE' | 'INACTIVE';
  finalised_action: 'ACCEPT' | 'DISCARD' | null;
  detail_check: boolean;
  property_id: number | null;
  recommendation_score: string | number | null;
  recommendation_level: string | null;
  updated_at?: string;
};

function toNumber(value: string | number | null): number {
  if (value == null) return 0;
  return typeof value === 'number' ? value : Number(value);
}

function mapQuickCheck(row: QuickCheckRow) {
  return {
    quick_check_id: row.quick_check_id,
    user_id: row.user_id,
    ingest_date: row.ingest_date ?? row.created_at,
    portal_id: row.portal_id,
    data_entry_source: row.data_entry_source,
    kpf_multiplier: toNumber(row.kpf_multiplier),
    purchase_price: toNumber(row.purchase_price),
    cold_rent: toNumber(row.cold_rent),
    street: row.street,
    postal_code: row.postal_code,
    city: row.city,
    year_of_construction: row.year_of_construction,
    condition: row.condition,
    status: row.status,
    finalised_action: row.finalised_action,
    detail_check: row.detail_check,
    property_id: row.property_id,
    recommendation_score: row.recommendation_score == null ? null : toNumber(row.recommendation_score),
    recommendation_level: row.recommendation_level,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const detailCheck = searchParams.get('detailCheck') === 'true';

  const { rows } = await db.query<QuickCheckRow>(
    `
      SELECT *
      FROM quick_check_overview
      WHERE user_id = $1
        AND detail_check = $2
      ORDER BY ingest_date DESC
      LIMIT 100
    `,
    [DEV_USER_ID, detailCheck],
  );

  return NextResponse.json(rows.map(mapQuickCheck));
}

export async function POST(request: Request) {
  const input = await request.json();

  const purchasePrice = Number(input.purchasePrice);
  const coldRent = Number(input.coldRent);
  const yearOfConstruction = Number(input.yearOfConstruction);
  const kpfMultiplier = Number(input.kpfMultiplier);
  const dataEntrySource = input.dataEntrySource === 'PORTAL_IMPORT' || input.portalId
    ? 'PORTAL_IMPORT'
    : 'MANUELL';

  if (
    !Number.isFinite(purchasePrice) ||
    !Number.isFinite(coldRent) ||
    !Number.isFinite(yearOfConstruction) ||
    !Number.isFinite(kpfMultiplier) ||
    !input.street ||
    !input.postalCode ||
    !input.city ||
    !input.condition
  ) {
    return NextResponse.json({ error: 'Invalid quick-check payload' }, { status: 400 });
  }

  const { rows } = await db.query<QuickCheckRow>(
    `
      INSERT INTO quick_check (
        user_id,
        portal_id,
        data_entry_source,
        purchase_price,
        cold_rent,
        street,
        postal_code,
        city,
        year_of_construction,
        condition,
        kpf_multiplier
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `,
    [
      DEV_USER_ID,
      input.portalId ?? null,
      dataEntrySource,
      purchasePrice,
      coldRent,
      String(input.street).trim(),
      String(input.postalCode),
      String(input.city).trim(),
      yearOfConstruction,
      input.condition,
      kpfMultiplier,
    ],
  );

  return NextResponse.json(mapQuickCheck(rows[0]), { status: 201 });
}

export async function DELETE(request: Request) {
  const input = await request.json();
  const ids = Array.isArray(input.ids) ? input.ids.map(Number).filter(Number.isFinite) : [];

  if (ids.length === 0) {
    return NextResponse.json({ deleted: 0 });
  }

  const { rowCount } = await db.query(
    `
      DELETE FROM quick_check
      WHERE user_id = $1
        AND quick_check_id = ANY($2::int[])
    `,
    [DEV_USER_ID, ids],
  );

  return NextResponse.json({ deleted: rowCount ?? 0 });
}
