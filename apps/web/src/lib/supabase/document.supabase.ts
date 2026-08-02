import { supabase } from '@/lib/supabase/client.supabase';
import type { DocumentCategory, UserDocument, UserDocumentInsert } from '@immonext/types';

const BUCKET = 'documents';

const MIME_TYPES_BY_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

/** `File.type` is unreliable for PDFs on Windows (comes back empty when the
 *  .pdf extension has no registered MIME association), which then fails the
 *  bucket's allowed_mime_types check silently. Derive it from the extension
 *  instead so uploads don't depend on OS/browser MIME sniffing. */
function resolveContentType(file: File): string {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  return MIME_TYPES_BY_EXTENSION[ext] ?? file.type ?? 'application/octet-stream';
}

function toUserDocument(row: Record<string, unknown>): UserDocument {
  return {
    documentId:     row.document_id as number,
    userId:         row.user_id as string,
    category:       row.category as DocumentCategory,
    name:           row.name as string,
    propertyId:     row.property_id as number | null,
    quickCheckId:   row.quick_check_id as number | null,
    documentDate:   row.document_date as string | null,
    fileName:       row.file_name as string,
    storagePath:    row.storage_path as string,
    contentType:    row.content_type as string | null,
    fileSize:       row.file_size as number | null,
    createdAt:      row.created_at as string,
    updatedAt:      row.updated_at as string,
  };
}

// ----------------------------------------------------------------------------
// Queries
// ----------------------------------------------------------------------------

export async function getDocumentsByUser(userId: string): Promise<UserDocument[]> {
  const { data, error } = await supabase
    .from('document')
    .select('*')
    .eq('user_id', userId)
    .order('document_date', { ascending: false, nullsFirst: false });

  if (error || !data) return [];
  return data.map(toUserDocument);
}

/** Short-lived signed URL — bucket is private, no public access. */
export async function getDocumentUrl(storagePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, 60);
  if (error || !data) return null;
  return data.signedUrl;
}

// ----------------------------------------------------------------------------
// Mutations
// ----------------------------------------------------------------------------

export interface UploadDocumentResult {
  document: UserDocument | null;
  error: string | null;
}

export async function uploadDocument(userId: string, file: File, payload: UserDocumentInsert): Promise<UploadDocumentResult> {
  const storagePath = `${userId}/${Date.now()}-${file.name}`;
  const contentType = resolveContentType(file);

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
    contentType,
  });
  if (uploadError) {
    console.error('Document upload failed:', uploadError.message);
    return { document: null, error: uploadError.message };
  }

  const { data, error } = await supabase
    .from('document')
    .insert({
      user_id:        payload.userId,
      category:       payload.category,
      name:           payload.name,
      property_id:    payload.propertyId,
      quick_check_id: payload.quickCheckId,
      document_date:  payload.documentDate,
      file_name:      file.name,
      storage_path:   storagePath,
      content_type:   contentType,
      file_size:      file.size,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Document metadata insert failed:', error?.message);
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return { document: null, error: error?.message ?? 'Unbekannter Fehler beim Speichern.' };
  }
  return { document: toUserDocument(data), error: null };
}

export async function deleteDocument(documentId: number, storagePath: string): Promise<boolean> {
  const { error: storageError } = await supabase.storage.from(BUCKET).remove([storagePath]);
  if (storageError) return false;

  const { error } = await supabase.from('document').delete().eq('document_id', documentId);
  return !error;
}
