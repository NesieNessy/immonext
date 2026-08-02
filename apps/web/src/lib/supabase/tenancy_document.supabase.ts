import { supabase } from '@/lib/supabase/client.supabase';

const BUCKET = 'tenancy-documents';

export type TenancyDocumentType = 'Ausweis' | 'Schufa' | 'Bürgschaft' | 'Mietvertrag';

export interface TenancyDocumentForUser {
  tenancyDocumentId: number;
  tenancyId: number;
  propertyId: number | null;
  documentType: TenancyDocumentType;
  fileName: string;
  storagePath: string;
  createdAt: string;
}

/**
 * Documents uploaded per-tenancy on the Mieterdaten page (Ausweis/Schufa/
 * Bürgschaft/Mietvertrag) — surfaced here too so the global Dokumente page
 * doesn't miss them. tenancy_document has no user_id of its own, so this
 * joins through tenancy → property client-side; RLS on both tables already
 * scopes everything to the caller, so no explicit user filter is needed.
 */
export async function getTenancyDocumentsByUser(): Promise<TenancyDocumentForUser[]> {
  const [{ data: docs, error: docsError }, { data: tenancies, error: tenanciesError }] = await Promise.all([
    supabase.from('tenancy_document').select('*'),
    supabase.from('tenancy').select('tenancy_id, property_id'),
  ]);
  if (docsError || tenanciesError || !docs || !tenancies) return [];

  const propertyIdByTenancy = new Map<number, number | null>(
    tenancies.map((t) => [t.tenancy_id as number, t.property_id as number | null])
  );

  return docs.map((row) => ({
    tenancyDocumentId: row.tenancy_document_id as number,
    tenancyId: row.tenancy_id as number,
    propertyId: propertyIdByTenancy.get(row.tenancy_id as number) ?? null,
    documentType: row.document_type as TenancyDocumentType,
    fileName: row.file_name as string,
    storagePath: row.storage_path as string,
    createdAt: row.created_at as string,
  }));
}

/** Short-lived signed URL — bucket is private, no public access. */
export async function getTenancyDocumentUrl(storagePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, 60);
  if (error || !data) return null;
  return data.signedUrl;
}

export async function deleteTenancyDocument(tenancyDocumentId: number, storagePath: string): Promise<boolean> {
  const { error: storageError } = await supabase.storage.from(BUCKET).remove([storagePath]);
  if (storageError) return false;

  const { error } = await supabase.from('tenancy_document').delete().eq('tenancy_document_id', tenancyDocumentId);
  return !error;
}
