// ==============================================================================
// ImmoNext – Supabase Client: legal_requirements
// Read-only for app users — data is maintained by admin / service role.
// ==============================================================================
import { supabase } from '@/lib/supabase/client.supabase';
import type { LegalRequirements, LegalRequirementsInsert, LegalRequirementsUpdate } from '@immonext/types';

function toLegalRequirements(row: Record<string, unknown>): LegalRequirements {
  return {
    legalRequirementsId:    row.legal_requirements_id as number,
    cityId:                 row.city_id as number,
    rentCapLimit:           row.rent_cap_limit as number | null,
    sqmIncreaseLow:         row.sqm_increase_low as number | null,
    sqmIncreaseHigh:        row.sqm_increase_high as number | null,
    renovationLimitPercent: row.renovation_limit_percent as number | null,
    validFrom:              row.valid_from as string,
    validUntil:             row.valid_until as string | null,
    createdAt:              row.created_at as string,
    updatedAt:              row.updated_at as string,
  };
}

export async function getLegalRequirementsByCity(cityId: number): Promise<LegalRequirements[]> {
  const { data, error } = await supabase
    .from('legal_requirements')
    .select('*')
    .eq('city_id', cityId)
    .order('valid_from', { ascending: false });
  if (error || !data) return [];
  return data.map(toLegalRequirements);
}

export async function getActiveLegalRequirements(cityId: number): Promise<LegalRequirements | null> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('legal_requirements')
    .select('*')
    .eq('city_id', cityId)
    .lte('valid_from', today)
    .or(`valid_until.is.null,valid_until.gte.${today}`)
    .order('valid_from', { ascending: false })
    .limit(1)
    .single();
  if (error || !data) return null;
  return toLegalRequirements(data);
}

export async function getLegalRequirementsById(legalRequirementsId: number): Promise<LegalRequirements | null> {
  const { data, error } = await supabase
    .from('legal_requirements')
    .select('*')
    .eq('legal_requirements_id', legalRequirementsId)
    .single();
  if (error || !data) return null;
  return toLegalRequirements(data);
}

// Admin / service role only
export async function createLegalRequirements(payload: LegalRequirementsInsert): Promise<LegalRequirements | null> {
  const { data, error } = await supabase
    .from('legal_requirements')
    .insert({
      city_id:                  payload.cityId,
      rent_cap_limit:           payload.rentCapLimit ?? null,
      sqm_increase_low:         payload.sqmIncreaseLow ?? null,
      sqm_increase_high:        payload.sqmIncreaseHigh ?? null,
      renovation_limit_percent: payload.renovationLimitPercent ?? null,
      valid_from:               payload.validFrom,
      valid_until:              payload.validUntil ?? null,
    })
    .select()
    .single();
  if (error || !data) return null;
  return toLegalRequirements(data);
}

// Admin / service role only
export async function updateLegalRequirements(legalRequirementsId: number, updates: LegalRequirementsUpdate): Promise<LegalRequirements | null> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.rentCapLimit !== undefined)           dbUpdates.rent_cap_limit           = updates.rentCapLimit;
  if (updates.sqmIncreaseLow !== undefined)         dbUpdates.sqm_increase_low         = updates.sqmIncreaseLow;
  if (updates.sqmIncreaseHigh !== undefined)        dbUpdates.sqm_increase_high        = updates.sqmIncreaseHigh;
  if (updates.renovationLimitPercent !== undefined) dbUpdates.renovation_limit_percent = updates.renovationLimitPercent;
  if (updates.validFrom !== undefined)              dbUpdates.valid_from               = updates.validFrom;
  if (updates.validUntil !== undefined)             dbUpdates.valid_until              = updates.validUntil;
  const { data, error } = await supabase
    .from('legal_requirements')
    .update(dbUpdates)
    .eq('legal_requirements_id', legalRequirementsId)
    .select()
    .single();
  if (error || !data) return null;
  return toLegalRequirements(data);
}
