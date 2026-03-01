import { supabase } from '@/lib/supabase/client.supabase';
import type { Property, PropertyInsert, PropertyUpdate, PropertyWithCity } from '@immonext/types';

function toProperty(row: Record<string, unknown>): Property {
  return {
    propertyId:           row.property_id as number,
    userId:               row.user_id as string,
    cityId:               row.city_id as number,
    propertyAbbreviation: row.property_abbreviation as string,
    street:               row.street as string,
    houseNumber:          row.house_number as string,
    city:                 row.city as string,
    postalCode:           row.postal_code as string,
    federalState:         row.federal_state as string,
    squareMeters:         row.square_meters as number,
    numberOfRooms:        row.number_of_rooms as number,
    yearOfConstruction:   row.year_of_construction as number,
    energyEfficient:      row.energy_efficient as Property['energyEfficient'],
    imageUrl:             row.image_base64 as string | null,
    createdAt:            row.created_at as string,
    updatedAt:            row.updated_at as string,
  };
}

function toPropertyWithCity(row: Record<string, unknown>): PropertyWithCity {
  const cityRel = row.city_rel as Record<string, unknown>;
  return {
    ...toProperty(row),
    cityRel: {
      cityId:           cityRel.city_id as number,
      cityName:         cityRel.city_name as string,
      metropolitanArea: cityRel.metropolitan_area as string,
      buildingShare:    cityRel.building_share as number,
      landShare:        cityRel.land_share as number,
    },
  };
}

export async function getProperties(userId: string): Promise<Property[]> {
  const { data, error } = await supabase
    .from('property')
    .select('*')
    .eq('user_id', userId)
    .order('property_abbreviation', { ascending: true });

  if (error || !data) return [];
  return data.map(toProperty);
}

export async function getPropertiesWithCity(userId: string): Promise<PropertyWithCity[]> {
  const { data, error } = await supabase
    .from('property')
    .select(`
      *,
      city_rel:city (
        city_id,
        city_name,
        metropolitan_area,
        building_share,
        land_share
      )
    `)
    .eq('user_id', userId)
    .order('property_abbreviation', { ascending: true });

  if (error || !data) return [];
  return data.map(toPropertyWithCity);
}

export async function getPropertyById(propertyId: number): Promise<Property | null> {
  const { data, error } = await supabase
    .from('property')
    .select('*')
    .eq('property_id', propertyId)
    .single();

  if (error || !data) return null;
  return toProperty(data);
}

export async function getPropertyWithCityById(propertyId: number): Promise<PropertyWithCity | null> {
  const { data, error } = await supabase
    .from('property')
    .select(`
      *,
      city_rel:city (
        city_id,
        city_name,
        metropolitan_area,
        building_share,
        land_share
      )
    `)
    .eq('property_id', propertyId)
    .single();

  if (error || !data) return null;
  return toPropertyWithCity(data);
}

export async function createProperty(payload: PropertyInsert): Promise<Property | null> {
  const { data, error } = await supabase
    .from('property')
    .insert({
      user_id:              payload.userId,
      city_id:              payload.cityId,
      property_abbreviation:payload.propertyAbbreviation,
      street:               payload.street,
      house_number:         payload.houseNumber,
      city:                 payload.city,
      postal_code:          payload.postalCode,
      federal_state:        payload.federalState,
      square_meters:        payload.squareMeters,
      number_of_rooms:      payload.numberOfRooms,
      year_of_construction: payload.yearOfConstruction,
      energy_efficient:     payload.energyEfficient,
    })
    .select()
    .single();

  if (error || !data) return null;
  return toProperty(data);
}

export async function updateProperty(propertyId: number, updates: PropertyUpdate): Promise<Property | null> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.cityId !== undefined)               dbUpdates.city_id               = updates.cityId;
  if (updates.propertyAbbreviation !== undefined) dbUpdates.property_abbreviation = updates.propertyAbbreviation;
  if (updates.street !== undefined)               dbUpdates.street                = updates.street;
  if (updates.houseNumber !== undefined)          dbUpdates.house_number          = updates.houseNumber;
  if (updates.city !== undefined)                 dbUpdates.city                  = updates.city;
  if (updates.postalCode !== undefined)           dbUpdates.postal_code           = updates.postalCode;
  if (updates.federalState !== undefined)         dbUpdates.federal_state         = updates.federalState;
  if (updates.squareMeters !== undefined)         dbUpdates.square_meters         = updates.squareMeters;
  if (updates.numberOfRooms !== undefined)        dbUpdates.number_of_rooms       = updates.numberOfRooms;
  if (updates.yearOfConstruction !== undefined)   dbUpdates.year_of_construction  = updates.yearOfConstruction;
  if (updates.energyEfficient !== undefined)      dbUpdates.energy_efficient      = updates.energyEfficient;

  const { data, error } = await supabase
    .from('property')
    .update(dbUpdates)
    .eq('property_id', propertyId)
    .select()
    .single();

  if (error || !data) return null;
  return toProperty(data);
}

export async function deleteProperty(propertyId: number): Promise<boolean> {
  const { error } = await supabase
    .from('property')
    .delete()
    .eq('property_id', propertyId);

  return !error;
}