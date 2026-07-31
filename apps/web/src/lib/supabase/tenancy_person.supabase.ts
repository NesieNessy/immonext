import { supabase } from '@/lib/supabase/client.supabase';
import type { TenancyPerson, TenancyPersonInsert, TenancyPersonUpdate } from '@immonext/types';

function toTenancyPerson(row: Record<string, unknown>): TenancyPerson {
  return {
    tenancyPersonId: row.tenancy_person_id as number,
    tenancyId:       row.tenancy_id as number,
    lastName:        row.last_name as string | null,
    firstName:       row.first_name as string | null,
    taxId:           row.tax_id as string | null,
    isPrimary:       row.is_primary as boolean,
    sortOrder:       row.sort_order as number,
    moveInDate:      row.move_in_date as string | null,
    createdAt:       row.created_at as string,
    updatedAt:       row.updated_at as string,
  };
}

// ----------------------------------------------------------------------------
// Queries
// ----------------------------------------------------------------------------

export async function getTenancyPersonsByTenancy(tenancyId: number): Promise<TenancyPerson[]> {
  const { data, error } = await supabase
    .from('tenancy_person')
    .select('*')
    .eq('tenancy_id', tenancyId)
    .order('sort_order', { ascending: true });

  if (error || !data) return [];
  return data.map(toTenancyPerson);
}

// ----------------------------------------------------------------------------
// Mutations
// ----------------------------------------------------------------------------

export async function createTenancyPerson(payload: TenancyPersonInsert): Promise<TenancyPerson | null> {
  const { data, error } = await supabase
    .from('tenancy_person')
    .insert({
      tenancy_id: payload.tenancyId,
      last_name:  payload.lastName,
      first_name: payload.firstName,
      tax_id:      payload.taxId,
      is_primary:  payload.isPrimary,
      sort_order:  payload.sortOrder,
      move_in_date: payload.moveInDate,
    })
    .select()
    .single();

  if (error || !data) return null;
  return toTenancyPerson(data);
}

export async function updateTenancyPerson(
  tenancyPersonId: number,
  updates: TenancyPersonUpdate,
): Promise<TenancyPerson | null> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.lastName !== undefined)  dbUpdates.last_name  = updates.lastName;
  if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName;
  if (updates.taxId !== undefined)     dbUpdates.tax_id     = updates.taxId;
  if (updates.isPrimary !== undefined) dbUpdates.is_primary = updates.isPrimary;
  if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;
  if (updates.moveInDate !== undefined) dbUpdates.move_in_date = updates.moveInDate;

  const { data, error } = await supabase
    .from('tenancy_person')
    .update(dbUpdates)
    .eq('tenancy_person_id', tenancyPersonId)
    .select()
    .single();

  if (error || !data) return null;
  return toTenancyPerson(data);
}

export async function deleteTenancyPerson(tenancyPersonId: number): Promise<boolean> {
  const { error } = await supabase
    .from('tenancy_person')
    .delete()
    .eq('tenancy_person_id', tenancyPersonId);

  return !error;
}
