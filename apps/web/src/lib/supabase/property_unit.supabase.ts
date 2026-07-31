import { supabase } from '@/lib/supabase/client.supabase';
import type { PropertyUnit, PropertyUnitInsert, PropertyUnitUpdate } from '@immonext/types';

function toPropertyUnit(row: Record<string, unknown>): PropertyUnit {
  return {
    propertyUnitId: row.property_unit_id as number,
    propertyId:     row.property_id as number,
    unitLabel:      row.unit_label as string,
    sortOrder:      row.sort_order as number,
    createdAt:      row.created_at as string,
    updatedAt:      row.updated_at as string,
  };
}

// ----------------------------------------------------------------------------
// Queries
// ----------------------------------------------------------------------------

export async function getPropertyUnitsByProperty(propertyId: number): Promise<PropertyUnit[]> {
  const { data, error } = await supabase
    .from('property_unit')
    .select('*')
    .eq('property_id', propertyId)
    .order('sort_order', { ascending: true });

  if (error || !data) return [];
  return data.map(toPropertyUnit);
}

export async function getPropertyUnitById(propertyUnitId: number): Promise<PropertyUnit | null> {
  const { data, error } = await supabase
    .from('property_unit')
    .select('*')
    .eq('property_unit_id', propertyUnitId)
    .single();

  if (error || !data) return null;
  return toPropertyUnit(data);
}

// ----------------------------------------------------------------------------
// Mutations
// ----------------------------------------------------------------------------

export async function createPropertyUnit(payload: PropertyUnitInsert): Promise<PropertyUnit | null> {
  const { data, error } = await supabase
    .from('property_unit')
    .insert({
      property_id: payload.propertyId,
      unit_label:  payload.unitLabel,
      sort_order:  payload.sortOrder,
    })
    .select()
    .single();

  if (error || !data) return null;
  return toPropertyUnit(data);
}

export async function updatePropertyUnit(
  propertyUnitId: number,
  updates: PropertyUnitUpdate,
): Promise<PropertyUnit | null> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.unitLabel !== undefined) dbUpdates.unit_label = updates.unitLabel;
  if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;

  const { data, error } = await supabase
    .from('property_unit')
    .update(dbUpdates)
    .eq('property_unit_id', propertyUnitId)
    .select()
    .single();

  if (error || !data) return null;
  return toPropertyUnit(data);
}

export async function deletePropertyUnit(propertyUnitId: number): Promise<boolean> {
  const { error } = await supabase
    .from('property_unit')
    .delete()
    .eq('property_unit_id', propertyUnitId);

  return !error;
}
