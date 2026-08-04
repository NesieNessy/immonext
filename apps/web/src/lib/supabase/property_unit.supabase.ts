import { jsonRequest, propertyResourceRequest } from '@/lib/api/propertyResources';
import type { EnergyEfficient, PropertyUnit, PropertyUnitInsert, PropertyUnitUpdate, UnitUsageType } from '@immonext/types';

function toPropertyUnit(row: Record<string, unknown>): PropertyUnit {
  return {
    propertyUnitId:        row.property_unit_id as number,
    propertyId:            row.property_id as number,
    unitLabel:              row.unit_label as string,
    sortOrder:              row.sort_order as number,
    usageType:              row.usage_type as UnitUsageType,
    floor:                  row.floor as string | null,
    locationNote:           row.location_note as string | null,
    livingAreaM2:           row.living_area_m2 as number | null,
    numberOfRooms:          row.number_of_rooms as number | null,
    yearOfConstruction:     row.year_of_construction as number | null,
    energyEfficient:        row.energy_efficient as EnergyEfficient | null,
    numberOfParkingSpaces:  row.number_of_parking_spaces as number,
    targetColdRent:         row.target_cold_rent as number | null,
    targetParkingRent:      row.target_parking_rent as number | null,
    targetAncillaryCosts:   row.target_ancillary_costs as number | null,
    createdAt:              row.created_at as string,
    updatedAt:              row.updated_at as string,
  };
}

// ----------------------------------------------------------------------------
// Queries
// ----------------------------------------------------------------------------

export async function getPropertyUnitsByProperty(propertyId: number): Promise<PropertyUnit[]> {
  const data = await propertyResourceRequest<Record<string, unknown>[]>('property-units', {}, { propertyId });
  return data?.map(toPropertyUnit) ?? [];
}

export async function getPropertyUnitById(propertyUnitId: number): Promise<PropertyUnit | null> {
  const data = await propertyResourceRequest<Record<string, unknown>>('property-units', {}, { id: propertyUnitId });
  if (!data) return null;
  return toPropertyUnit(data);
}

// ----------------------------------------------------------------------------
// Mutations
// ----------------------------------------------------------------------------

export async function createPropertyUnit(payload: PropertyUnitInsert): Promise<PropertyUnit | null> {
  const data = await propertyResourceRequest<Record<string, unknown>>('property-units', jsonRequest('POST', { values: {
      property_id:               payload.propertyId,
      unit_label:                payload.unitLabel,
      sort_order:                payload.sortOrder,
      usage_type:                payload.usageType,
      floor:                     payload.floor,
      location_note:             payload.locationNote,
      living_area_m2:            payload.livingAreaM2,
      number_of_rooms:           payload.numberOfRooms,
      year_of_construction:      payload.yearOfConstruction,
      energy_efficient:          payload.energyEfficient,
      number_of_parking_spaces:  payload.numberOfParkingSpaces,
      target_cold_rent:          payload.targetColdRent,
      target_parking_rent:       payload.targetParkingRent,
      target_ancillary_costs:    payload.targetAncillaryCosts,
    } }));
  if (!data) return null;
  return toPropertyUnit(data);
}

export async function updatePropertyUnit(
  propertyUnitId: number,
  updates: PropertyUnitUpdate,
): Promise<PropertyUnit | null> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.unitLabel !== undefined)             dbUpdates.unit_label = updates.unitLabel;
  if (updates.sortOrder !== undefined)             dbUpdates.sort_order = updates.sortOrder;
  if (updates.usageType !== undefined)             dbUpdates.usage_type = updates.usageType;
  if (updates.floor !== undefined)                 dbUpdates.floor = updates.floor;
  if (updates.locationNote !== undefined)          dbUpdates.location_note = updates.locationNote;
  if (updates.livingAreaM2 !== undefined)          dbUpdates.living_area_m2 = updates.livingAreaM2;
  if (updates.numberOfRooms !== undefined)         dbUpdates.number_of_rooms = updates.numberOfRooms;
  if (updates.yearOfConstruction !== undefined)    dbUpdates.year_of_construction = updates.yearOfConstruction;
  if (updates.energyEfficient !== undefined)       dbUpdates.energy_efficient = updates.energyEfficient;
  if (updates.numberOfParkingSpaces !== undefined) dbUpdates.number_of_parking_spaces = updates.numberOfParkingSpaces;
  if (updates.targetColdRent !== undefined)        dbUpdates.target_cold_rent = updates.targetColdRent;
  if (updates.targetParkingRent !== undefined)     dbUpdates.target_parking_rent = updates.targetParkingRent;
  if (updates.targetAncillaryCosts !== undefined)  dbUpdates.target_ancillary_costs = updates.targetAncillaryCosts;

  const data = await propertyResourceRequest<Record<string, unknown>>('property-units', jsonRequest('PATCH', { id: propertyUnitId, values: dbUpdates }));
  if (!data) return null;
  return toPropertyUnit(data);
}

export async function deletePropertyUnit(propertyUnitId: number): Promise<boolean> {
  return Boolean(await propertyResourceRequest<{ deleted: number }>('property-units', { method: 'DELETE' }, { id: propertyUnitId }));
}
