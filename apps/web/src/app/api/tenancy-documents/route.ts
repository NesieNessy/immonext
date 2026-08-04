import { requireUserId } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const userId = await requireUserId(request);
  const tenancyId = new URL(request.url).searchParams.get('tenancyId');
  const values: unknown[] = [userId];
  const filter = tenancyId ? ' AND td.tenancy_id = $2' : '';
  if (tenancyId) values.push(Number(tenancyId));
  const { rows } = await db.query(
    `
      SELECT td.*, t.property_id FROM tenancy_document td
      JOIN tenancy t ON t.tenancy_id = td.tenancy_id
      JOIN property p ON p.property_id = t.property_id
      WHERE p.user_id = $1${filter}
      ORDER BY td.created_at DESC
    `,
    values,
  );
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const userId = await requireUserId(request);
  const input = await request.json();
  const tenancyId = Number(input.tenancy_id);
  const owned = await db.query(
    'SELECT 1 FROM tenancy t JOIN property p ON p.property_id = t.property_id WHERE t.tenancy_id = $1 AND p.user_id = $2',
    [tenancyId, userId],
  );
  if (!owned.rowCount) return NextResponse.json({ error: 'Mietverhältnis nicht gefunden.' }, { status: 404 });

  const existing = await db.query(
    `SELECT tenancy_document_id, storage_path FROM tenancy_document WHERE tenancy_id = $1 AND document_type = $2 AND tenancy_person_id IS NOT DISTINCT FROM $3 LIMIT 1`,
    [tenancyId, input.document_type, input.tenancy_person_id ?? null],
  );
  const previousStoragePath = existing.rows[0]?.storage_path ?? null;
  const { rows } = existing.rows[0]
    ? await db.query(
      `UPDATE tenancy_document SET file_name=$2, storage_path=$3, content_type=$4, file_size=$5, updated_at=NOW() WHERE tenancy_document_id=$1 RETURNING *`,
      [existing.rows[0].tenancy_document_id, input.file_name, input.storage_path, input.content_type ?? null, input.file_size ?? null],
    )
    : await db.query(
      `INSERT INTO tenancy_document (tenancy_id, tenancy_person_id, document_type, file_name, storage_path, content_type, file_size) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [tenancyId, input.tenancy_person_id ?? null, input.document_type, input.file_name, input.storage_path, input.content_type ?? null, input.file_size ?? null],
    );
  return NextResponse.json({ document: rows[0], previousStoragePath }, { status: 201 });
}

export async function DELETE(request: Request) {
  const userId = await requireUserId(request);
  const id = Number(new URL(request.url).searchParams.get('id'));
  const result = await db.query(
    `
      DELETE FROM tenancy_document td WHERE td.tenancy_document_id = $1 AND EXISTS (
        SELECT 1 FROM tenancy t JOIN property p ON p.property_id = t.property_id
        WHERE t.tenancy_id = td.tenancy_id AND p.user_id = $2
      )
    `,
    [id, userId],
  );
  return NextResponse.json({ deleted: result.rowCount ?? 0 });
}
