// ==============================================================================
// ImmoNext – Supabase Client: renovation
// ==============================================================================
import { supabase } from '@/lib/supabase/client.supabase';
import type { Renovation, RenovationInsert, RenovationUpdate } from '@immonext/types';

function toRenovation(row: Record<string, unknown>): Renovation {
  return {
    renovationId:                row.renovation_id as number,
    propertyId:                  row.property_id as number,
    legalRequirementsId:         row.legal_requirements_id as number | null,
    modernisationProperty:       row.modernisation_property as string | null,
    modernisationDate:           row.modernisation_date as string | null,
    modernisationValue:          row.modernisation_value as number | null,
    limit15Percent:              row.limit_15_percent as number | null,
    threeYearValue:              row.three_year_value as number | null,
    lastModernisation:           row.last_modernisation as string | null,
    lastModernisationRelevance:  row.last_modernisation_relevance as string | null,
    lastModernisationValue:      row.last_modernisation_value as number | null,
    lastModernisationPercent:    row.last_modernisation_percent as number | null,
    purchaseDepreciation:        row.purchase_depreciation as number | null,
    createdAt:                   row.created_at as string,
    updatedAt:                   row.updated_at as string,
  };
}

export async function getRenovations(propertyId: number): Promise<Renovation[]> {
  const { data, error } = await supabase
    .from('renovation')
    .select('*')
    .eq('property_id', propertyId)
    .order('modernisation_date', { ascending: false });
  if (error || !data) return [];
  return data.map(toRenovation);
}

export async function getRenovationById(renovationId: number): Promise<Renovation | null> {
  const { data, error } = await supabase
    .from('renovation')
    .select('*')
    .eq('renovation_id', renovationId)
    .single();
  if (error || !data) return null;
  return toRenovation(data);
}

export async function createRenovation(payload: RenovationInsert): Promise<Renovation | null> {
  const { data, error } = await supabase
    .from('renovation')
    .insert({
      property_id:                  payload.propertyId,
      legal_requirements_id:        payload.legalRequirementsId ?? null,
      modernisation_property:       payload.modernisationProperty ?? null,
      modernisation_date:           payload.modernisationDate ?? null,
      modernisation_value:          payload.modernisationValue ?? null,
      limit_15_percent:             payload.limit15Percent ?? null,
      three_year_value:             payload.threeYearValue ?? null,
      last_modernisation:           payload.lastModernisation ?? null,
      last_modernisation_relevance: payload.lastModernisationRelevance ?? null,
      last_modernisation_value:     payload.lastModernisationValue ?? null,
      last_modernisation_percent:   payload.lastModernisationPercent ?? null,
      purchase_depreciation:        payload.purchaseDepreciation ?? null,
    })
    .select()
    .single();
  if (error || !data) return null;
  return toRenovation(data);
}

export async function updateRenovation(renovationId: number, updates: RenovationUpdate): Promise<Renovation | null> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.legalRequirementsId !== undefined)        dbUpdates.legal_requirements_id        = updates.legalRequirementsId;
  if (updates.modernisationProperty !== undefined)      dbUpdates.modernisation_property       = updates.modernisationProperty;
  if (updates.modernisationDate !== undefined)          dbUpdates.modernisation_date           = updates.modernisationDate;
  if (updates.modernisationValue !== undefined)         dbUpdates.modernisation_value          = updates.modernisationValue;
  if (updates.limit15Percent !== undefined)             dbUpdates.limit_15_percent             = updates.limit15Percent;
  if (updates.threeYearValue !== undefined)             dbUpdates.three_year_value             = updates.threeYearValue;
  if (updates.lastModernisation !== undefined)          dbUpdates.last_modernisation           = updates.lastModernisation;
  if (updates.lastModernisationRelevance !== undefined) dbUpdates.last_modernisation_relevance = updates.lastModernisationRelevance;
  if (updates.lastModernisationValue !== undefined)     dbUpdates.last_modernisation_value     = updates.lastModernisationValue;
  if (updates.lastModernisationPercent !== undefined)   dbUpdates.last_modernisation_percent   = updates.lastModernisationPercent;
  if (updates.purchaseDepreciation !== undefined)       dbUpdates.purchase_depreciation        = updates.purchaseDepreciation;
  const { data, error } = await supabase
    .from('renovation')
    .update(dbUpdates)
    .eq('renovation_id', renovationId)
    .select()
    .single();
  if (error || !data) return null;
  return toRenovation(data);
}

export async function deleteRenovation(renovationId: number): Promise<boolean> {
  const { error } = await supabase
    .from('renovation')
    .delete()
    .eq('renovation_id', renovationId);
  return !error;
}
