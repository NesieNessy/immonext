// ==============================================================================
// ImmoNext – Supabase Client: tenancy
// ==============================================================================
import { supabase } from '@/lib/supabase/client';
import type { Tenancy, TenancyInsert, TenancyUpdate } from '@immonext/types';

function toTenancy(row: Record<string, unknown>): Tenancy {
  return {
    tenancyId:           row.tenancy_id as number,
    propertyId:          row.property_id as number,
    parkingSpaceId:      row.parking_space_id as number,
    maintenanceCostsId:  row.maintenance_costs_id as number,
    isRented:            row.is_rented as boolean | null,
    tenancyStartDate:    row.tenancy_start_date as string | null,
    tenancyEndDate:      row.tenancy_end_date as string | null,
    tenancyType:         row.tenancy_type as Tenancy['tenancyType'],
    tenancyUnits:        row.tenancy_units as number | null,
    tenancyUnitsPrice:   row.tenancy_units_price as number | null,
    parkingSpaceRent:    row.parking_space_rent as number | null,
    miscRent:            row.misc_rent as number | null,
    warmRent:            row.warm_rent as number | null,
    coldRent:            row.cold_rent as number | null,
    tenantFirstName:     row.tenant_first_name as string,
    tenantLastName:      row.tenant_last_name as string,
    deposit:             row.deposit as number | null,
    createdAt:           row.created_at as string,
    updatedAt:           row.updated_at as string,
  };
}

export async function getTenancies(propertyId: number): Promise<Tenancy[]> {
  const { data, error } = await supabase
    .from('tenancy')
    .select('*')
    .eq('property_id', propertyId)
    .order('tenancy_start_date', { ascending: false });
  if (error || !data) return [];
  return data.map(toTenancy);
}

export async function getActiveTenancy(propertyId: number): Promise<Tenancy | null> {
  const { data, error } = await supabase
    .from('tenancy')
    .select('*')
    .eq('property_id', propertyId)
    .eq('is_rented', true)
    .is('tenancy_end_date', null)
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
      tenancy_start_date:   payload.tenancyStartDate ?? null,
      tenancy_end_date:     payload.tenancyEndDate ?? null,
      tenancy_type:         payload.tenancyType,
      tenancy_units:        payload.tenancyUnits,
      tenancy_units_price:  payload.tenancyUnitsPrice ?? null,
      parking_space_rent:   payload.parkingSpaceRent ?? null,
      misc_rent:            payload.miscRent ?? null,
      warm_rent:            payload.warmRent ?? null,
      cold_rent:            payload.coldRent ?? null,
      tenant_first_name:    payload.tenantFirstName,
      tenant_last_name:     payload.tenantLastName,
      deposit:              payload.deposit ?? null,
    })
    .select()
    .single();
  if (error || !data) return null;
  return toTenancy(data);
}

export async function updateTenancy(tenancyId: number, updates: TenancyUpdate): Promise<Tenancy | null> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.parkingSpaceId !== undefined)      dbUpdates.parking_space_id     = updates.parkingSpaceId;
  if (updates.maintenanceCostsId !== undefined)  dbUpdates.maintenance_costs_id = updates.maintenanceCostsId;
  if (updates.isRented !== undefined)            dbUpdates.is_rented            = updates.isRented;
  if (updates.tenancyStartDate !== undefined)    dbUpdates.tenancy_start_date   = updates.tenancyStartDate;
  if (updates.tenancyEndDate !== undefined)      dbUpdates.tenancy_end_date     = updates.tenancyEndDate;
  if (updates.tenancyType !== undefined)         dbUpdates.tenancy_type         = updates.tenancyType;
  if (updates.tenancyUnits !== undefined)        dbUpdates.tenancy_units        = updates.tenancyUnits;
  if (updates.tenancyUnitsPrice !== undefined)   dbUpdates.tenancy_units_price  = updates.tenancyUnitsPrice;
  if (updates.parkingSpaceRent !== undefined)    dbUpdates.parking_space_rent   = updates.parkingSpaceRent;
  if (updates.miscRent !== undefined)            dbUpdates.misc_rent            = updates.miscRent;
  if (updates.warmRent !== undefined)            dbUpdates.warm_rent            = updates.warmRent;
  if (updates.coldRent !== undefined)            dbUpdates.cold_rent            = updates.coldRent;
  if (updates.tenantFirstName !== undefined)     dbUpdates.tenant_first_name    = updates.tenantFirstName;
  if (updates.tenantLastName !== undefined)      dbUpdates.tenant_last_name     = updates.tenantLastName;
  if (updates.deposit !== undefined)             dbUpdates.deposit              = updates.deposit;
  const { data, error } = await supabase.from('tenancy').update(dbUpdates).eq('tenancy_id', tenancyId).select().single();
  if (error || !data) return null;
  return toTenancy(data);
}

export async function deleteTenancy(tenancyId: number): Promise<boolean> {
  const { error } = await supabase.from('tenancy').delete().eq('tenancy_id', tenancyId);
  return !error;
}
