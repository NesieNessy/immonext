// ==============================================================================
// ImmoNext – Supabase Client: rent_index
// ==============================================================================
import { supabase } from '@/lib/supabase/client.supabase';
import type {
  BuildingProportion, BuildingProportionInsert, BuildingProportionUpdate,
  Depreciation, DepreciationInsert, DepreciationUpdate,
  MetricsToday,
  RentIndex, RentIndexInsert, RentIndexUpdate,
} from '@immonext/types';

// ─── Mappers ──────────────────────────────────────────────────────────────────

function toRentIndex(row: Record<string, unknown>): RentIndex {
  return {
    rentIndexId:    row.rent_index_id as number,
    cityId:         row.city_id as number,
    validFrom:      row.valid_from as string,
    validUntil:     row.valid_until as string | null,
    methodology:    row.methodology as RentIndex['methodology'],
    referenceRents: row.reference_rents as number,
    createdAt:      row.created_at as string,
    updatedAt:      row.updated_at as string,
  };
}

function toBuildingProportion(row: Record<string, unknown>): BuildingProportion {
  return {
    buildingProportionId: row.building_proportion_id as number,
    propertyId:           row.property_id as number,
    acquisitionCostsId:   row.acquisition_costs_id as number | null,
    totalArea:            row.total_area as number | null,
    totalAreaShare:       row.total_area_share as number | null,
    landValue:            row.land_value as number | null,
    landAndSoil:          row.land_and_soil as number | null,
    buildingFactor:       row.building_factor as number | null,
    buildingValue:        row.building_value as number | null,
    numerator:            row.numerator as number | null,
    denominator:          row.denominator as number | null,
    ancillaryCostShare:   row.ancillary_cost_share as number | null,
    buildingDepreciation: row.building_depreciation as number | null,
    createdAt:            row.created_at as string,
    updatedAt:            row.updated_at as string,
  };
}

function toDepreciation(row: Record<string, unknown>): Depreciation {
  return {
    depreciationId:            row.depreciation_id as number,
    propertyId:                row.property_id as number,
    configId:                  row.config_id as number | null,
    depreciationType:          row.depreciation_type as string | null,
    depreciationCalculation:   row.depreciation_calculation as number | null,
    depreciationYear:          row.depreciation_year as number | null,
    residentialType:           row.residential_type as Depreciation['residentialType'] | null,
    roofRenewal:               row.roof_renewal as number | null,
    windowsExteriorDoors:      row.windows_exterior_doors as number | null,
    pipingSystems:             row.piping_systems as number | null,
    heatingSystem:             row.heating_system as number | null,
    exteriorWallInsulation:    row.exterior_wall_insulation as number | null,
    bathrooms:                 row.bathrooms as number | null,
    interiorFitting:           row.interior_fitting as number | null,
    floorplanImprovement:      row.floorplan_improvement as number | null,
    modernisationPoints:       row.modernisation_points as number | null,
    age:                       row.age as number | null,
    totalUsefulLife:           row.total_useful_life as number | null,
    remainingUsefulLifeYears:  row.remaining_useful_life_years as number | null,
    depreciationRatePercent:   row.depreciation_rate_percent as number | null,
    createdAt:                 row.created_at as string,
    updatedAt:                 row.updated_at as string,
  };
}

function toMetricsToday(row: Record<string, unknown>): MetricsToday {
  return {
    userId:                   row.user_id as string,
    propertyId:               row.property_id as number,
    tenancyId:                row.tenancy_id as number | null,
    coldRent:                 row.cold_rent as number | null,
    warmRent:                 row.warm_rent as number | null,
    isRented:                 row.is_rented as boolean | null,
    maintenanceCostsId:       row.maintenance_costs_id as number | null,
    maintenanceTotalCosts:    row.maintenance_total_costs as number | null,
    allocableCosts:           row.allocable_costs as number | null,
    nonAllocableCosts:        row.non_allocable_costs as number | null,
    financingId:              row.financing_id as number | null,
    monthlyDebtService:       row.monthly_debt_service as number | null,
    interestRate:             row.interest_rate as number | null,
    depreciationId:           row.depreciation_id as number | null,
    depreciationRatePercent:  row.depreciation_rate_percent as number | null,
    remainingUsefulLifeYears: row.remaining_useful_life_years as number | null,
    developmentId:            row.development_id as number | null,
  };
}

// ─── RentIndex ────────────────────────────────────────────────────────────────

export async function getRentIndexByCity(cityId: number): Promise<RentIndex[]> {
  const { data, error } = await supabase
    .from('rent_index')
    .select('*')
    .eq('city_id', cityId)
    .order('valid_from', { ascending: false });
  if (error || !data) return [];
  return data.map(toRentIndex);
}

export async function getActiveRentIndex(cityId: number): Promise<RentIndex | null> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('rent_index')
    .select('*')
    .eq('city_id', cityId)
    .lte('valid_from', today)
    .or(`valid_until.is.null,valid_until.gte.${today}`)
    .order('valid_from', { ascending: false })
    .limit(1)
    .single();
  if (error || !data) return null;
  return toRentIndex(data);
}

export async function getRentIndexById(rentIndexId: number): Promise<RentIndex | null> {
  const { data, error } = await supabase.from('rent_index').select('*').eq('rent_index_id', rentIndexId).single();
  if (error || !data) return null;
  return toRentIndex(data);
}

// Admin / service role only
export async function createRentIndex(payload: RentIndexInsert): Promise<RentIndex | null> {
  const { data, error } = await supabase
    .from('rent_index')
    .insert({
      city_id:         payload.cityId,
      valid_from:      payload.validFrom,
      valid_until:     payload.validUntil ?? null,
      methodology:     payload.methodology,
      reference_rents: payload.referenceRents,
    })
    .select()
    .single();
  if (error || !data) return null;
  return toRentIndex(data);
}

export async function updateRentIndex(rentIndexId: number, updates: RentIndexUpdate): Promise<RentIndex | null> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.validFrom !== undefined)      dbUpdates.valid_from      = updates.validFrom;
  if (updates.validUntil !== undefined)     dbUpdates.valid_until     = updates.validUntil;
  if (updates.methodology !== undefined)    dbUpdates.methodology     = updates.methodology;
  if (updates.referenceRents !== undefined) dbUpdates.reference_rents = updates.referenceRents;
  const { data, error } = await supabase.from('rent_index').update(dbUpdates).eq('rent_index_id', rentIndexId).select().single();
  if (error || !data) return null;
  return toRentIndex(data);
}

// ─── BuildingProportion ───────────────────────────────────────────────────────

export async function getBuildingProportion(propertyId: number): Promise<BuildingProportion | null> {
  const { data, error } = await supabase.from('building_proportion').select('*').eq('property_id', propertyId).single();
  if (error || !data) return null;
  return toBuildingProportion(data);
}

export async function upsertBuildingProportion(payload: BuildingProportionInsert): Promise<BuildingProportion | null> {
  const { data, error } = await supabase
    .from('building_proportion')
    .upsert({
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
      building_depreciation:payload.buildingDepreciation ?? null,
    }, { onConflict: 'property_id' })
    .select()
    .single();
  if (error || !data) return null;
  return toBuildingProportion(data);
}

export async function updateBuildingProportion(buildingProportionId: number, updates: BuildingProportionUpdate): Promise<BuildingProportion | null> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.acquisitionCostsId !== undefined)  dbUpdates.acquisition_costs_id  = updates.acquisitionCostsId;
  if (updates.totalArea !== undefined)            dbUpdates.total_area            = updates.totalArea;
  if (updates.totalAreaShare !== undefined)       dbUpdates.total_area_share      = updates.totalAreaShare;
  if (updates.landValue !== undefined)            dbUpdates.land_value            = updates.landValue;
  if (updates.landAndSoil !== undefined)          dbUpdates.land_and_soil         = updates.landAndSoil;
  if (updates.buildingFactor !== undefined)       dbUpdates.building_factor       = updates.buildingFactor;
  if (updates.buildingValue !== undefined)        dbUpdates.building_value        = updates.buildingValue;
  if (updates.numerator !== undefined)            dbUpdates.numerator             = updates.numerator;
  if (updates.denominator !== undefined)          dbUpdates.denominator           = updates.denominator;
  if (updates.ancillaryCostShare !== undefined)   dbUpdates.ancillary_cost_share  = updates.ancillaryCostShare;
  if (updates.buildingDepreciation !== undefined) dbUpdates.building_depreciation = updates.buildingDepreciation;
  const { data, error } = await supabase.from('building_proportion').update(dbUpdates).eq('building_proportion_id', buildingProportionId).select().single();
  if (error || !data) return null;
  return toBuildingProportion(data);
}

// ─── Depreciation ─────────────────────────────────────────────────────────────

export async function getDepreciation(propertyId: number): Promise<Depreciation | null> {
  const { data, error } = await supabase.from('depreciation').select('*').eq('property_id', propertyId).single();
  if (error || !data) return null;
  return toDepreciation(data);
}

export async function upsertDepreciation(payload: DepreciationInsert): Promise<Depreciation | null> {
  const { data, error } = await supabase
    .from('depreciation')
    .upsert({
      property_id:                payload.propertyId,
      config_id:                  payload.configId ?? null,
      depreciation_type:          payload.depreciationType ?? null,
      depreciation_calculation:   payload.depreciationCalculation ?? null,
      depreciation_year:          payload.depreciationYear ?? null,
      residential_type:           payload.residentialType ?? null,
      roof_renewal:               payload.roofRenewal ?? null,
      windows_exterior_doors:     payload.windowsExteriorDoors ?? null,
      piping_systems:             payload.pipingSystems ?? null,
      heating_system:             payload.heatingSystem ?? null,
      exterior_wall_insulation:   payload.exteriorWallInsulation ?? null,
      bathrooms:                  payload.bathrooms ?? null,
      interior_fitting:           payload.interiorFitting ?? null,
      floorplan_improvement:      payload.floorplanImprovement ?? null,
      modernisation_points:       payload.modernisationPoints ?? null,
      age:                        payload.age ?? null,
      total_useful_life:          payload.totalUsefulLife ?? null,
      remaining_useful_life_years:payload.remainingUsefulLifeYears ?? null,
      depreciation_rate_percent:  payload.depreciationRatePercent ?? null,
    }, { onConflict: 'property_id' })
    .select()
    .single();
  if (error || !data) return null;
  return toDepreciation(data);
}

export async function updateDepreciation(depreciationId: number, updates: DepreciationUpdate): Promise<Depreciation | null> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.configId !== undefined)                   dbUpdates.config_id                   = updates.configId;
  if (updates.depreciationType !== undefined)           dbUpdates.depreciation_type           = updates.depreciationType;
  if (updates.depreciationCalculation !== undefined)    dbUpdates.depreciation_calculation    = updates.depreciationCalculation;
  if (updates.depreciationYear !== undefined)           dbUpdates.depreciation_year           = updates.depreciationYear;
  if (updates.residentialType !== undefined)            dbUpdates.residential_type            = updates.residentialType;
  if (updates.roofRenewal !== undefined)                dbUpdates.roof_renewal                = updates.roofRenewal;
  if (updates.windowsExteriorDoors !== undefined)       dbUpdates.windows_exterior_doors      = updates.windowsExteriorDoors;
  if (updates.pipingSystems !== undefined)              dbUpdates.piping_systems              = updates.pipingSystems;
  if (updates.heatingSystem !== undefined)              dbUpdates.heating_system              = updates.heatingSystem;
  if (updates.exteriorWallInsulation !== undefined)     dbUpdates.exterior_wall_insulation    = updates.exteriorWallInsulation;
  if (updates.bathrooms !== undefined)                  dbUpdates.bathrooms                   = updates.bathrooms;
  if (updates.interiorFitting !== undefined)            dbUpdates.interior_fitting            = updates.interiorFitting;
  if (updates.floorplanImprovement !== undefined)       dbUpdates.floorplan_improvement       = updates.floorplanImprovement;
  if (updates.modernisationPoints !== undefined)        dbUpdates.modernisation_points        = updates.modernisationPoints;
  if (updates.age !== undefined)                        dbUpdates.age                         = updates.age;
  if (updates.totalUsefulLife !== undefined)            dbUpdates.total_useful_life           = updates.totalUsefulLife;
  if (updates.remainingUsefulLifeYears !== undefined)   dbUpdates.remaining_useful_life_years = updates.remainingUsefulLifeYears;
  if (updates.depreciationRatePercent !== undefined)    dbUpdates.depreciation_rate_percent   = updates.depreciationRatePercent;
  const { data, error } = await supabase.from('depreciation').update(dbUpdates).eq('depreciation_id', depreciationId).select().single();
  if (error || !data) return null;
  return toDepreciation(data);
}

// ─── MetricsToday (View) ──────────────────────────────────────────────────────

export async function getMetricsToday(propertyId: number): Promise<MetricsToday | null> {
  const { data, error } = await supabase
    .from('metrics_today')
    .select('*')
    .eq('property_id', propertyId)
    .single();
  if (error || !data) return null;
  return toMetricsToday(data);
}

export async function getMetricsTodayForUser(userId: string): Promise<MetricsToday[]> {
  const { data, error } = await supabase
    .from('metrics_today')
    .select('*')
    .eq('user_id', userId);
  if (error || !data) return [];
  return data.map(toMetricsToday);
}
