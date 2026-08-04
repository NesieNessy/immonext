import { requireUserId } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const userId = await requireUserId(request);
  const { rows } = await db.query(
    'SELECT * FROM document WHERE user_id = $1 ORDER BY document_date DESC NULLS LAST, document_id DESC',
    [userId],
  );
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const userId = await requireUserId(request);
  const input = await request.json();
  if (input.property_id != null) {
    const property = await db.query('SELECT 1 FROM property WHERE property_id = $1 AND user_id = $2', [Number(input.property_id), userId]);
    if (!property.rowCount) return NextResponse.json({ error: 'Objekt nicht gefunden.' }, { status: 404 });
  }
  if (input.quick_check_id != null) {
    const quickCheck = await db.query('SELECT 1 FROM quick_check WHERE quick_check_id = $1 AND user_id = $2', [Number(input.quick_check_id), userId]);
    if (!quickCheck.rowCount) return NextResponse.json({ error: 'Ersteinschätzung nicht gefunden.' }, { status: 404 });
  }
  const { rows } = await db.query(
    `
      INSERT INTO document (
        user_id, category, name, property_id, quick_check_id, document_date,
        file_name, storage_path, content_type, file_size
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
    `,
    [
      userId, input.category, input.name, input.property_id ?? null,
      input.quick_check_id ?? null, input.document_date ?? null, input.file_name,
      input.storage_path, input.content_type ?? null, input.file_size ?? null,
    ],
  );
  return NextResponse.json(rows[0], { status: 201 });
}

export async function DELETE(request: Request) {
  const userId = await requireUserId(request);
  const id = Number(new URL(request.url).searchParams.get('id'));
  const result = await db.query('DELETE FROM document WHERE document_id = $1 AND user_id = $2', [id, userId]);
  return NextResponse.json({ deleted: result.rowCount ?? 0 });
}
