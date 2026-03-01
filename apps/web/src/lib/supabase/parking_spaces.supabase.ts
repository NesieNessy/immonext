// ==============================================================================
// ImmoNext – Supabase Client: parking_spaces
// ==============================================================================
import { supabase } from '@/lib/supabase/client';
import type { ParkingSpace, ParkingSpaceInsert, ParkingSpaceUpdate } from '@immonext/types';

function toParkingSpaces(row: Record<string, unknown>): ParkingSpace {
  return {
    parkingSpaceId:         row.parking_space_id as number,
    propertyId:             row.property_id as number,
    parkingSpaceType:       row.parking_space_type as ParkingSpace['parkingSpaceType'],
    numberOfParkingSpaces:  row.number_of_parking_spaces as number | null,
    createdAt:              row.created_at as string,
    updatedAt:              row.updated_at as string,
  };
}

export async function getParkingSpaces(propertyId: number): Promise<ParkingSpace[]> {
  const { data, error } = await supabase
    .from('parking_spaces')
    .select('*')
    .eq('property_id', propertyId);
  if (error || !data) return [];
  return data.map(toParkingSpaces);
}

export async function getParkingSpacesById(parkingSpaceId: number): Promise<ParkingSpace | null> {
  const { data, error } = await supabase
    .from('parking_spaces')
    .select('*')
    .eq('parking_space_id', parkingSpaceId)
    .single();
  if (error || !data) return null;
  return toParkingSpaces(data);
}

export async function createParkingSpaces(payload: ParkingSpaceInsert): Promise<ParkingSpace | null> {
  const { data, error } = await supabase
    .from('parking_spaces')
    .insert({
      property_id:              payload.propertyId,
      parking_space_type:       payload.parkingSpaceType,
      number_of_parking_spaces: payload.numberOfParkingSpaces,
    })
    .select()
    .single();
  if (error || !data) return null;
  return toParkingSpaces(data);
}

export async function updateParkingSpaces(parkingSpaceId: number, updates: ParkingSpaceUpdate): Promise<ParkingSpace | null> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.parkingSpaceType !== undefined)       dbUpdates.parking_space_type        = updates.parkingSpaceType;
  if (updates.numberOfParkingSpaces !== undefined)  dbUpdates.number_of_parking_spaces  = updates.numberOfParkingSpaces;
  const { data, error } = await supabase.from('parking_spaces').update(dbUpdates).eq('parking_space_id', parkingSpaceId).select().single();
  if (error || !data) return null;
  return toParkingSpaces(data);
}

export async function deleteParkingSpaces(parkingSpaceId: number): Promise<boolean> {
  const { error } = await supabase.from('parking_spaces').delete().eq('parking_space_id', parkingSpaceId);
  return !error;
}
