import { supabase } from '@/lib/supabase/client.supabase';
import type {
    ParkingSpace,
    ParkingSpaceInsert,
    ParkingSpaceType,
    ParkingSpaceUpdate,
} from '@immonext/types';

function toParkingSpace(row: Record<string, unknown>): ParkingSpace {
  return {
    parkingSpaceId:        row.parking_space_id as number,
    propertyId:            row.property_id as number,
    parkingSpaceType:      row.parking_space_type as ParkingSpaceType | null,
    numberOfParkingSpaces: row.number_of_parking_spaces as number | null,
    createdAt:             row.created_at as string,
    updatedAt:             row.updated_at as string,
  };
}

// ----------------------------------------------------------------------------
// Queries
// ----------------------------------------------------------------------------

export async function getParkingSpacesByProperty(propertyId: number): Promise<ParkingSpace[]> {
  const { data, error } = await supabase
    .from('parking_space')
    .select('*')
    .eq('property_id', propertyId)
    .order('parking_space_id', { ascending: true });

  if (error || !data) return [];
  return data.map(toParkingSpace);
}

export async function getParkingSpaceById(parkingSpaceId: number): Promise<ParkingSpace | null> {
  const { data, error } = await supabase
    .from('parking_space')
    .select('*')
    .eq('parking_space_id', parkingSpaceId)
    .single();

  if (error || !data) return null;
  return toParkingSpace(data);
}

// ----------------------------------------------------------------------------
// Mutations
// ----------------------------------------------------------------------------

export async function createParkingSpace(payload: ParkingSpaceInsert): Promise<ParkingSpace | null> {
  const { data, error } = await supabase
    .from('parking_space')
    .insert({
      property_id:              payload.propertyId,
      parking_space_type:       payload.parkingSpaceType,
      number_of_parking_spaces: payload.numberOfParkingSpaces,
    })
    .select()
    .single();

  if (error || !data) return null;
  return toParkingSpace(data);
}

export async function updateParkingSpace(
  parkingSpaceId: number,
  updates: ParkingSpaceUpdate,
): Promise<ParkingSpace | null> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.propertyId !== undefined)            dbUpdates.property_id              = updates.propertyId;
  if (updates.parkingSpaceType !== undefined)      dbUpdates.parking_space_type       = updates.parkingSpaceType;
  if (updates.numberOfParkingSpaces !== undefined) dbUpdates.number_of_parking_spaces = updates.numberOfParkingSpaces;

  const { data, error } = await supabase
    .from('parking_space')
    .update(dbUpdates)
    .eq('parking_space_id', parkingSpaceId)
    .select()
    .single();

  if (error || !data) return null;
  return toParkingSpace(data);
}

export async function deleteParkingSpace(parkingSpaceId: number): Promise<boolean> {
  const { error } = await supabase
    .from('parking_space')
    .delete()
    .eq('parking_space_id', parkingSpaceId);

  return !error;
}

export async function deleteParkingSpacesByProperty(propertyId: number): Promise<boolean> {
  const { error } = await supabase
    .from('parking_space')
    .delete()
    .eq('property_id', propertyId);

  return !error;
}
