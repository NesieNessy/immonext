import { supabase } from '@/lib/supabase/client.supabase';
import type { MoveOutDamage, MoveOutMeterReading, TenancyMoveOut, TenancyMoveOutInsert, TenancyMoveOutUpdate } from '@immonext/types';

const BUCKET = 'tenancy-documents';

function toTenancyMoveOut(row: Record<string, unknown>): TenancyMoveOut {
  return {
    tenancyMoveOutId: row.tenancy_move_out_id as number,
    tenancyId:        row.tenancy_id as number,
    propertyId:       row.property_id as number,
    meterReadings:    (row.meter_readings as MoveOutMeterReading[] | null) ?? [],
    damages:          (row.damages as MoveOutDamage[] | null) ?? [],
    createdAt:        row.created_at as string,
    updatedAt:        row.updated_at as string,
  };
}

export async function getTenancyMoveOutByTenancy(tenancyId: number): Promise<TenancyMoveOut | null> {
  const { data, error } = await supabase
    .from('tenancy_move_out')
    .select('*')
    .eq('tenancy_id', tenancyId)
    .maybeSingle();
  if (error || !data) return null;
  return toTenancyMoveOut(data);
}

export async function createTenancyMoveOut(payload: TenancyMoveOutInsert): Promise<TenancyMoveOut | null> {
  const { data, error } = await supabase
    .from('tenancy_move_out')
    .insert({
      tenancy_id:     payload.tenancyId,
      property_id:    payload.propertyId,
      meter_readings: payload.meterReadings,
      damages:        payload.damages,
    })
    .select()
    .single();
  if (error || !data) return null;
  return toTenancyMoveOut(data);
}

export async function updateTenancyMoveOut(tenancyMoveOutId: number, updates: TenancyMoveOutUpdate): Promise<TenancyMoveOut | null> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.meterReadings !== undefined) dbUpdates.meter_readings = updates.meterReadings;
  if (updates.damages !== undefined)       dbUpdates.damages        = updates.damages;
  const { data, error } = await supabase
    .from('tenancy_move_out')
    .update(dbUpdates)
    .eq('tenancy_move_out_id', tenancyMoveOutId)
    .select()
    .single();
  if (error || !data) return null;
  return toTenancyMoveOut(data);
}

// ----------------------------------------------------------------------------
// Damage photos — stored directly in the tenancy-documents bucket (RLS is
// folder-based on userId, no tenancy_document row needed) since each damage
// can carry several photos and re-uploading must never replace an existing
// one, unlike the single-slot Ausweis/Schufa/… documents.
// ----------------------------------------------------------------------------

export async function uploadMoveOutDamagePhoto(userId: string, tenancyId: number, file: File): Promise<{ path: string; fileName: string } | null> {
  const path = `${userId}/${tenancyId}/move-out-damage/${crypto.randomUUID()}-${file.name}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type || undefined });
  if (error) return null;
  return { path, fileName: file.name };
}

export async function getMoveOutDamagePhotoUrl(storagePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, 60);
  if (error || !data) return null;
  return data.signedUrl;
}

export async function deleteMoveOutDamagePhoto(storagePath: string): Promise<boolean> {
  const { error } = await supabase.storage.from(BUCKET).remove([storagePath]);
  return !error;
}
