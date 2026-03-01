// ==============================================================================
// ImmoNext – Supabase Client: building_proportion
// ==============================================================================
import { supabase } from '@/lib/supabase/client.supabase';
import type { BuildingProportion, BuildingProportionInsert, BuildingProportionUpdate } from '@immonext/types';

function toBuildingProportion(row: Record<string, unknown>): BuildingProportion {
  return {
    buildingProportionId:   row.building_proportion_id as number,
    propertyId:             row.property_id as number,
    acquisitionCostsId:     row.acquisition_costs_id as number | null,
    totalArea:              row.total_area as number | null,
    totalAreaShare:         row.total_area_share as number | null,
    landValue:              row.land_value as number | null,
    landAndSoil:            row.land_and_soil as number | null,
    buildingFactor:         row.building_factor as number | null,
    buildingValue:          row.building_value as number | null,
    numerator:              row.numerator as number | null,
    denominator:            row.denominator as number | null,
    ancillaryCostShare:     row.ancillary_cost_share as number | null,
    buildingDepreciation:   row.building_depreciation as number | null,
    createdAt:              row.created_at as string,
    updatedAt:              row.updated_at as string,
  };
}

export async function getBuildingProportion(propertyId: number): Promise<BuildingProportion | null> {
  const { data, error } = await supabase
    .from('building_proportion')
    .select('*')
    .eq('property_id', propertyId)
    .single();
  if (error || !data) return null;
  return toBuildingProportion(data);
}

export async function getBuildingProportionById(buildingProportionId: number): Promise<BuildingProportion | null> {
  const { data, error } = await supabase
    .from('building_proportion')
    .select('*')
    .eq('building_proportion_id', buildingProportionId)
    .single();
  if (error || !data) return null;
  return toBuildingProportion(data);
}

export async function createBuildingProportion(payload: BuildingProportionInsert): Promise<BuildingProportion | null> {
  const { data, error } = await supabase
    .from('building_proportion')
    .insert({
      property_id:          payload.propertyId,
      acquisition_costs_id: payload.acquisitionCostsId ?? null,
      total_area:           payload.totalArea ?? null,
      total_area_share:     payload.totalAreaShare ?? null,
      land_value:           payload.landValue ?? null,
      land_and_soil:        payload.landAndSoil ?? null,
      building_factor:      payload.buildingFactor ?? null,
      building_value:       payload.buildingValue ?? null,
      numerator:            payload.numerator ?? null,
      denominator:          payload.denominator ?? null,
      ancillary_cost_share: payload.ancillaryCostShare ?? null,
      building_depreciation: payload.buildingDepreciation ?? null,
    })
    .select()
    .single();
  if (error || !data) return null;
  return toBuildingProportion(data);
}

export async function updateBuildingProportion(buildingProportionId: number, updates: BuildingProportionUpdate): Promise<BuildingProportion | null> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.acquisitionCostsId !== undefined)   dbUpdates.acquisition_costs_id  = updates.acquisitionCostsId;
  if (updates.totalArea !== undefined)             dbUpdates.total_area            = updates.totalArea;
  if (updates.totalAreaShare !== undefined)        dbUpdates.total_area_share      = updates.totalAreaShare;
  if (updates.landValue !== undefined)             dbUpdates.land_value            = updates.landValue;
  if (updates.landAndSoil !== undefined)           dbUpdates.land_and_soil         = updates.landAndSoil;
  if (updates.buildingFactor !== undefined)        dbUpdates.building_factor       = updates.buildingFactor;
  if (updates.buildingValue !== undefined)         dbUpdates.building_value        = updates.buildingValue;
  if (updates.numerator !== undefined)             dbUpdates.numerator             = updates.numerator;
  if (updates.denominator !== undefined)           dbUpdates.denominator           = updates.denominator;
  if (updates.ancillaryCostShare !== undefined)    dbUpdates.ancillary_cost_share  = updates.ancillaryCostShare;
  if (updates.buildingDepreciation !== undefined)  dbUpdates.building_depreciation = updates.buildingDepreciation;
  const { data, error } = await supabase
    .from('building_proportion')
    .update(dbUpdates)
    .eq('building_proportion_id', buildingProportionId)
    .select()
    .single();
  if (error || !data) return null;
  return toBuildingProportion(data);
}

export async function deleteBuildingProportion(buildingProportionId: number): Promise<boolean> {
  const { error } = await supabase
    .from('building_proportion')
    .delete()
    .eq('building_proportion_id', buildingProportionId);
  return !error;
}
