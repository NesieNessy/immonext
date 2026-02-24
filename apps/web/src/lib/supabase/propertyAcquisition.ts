import { supabase } from '@/lib/supabase/client';
import type {
  PropertyAcquisition,
  PropertyAcquisitionInsert,
  PropertyAcquisitionUpdate,
} from '@immonext/types';

function toPropertyAcquisition(row: Record<string, unknown>): PropertyAcquisition {
  return {
    propertyAcquisitionId: row.property_acquisition_id as number,
    propertyId:            row.property_id as number,
    houseCompletionYear:   row.house_completion_year as number,
    purchaseDate:          row.purchase_date as string | null,
    transferDate:          row.transfer_date as string | null,
    createdAt:             row.created_at as string,
    updatedAt:             row.updated_at as string,
  };
}

// ----------------------------------------------------------------------------
// Queries
// ----------------------------------------------------------------------------

export async function getPropertyAcquisitionByProperty(
  propertyId: number,
): Promise<PropertyAcquisition | null> {
  const { data, error } = await supabase
    .from('property_acquisition')
    .select('*')
    .eq('property_id', propertyId)
    .single();

  if (error || !data) return null;
  return toPropertyAcquisition(data);
}

export async function getPropertyAcquisitionById(
  propertyAcquisitionId: number,
): Promise<PropertyAcquisition | null> {
  const { data, error } = await supabase
    .from('property_acquisition')
    .select('*')
    .eq('property_acquisition_id', propertyAcquisitionId)
    .single();

  if (error || !data) return null;
  return toPropertyAcquisition(data);
}

// ----------------------------------------------------------------------------
// Mutations
// ----------------------------------------------------------------------------

export async function createPropertyAcquisition(
  payload: PropertyAcquisitionInsert,
): Promise<PropertyAcquisition | null> {
  const { data, error } = await supabase
    .from('property_acquisition')
    .insert({
      property_id:           payload.propertyId,
      house_completion_year: payload.houseCompletionYear ?? null,
      purchase_date:         payload.purchaseDate ?? null,
      transfer_date:         payload.transferDate ?? null,
    })
    .select()
    .single();

  if (error || !data) return null;
  return toPropertyAcquisition(data);
}

export async function updatePropertyAcquisition(
  propertyAcquisitionId: number,
  updates: PropertyAcquisitionUpdate,
): Promise<PropertyAcquisition | null> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.propertyId !== undefined)          dbUpdates.property_id           = updates.propertyId;
  if (updates.houseCompletionYear !== undefined) dbUpdates.house_completion_year = updates.houseCompletionYear;
  if (updates.purchaseDate !== undefined)        dbUpdates.purchase_date         = updates.purchaseDate;
  if (updates.transferDate !== undefined)        dbUpdates.transfer_date         = updates.transferDate;

  const { data, error } = await supabase
    .from('property_acquisition')
    .update(dbUpdates)
    .eq('property_acquisition_id', propertyAcquisitionId)
    .select()
    .single();

  if (error || !data) return null;
  return toPropertyAcquisition(data);
}

export async function upsertPropertyAcquisition(
  payload: PropertyAcquisitionInsert,
): Promise<PropertyAcquisition | null> {
  const { data, error } = await supabase
    .from('property_acquisition')
    .upsert(
      {
        property_id:           payload.propertyId,
        house_completion_year: payload.houseCompletionYear ?? null,
        purchase_date:         payload.purchaseDate ?? null,
        transfer_date:         payload.transferDate ?? null,
      },
      { onConflict: 'property_id' },
    )
    .select()
    .single();

  if (error || !data) return null;
  return toPropertyAcquisition(data);
}

export async function deletePropertyAcquisition(propertyAcquisitionId: number): Promise<boolean> {
  const { error } = await supabase
    .from('property_acquisition')
    .delete()
    .eq('property_acquisition_id', propertyAcquisitionId);

  return !error;
}
