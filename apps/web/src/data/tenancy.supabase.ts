// ==============================================================================
// ImmoNext – Supabase Client: tenancy
// ==============================================================================
import { supabase } from '@/lib/supabase/client';
import type { Tenancy, TenancyInsert, TenancyUpdate } from '@immonext/types';

function toTenancy(row: Record<string, unknown>): Tenancy {
  return {
    tenancyId:           row.tenancy_id as number,
    propertyId:          row.property_id as number,
    parkingSpaceId:      row.parking_space_id as number | null,
    maintenanceCostsId:  row.maintenance_costs_id as number | null,
    isRented:            row.is_rented as boolean,
    rentalStartDate:     row.rental_start_date as string | null,
    rentalEndDate:       row.rental_end_date as string | null,
    rentalType:          row.rental_type as Tenancy['rentalType'],
    rentalUnits:         row.rental_units as number,
    rentalUnitsPrice:    row.rental_units_price as number | null,
    parkingSpaceRent:    row.parking_space_rent as number | null,
    miscRent:            row.misc_rent as number | null,
    warmRent:            row.warm_rent as number | null,
    coldRent:            row.cold_rent as number | null,
    createdAt:           row.created_at as string,
    updatedAt:           row.updated_at as string,
  };
}

export async function getTenancies(propertyId: number): Promise<Tenancy[]> {
  const { data, error } = await supabase
    .from('tenancy')
    .select('*')
    .eq('property_id', propertyId)
    .order('rental_start_date', { ascending: false });
  if (error || !data) return [];
  return data.map(toTenancy);
}

export async function getActiveTenancy(propertyId: number): Promise<Tenancy | null> {
  const { data, error } = await supabase
    .from('tenancy')
    .select('*')
    .eq('property_id', propertyId)
    .eq('is_rented', true)
    .is('rental_end_date', null)
    .single();
  if (error || !data) return null;
  return toTenancy(data);
}

export async function getTenancyById(tenancyId: number): Promise<Tenancy | null> {
  const { data, error } = await supabase
    .from('tenancy')
    .select('*')
    .eq('tenancy_id', tenancyId)
    .single();
  if (error || !data) return null;
  return toTenancy(data);
}

export async function createTenancy(payload: TenancyInsert): Promise<Tenancy | null> {
  const { data, error } = await supabase
    .from('tenancy')
    .insert({
      property_id:          payload.propertyId,
      parking_space_id:     payload.parkingSpaceId ?? null,
      maintenance_costs_id: payload.maintenanceCostsId ?? null,
      is_rented:            payload.isRented,
      rental_start_date:    payload.rentalStartDate ?? null,
      rental_end_date:      payload.rentalEndDate ?? null,
      rental_type:          payload.rentalType,
      rental_units:         payload.rentalUnits,
      rental_units_price:   payload.rentalUnitsPrice ?? null,
      parking_space_rent:   payload.parkingSpaceRent ?? null,
      misc_rent:            payload.miscRent ?? null,
      warm_rent:            payload.warmRent ?? null,
      cold_rent:            payload.coldRent ?? null,
    })
    .select()
    .single();
  if (error || !data) return null;
  return toTenancy(data);
}

export async function updateTenancy(tenancyId: number, updates: TenancyUpdate): Promise<Tenancy | null> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.parkingSpaceId !== undefined)     dbUpdates.parking_space_id     = updates.parkingSpaceId;
  if (updates.maintenanceCostsId !== undefined) dbUpdates.maintenance_costs_id = updates.maintenanceCostsId;
  if (updates.isRented !== undefined)           dbUpdates.is_rented            = updates.isRented;
  if (updates.rentalStartDate !== undefined)    dbUpdates.rental_start_date    = updates.rentalStartDate;
  if (updates.rentalEndDate !== undefined)      dbUpdates.rental_end_date      = updates.rentalEndDate;
  if (updates.rentalType !== undefined)         dbUpdates.rental_type          = updates.rentalType;
  if (updates.rentalUnits !== undefined)        dbUpdates.rental_units         = updates.rentalUnits;
  if (updates.rentalUnitsPrice !== undefined)   dbUpdates.rental_units_price   = updates.rentalUnitsPrice;
  if (updates.parkingSpaceRent !== undefined)   dbUpdates.parking_space_rent   = updates.parkingSpaceRent;
  if (updates.miscRent !== undefined)           dbUpdates.misc_rent            = updates.miscRent;
  if (updates.warmRent !== undefined)           dbUpdates.warm_rent            = updates.warmRent;
  if (updates.coldRent !== undefined)           dbUpdates.cold_rent            = updates.coldRent;
  const { data, error } = await supabase.from('tenancy').update(dbUpdates).eq('tenancy_id', tenancyId).select().single();
  if (error || !data) return null;
  return toTenancy(data);
}

export async function deleteTenancy(tenancyId: number): Promise<boolean> {
  const { error } = await supabase.from('tenancy').delete().eq('tenancy_id', tenancyId);
  return !error;
}
