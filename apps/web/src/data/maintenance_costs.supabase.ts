// ==============================================================================
// ImmoNext – Supabase Client: maintenance_costs
// ==============================================================================
import { supabase } from '@/lib/supabase/client';
import type { MaintenanceCosts, MaintenanceCostsInsert, MaintenanceCostsUpdate } from '@immonext/types';

function toMaintenanceCosts(row: Record<string, unknown>): MaintenanceCosts {
  return {
    maintenanceCostsId:             row.maintenance_costs_id as number,
    propertyId:                     row.property_id as number,
    costBreakdown:                  row.cost_breakdown as boolean,
    allocableCosts:                 row.allocable_costs as number | null,
    nonAllocableCosts:              row.non_allocable_costs as number | null,
    totalCosts:                     row.total_costs as number | null,
    houseMoney:                     row.house_money as number | null,
    allocableCostsProjection:       row.allocable_costs_projection as boolean,
    nonAllocableCostsProjection:    row.non_allocable_costs_projection as boolean,
    totalCostsProjection:           row.total_costs_projection as boolean,
    createdAt:                      row.created_at as string,
    updatedAt:                      row.updated_at as string,
  };
}

export async function getMaintenanceCosts(propertyId: number): Promise<MaintenanceCosts[]> {
  const { data, error } = await supabase
    .from('maintenance_costs')
    .select('*')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map(toMaintenanceCosts);
}

export async function getMaintenanceCostsById(maintenanceCostsId: number): Promise<MaintenanceCosts | null> {
  const { data, error } = await supabase
    .from('maintenance_costs')
    .select('*')
    .eq('maintenance_costs_id', maintenanceCostsId)
    .single();
  if (error || !data) return null;
  return toMaintenanceCosts(data);
}

export async function createMaintenanceCosts(payload: MaintenanceCostsInsert): Promise<MaintenanceCosts | null> {
  const { data, error } = await supabase
    .from('maintenance_costs')
    .insert({
      property_id:                    payload.propertyId,
      cost_breakdown:                 payload.costBreakdown,
      allocable_costs:                payload.allocableCosts ?? null,
      non_allocable_costs:            payload.nonAllocableCosts ?? null,
      total_costs:                    payload.totalCosts ?? null,
      house_money:                    payload.houseMoney ?? null,
      allocable_costs_projection:     payload.allocableCostsProjection,
      non_allocable_costs_projection: payload.nonAllocableCostsProjection,
      total_costs_projection:         payload.totalCostsProjection,
    })
    .select()
    .single();
  if (error || !data) return null;
  return toMaintenanceCosts(data);
}

export async function updateMaintenanceCosts(maintenanceCostsId: number, updates: MaintenanceCostsUpdate): Promise<MaintenanceCosts | null> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.costBreakdown !== undefined)               dbUpdates.cost_breakdown                  = updates.costBreakdown;
  if (updates.allocableCosts !== undefined)              dbUpdates.allocable_costs                 = updates.allocableCosts;
  if (updates.nonAllocableCosts !== undefined)           dbUpdates.non_allocable_costs             = updates.nonAllocableCosts;
  if (updates.totalCosts !== undefined)                  dbUpdates.total_costs                     = updates.totalCosts;
  if (updates.houseMoney !== undefined)                  dbUpdates.house_money                     = updates.houseMoney;
  if (updates.allocableCostsProjection !== undefined)    dbUpdates.allocable_costs_projection      = updates.allocableCostsProjection;
  if (updates.nonAllocableCostsProjection !== undefined) dbUpdates.non_allocable_costs_projection  = updates.nonAllocableCostsProjection;
  if (updates.totalCostsProjection !== undefined)        dbUpdates.total_costs_projection          = updates.totalCostsProjection;
  const { data, error } = await supabase.from('maintenance_costs').update(dbUpdates).eq('maintenance_costs_id', maintenanceCostsId).select().single();
  if (error || !data) return null;
  return toMaintenanceCosts(data);
}

export async function deleteMaintenanceCosts(maintenanceCostsId: number): Promise<boolean> {
  const { error } = await supabase.from('maintenance_costs').delete().eq('maintenance_costs_id', maintenanceCostsId);
  return !error;
}
