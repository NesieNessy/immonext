import { supabase } from '@/lib/supabase/client.supabase';
import type { TenancyDocument, TenancyDocumentInsert, TenancyDocumentType } from '@immonext/types';

const BUCKET = 'tenancy-documents';

function toTenancyDocument(row: Record<string, unknown>): TenancyDocument {
  return {
    tenancyDocumentId: row.tenancy_document_id as number,
    tenancyId:         row.tenancy_id as number,
    tenancyPersonId:   row.tenancy_person_id as number | null,
    documentType:      row.document_type as TenancyDocumentType,
    fileName:          row.file_name as string,
    storagePath:       row.storage_path as string,
    contentType:       row.content_type as string | null,
    fileSize:          row.file_size as number | null,
    createdAt:         row.created_at as string,
    updatedAt:         row.updated_at as string,
  };
}

// ----------------------------------------------------------------------------
// Queries
// ----------------------------------------------------------------------------

export async function getTenancyDocumentsByTenancy(tenancyId: number): Promise<TenancyDocument[]> {
  const { data, error } = await supabase
    .from('tenancy_document')
    .select('*')
    .eq('tenancy_id', tenancyId);

  if (error || !data) return [];
  return data.map(toTenancyDocument);
}

/** Signed URL for viewing/downloading — the bucket is private. */
export async function getTenancyDocumentUrl(storagePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, 60);
  if (error || !data) return null;
  return data.signedUrl;
}

// ----------------------------------------------------------------------------
// Mutations
// ----------------------------------------------------------------------------

/**
 * Uploads the file to storage and upserts the tenancy_document row for this
 * (tenancy, person-or-shared, document type) slot — a re-upload replaces
 * whatever was there before, both the object and the old metadata row.
 */
export async function uploadTenancyDocument(
  userId: string,
  file: File,
  payload: Omit<TenancyDocumentInsert, 'fileName' | 'storagePath' | 'contentType' | 'fileSize'>,
): Promise<TenancyDocument | null> {
  let existingQuery = supabase
    .from('tenancy_document')
    .select('tenancy_document_id, storage_path')
    .eq('tenancy_id', payload.tenancyId)
    .eq('document_type', payload.documentType);
  existingQuery = payload.tenancyPersonId === null
    ? existingQuery.is('tenancy_person_id', null)
    : existingQuery.eq('tenancy_person_id', payload.tenancyPersonId);
  const { data: existing } = await existingQuery.maybeSingle();

  const storagePath = `${userId}/${payload.tenancyId}/${payload.documentType}-${payload.tenancyPersonId ?? 'shared'}-${crypto.randomUUID()}-${file.name}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
    contentType: file.type || undefined,
  });
  if (uploadError) return null;

  const { data, error } = await supabase
    .from('tenancy_document')
    .upsert(
      {
        tenancy_document_id: existing?.tenancy_document_id,
        tenancy_id:          payload.tenancyId,
        tenancy_person_id:   payload.tenancyPersonId,
        document_type:       payload.documentType,
        file_name:           file.name,
        storage_path:        storagePath,
        content_type:        file.type || null,
        file_size:           file.size,
      },
      { onConflict: 'tenancy_document_id' },
    )
    .select()
    .single();

  if (error || !data) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return null;
  }

  if (existing) {
    await supabase.storage.from(BUCKET).remove([existing.storage_path]);
  }

  return toTenancyDocument(data);
}

export async function deleteTenancyDocument(tenancyDocumentId: number, storagePath: string): Promise<boolean> {
  await supabase.storage.from(BUCKET).remove([storagePath]);
  const { error } = await supabase
    .from('tenancy_document')
    .delete()
    .eq('tenancy_document_id', tenancyDocumentId);

  return !error;
}
