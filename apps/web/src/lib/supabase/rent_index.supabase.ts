// ==============================================================================
// ImmoNext – Supabase Client: rent_index
// Read-only for app users — data is maintained by admin / service role.
// ==============================================================================
import { supabase } from '@/lib/supabase/client.supabase';
import type { RentIndex, RentIndexInsert, RentIndexUpdate } from '@immonext/types';

function toRentIndex(row: Record<string, unknown>): RentIndex {
  return {
    rentIndexId:     row.rent_index_id as number,
    cityId:          row.city_id as number,
    validFrom:       row.valid_from as string,
    validUntil:      row.valid_until as string | null,
    methodology:     row.methodology as RentIndex['methodology'],
    referenceRents:  row.reference_rents as number,
    createdAt:       row.created_at as string,
    updatedAt:       row.updated_at as string,
  };
}

export async function getRentIndexByCity(cityId: number): Promise<RentIndex[]> {
  const { data, error } = await supabase
    .from('rent_index')
    .select('*')
    .eq('city_id', cityId)
    .order('valid_from', { ascending: false });
  if (error || !data) return [];
  return data.map(toRentIndex);
}

export async function getActiveRentIndex(cityId: number): Promise<RentIndex | null> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('rent_index')
    .select('*')
    .eq('city_id', cityId)
    .lte('valid_from', today)
    .or(`valid_until.is.null,valid_until.gte.${today}`)
    .order('valid_from', { ascending: false })
    .limit(1)
    .single();
  if (error || !data) return null;
  return toRentIndex(data);
}

export async function getRentIndexById(rentIndexId: number): Promise<RentIndex | null> {
  const { data, error } = await supabase
    .from('rent_index')
    .select('*')
    .eq('rent_index_id', rentIndexId)
    .single();
  if (error || !data) return null;
  return toRentIndex(data);
}

// Admin / service role only
export async function createRentIndex(payload: RentIndexInsert): Promise<RentIndex | null> {
  const { data, error } = await supabase
    .from('rent_index')
    .insert({
      city_id:         payload.cityId,
      valid_from:      payload.validFrom,
      valid_until:     payload.validUntil ?? null,
      methodology:     payload.methodology,
      reference_rents: payload.referenceRents,
    })
    .select()
    .single();
  if (error || !data) return null;
  return toRentIndex(data);
}

// Admin / service role only
export async function updateRentIndex(rentIndexId: number, updates: RentIndexUpdate): Promise<RentIndex | null> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.validFrom !== undefined)      dbUpdates.valid_from      = updates.validFrom;
  if (updates.validUntil !== undefined)     dbUpdates.valid_until     = updates.validUntil;
  if (updates.methodology !== undefined)    dbUpdates.methodology     = updates.methodology;
  if (updates.referenceRents !== undefined) dbUpdates.reference_rents = updates.referenceRents;
  const { data, error } = await supabase
    .from('rent_index')
    .update(dbUpdates)
    .eq('rent_index_id', rentIndexId)
    .select()
    .single();
  if (error || !data) return null;
  return toRentIndex(data);
}
