import { supabase } from '@/lib/supabase/client';
import type { City, CityInsert, CityUpdate } from '@immonext/types';

function toCity(row: Record<string, unknown>): City {
  return {
    cityId:           row.city_id as number,
    cityName:         row.city_name as string,
    buildingShare:    row.building_share as number,
    landShare:        row.land_share as number,
    metropolitanArea: row.metropolitan_area as City['metropolitanArea'],
    createdAt:        row.created_at as string,
    updatedAt:        row.updated_at as string,
  };
}

export async function getAllCities(): Promise<City[]> {
  const { data, error } = await supabase
    .from('city')
    .select('*')
    .order('city_name', { ascending: true });

  if (error || !data) return [];
  return data.map(toCity);
}

export async function getCityById(cityId: number): Promise<City | null> {
  const { data, error } = await supabase
    .from('city')
    .select('*')
    .eq('city_id', cityId)
    .single();

  if (error || !data) return null;
  return toCity(data);
}

export async function getCityByName(cityName: string): Promise<City | null> {
  const { data, error } = await supabase
    .from('city')
    .select('*')
    .eq('city_name', cityName)
    .single();

  if (error || !data) return null;
  return toCity(data);
}

export async function getCitiesByMetropolitanArea(area: City['metropolitanArea']): Promise<City[]> {
  const { data, error } = await supabase
    .from('city')
    .select('*')
    .eq('metropolitan_area', area)
    .order('city_name', { ascending: true });

  if (error || !data) return [];
  return data.map(toCity);
}

export async function searchCities(query: string): Promise<City[]> {
  const { data, error } = await supabase
    .from('city')
    .select('*')
    .ilike('city_name', `%${query}%`)
    .order('city_name', { ascending: true })
    .limit(20);

  if (error || !data) return [];
  return data.map(toCity);
}

// ----------------------------------------------------------------------------
// Mutations — admin / service role only
// ----------------------------------------------------------------------------

export async function createCity(payload: CityInsert): Promise<City | null> {
  const { data, error } = await supabase
    .from('city')
    .insert({
      city_name:         payload.cityName,
      building_share:    payload.buildingShare,
      land_share:        payload.landShare,
      metropolitan_area: payload.metropolitanArea,
    })
    .select()
    .single();

  if (error || !data) return null;
  return toCity(data);
}

export async function updateCity(cityId: number, updates: CityUpdate): Promise<City | null> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.cityName !== undefined)         dbUpdates.city_name         = updates.cityName;
  if (updates.buildingShare !== undefined)    dbUpdates.building_share    = updates.buildingShare;
  if (updates.landShare !== undefined)        dbUpdates.land_share        = updates.landShare;
  if (updates.metropolitanArea !== undefined) dbUpdates.metropolitan_area = updates.metropolitanArea;

  const { data, error } = await supabase
    .from('city')
    .update(dbUpdates)
    .eq('city_id', cityId)
    .select()
    .single();

  if (error || !data) return null;
  return toCity(data);
}

export async function deleteCity(cityId: number): Promise<boolean> {
  const { error } = await supabase
    .from('city')
    .delete()
    .eq('city_id', cityId);

  return !error;
}