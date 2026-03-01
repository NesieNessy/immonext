// ==============================================================================
// ImmoNext – Supabase Client: development_tomorrow, development_tomorrow_metrics
// ==============================================================================
import { supabase } from '@/lib/supabase/client.supabase';
import type {
    DevelopmentTomorrow, DevelopmentTomorrowInsert,
    DevelopmentTomorrowMetrics, DevelopmentTomorrowMetricsInsert,
    DevelopmentTomorrowUpdate,
} from '@immonext/types';

// ─── Mappers ──────────────────────────────────────────────────────────────────

function toDevelopmentTomorrow(row: Record<string, unknown>): DevelopmentTomorrow {
  return {
    developmentTomorrowId:                row.development_tomorrow_id as number,
    propertyId:                           row.property_id as number,
    tenancyId:                            row.tenancy_id as number | null,
    cityId:                               row.city_id as number | null,
    legalRequirementsId:                  row.legal_requirements_id as number | null,
    rentIndexId:                          row.rent_index_id as number | null,
    financingId:                          row.financing_id as number | null,
    developmentYear:                      row.development_year as number | null,
    yearStart:                            row.year_start as number | null,
    dateStart:                            row.date_start as number | null,
    metropolitanArea:                     row.metropolitan_area as boolean | null,
    coldRentIncrease:                     row.cold_rent_increase as number | null,
    coldRentIncreaseEligible:             row.cold_rent_increase_eligible as boolean | null,
    coldRentIncreaseLockPeriod:           row.cold_rent_increase_lock_period as number | null,
    coldRentIncreaseReminder:             row.cold_rent_increase_reminder as boolean | null,
    coldRentIncreasePercent:              row.cold_rent_increase_percent as number | null,
    coldRentIncrease3YearAveragePercent:  row.cold_rent_increase_3year_average_percent as number | null,
    lastRentIncrease:                     row.last_rent_increase as number | null,
    lastRentIncreaseRelevance:            row.last_rent_increase_relevance as boolean | null,
    lastRentIncreaseValue:                row.last_rent_increase_value as number | null,
    lastRentIncreasePercent:              row.last_rent_increase_percent as number | null,
    createdAt:                            row.created_at as string,
    updatedAt:                            row.updated_at as string,
  };
}

function toDevelopmentTomorrowMetrics(row: Record<string, unknown>): DevelopmentTomorrowMetrics {
  return {
    metricsId:                          row.metrics_id as number,
    developmentTomorrowId:              row.development_tomorrow_id as number,
    sqmPriceWithRi:                     row.sqm_price_with_ri as number | null,
    sqmPriceWithoutRi:                  row.sqm_price_without_ri as number | null,
    totalRentWithRi:                    row.total_rent_with_ri as number | null,
    totalRentWithoutRi:                 row.total_rent_without_ri as number | null,
    debtServiceDiffWithRi:              row.debt_service_diff_with_ri as number | null,
    debtServiceDiffWithoutRi:           row.debt_service_diff_without_ri as number | null,
    netRentYieldPreTaxWithRi:           row.net_rent_yield_pre_tax_with_ri as number | null,
    netRentYieldPreTaxWithoutRi:        row.net_rent_yield_pre_tax_without_ri as number | null,
    netRentYieldAfterTaxWithRi:         row.net_rent_yield_after_tax_with_ri as number | null,
    netRentYieldAfterTaxWithoutRi:      row.net_rent_yield_after_tax_without_ri as number | null,
    operativeCashflowWithRi:            row.operative_cashflow_with_ri as number | null,
    operativeCashflowWithoutRi:         row.operative_cashflow_without_ri as number | null,
    afterTaxCashflowWithRi:             row.after_tax_cashflow_with_ri as number | null,
    afterTaxCashflowWithoutRi:          row.after_tax_cashflow_without_ri as number | null,
    computedAt:                         row.computed_at as string,
  };
}

// ─── DevelopmentTomorrow ──────────────────────────────────────────────────────

export async function getDevelopmentTomorrows(propertyId: number): Promise<DevelopmentTomorrow[]> {
  const { data, error } = await supabase
    .from('development_tomorrow')
    .select('*')
    .eq('property_id', propertyId)
    .order('development_year', { ascending: true });
  if (error || !data) return [];
  return data.map(toDevelopmentTomorrow);
}

export async function getDevelopmentTomorrowById(developmentTomorrowId: number): Promise<DevelopmentTomorrow | null> {
  const { data, error } = await supabase
    .from('development_tomorrow')
    .select('*')
    .eq('development_tomorrow_id', developmentTomorrowId)
    .single();
  if (error || !data) return null;
  return toDevelopmentTomorrow(data);
}

export async function createDevelopmentTomorrow(payload: DevelopmentTomorrowInsert): Promise<DevelopmentTomorrow | null> {
  const { data, error } = await supabase
    .from('development_tomorrow')
    .insert({
      property_id:                              payload.propertyId,
      tenancy_id:                               payload.tenancyId ?? null,
      city_id:                                  payload.cityId ?? null,
      legal_requirements_id:                    payload.legalRequirementsId ?? null,
      rent_index_id:                            payload.rentIndexId ?? null,
      financing_id:                             payload.financingId ?? null,
      development_year:                         payload.developmentYear ?? null,
      year_start:                               payload.yearStart ?? null,
      date_start:                               payload.dateStart ?? null,
      metropolitan_area:                        payload.metropolitanArea ?? null,
      cold_rent_increase:                       payload.coldRentIncrease ?? null,
      cold_rent_increase_eligible:              payload.coldRentIncreaseEligible ?? null,
      cold_rent_increase_lock_period:           payload.coldRentIncreaseLockPeriod ?? null,
      cold_rent_increase_reminder:              payload.coldRentIncreaseReminder ?? null,
      cold_rent_increase_percent:               payload.coldRentIncreasePercent ?? null,
      cold_rent_increase_3year_average_percent: payload.coldRentIncrease3YearAveragePercent ?? null,
      last_rent_increase:                       payload.lastRentIncrease ?? null,
      last_rent_increase_relevance:             payload.lastRentIncreaseRelevance ?? null,
      last_rent_increase_value:                 payload.lastRentIncreaseValue ?? null,
      last_rent_increase_percent:               payload.lastRentIncreasePercent ?? null,
    })
    .select()
    .single();
  if (error || !data) return null;
  return toDevelopmentTomorrow(data);
}

export async function updateDevelopmentTomorrow(developmentTomorrowId: number, updates: DevelopmentTomorrowUpdate): Promise<DevelopmentTomorrow | null> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.tenancyId !== undefined)                           dbUpdates.tenancy_id                               = updates.tenancyId;
  if (updates.cityId !== undefined)                              dbUpdates.city_id                                  = updates.cityId;
  if (updates.legalRequirementsId !== undefined)                 dbUpdates.legal_requirements_id                    = updates.legalRequirementsId;
  if (updates.rentIndexId !== undefined)                         dbUpdates.rent_index_id                            = updates.rentIndexId;
  if (updates.financingId !== undefined)                         dbUpdates.financing_id                             = updates.financingId;
  if (updates.developmentYear !== undefined)                     dbUpdates.development_year                         = updates.developmentYear;
  if (updates.yearStart !== undefined)                           dbUpdates.year_start                               = updates.yearStart;
  if (updates.dateStart !== undefined)                           dbUpdates.date_start                               = updates.dateStart;
  if (updates.metropolitanArea !== undefined)                    dbUpdates.metropolitan_area                        = updates.metropolitanArea;
  if (updates.coldRentIncrease !== undefined)                    dbUpdates.cold_rent_increase                       = updates.coldRentIncrease;
  if (updates.coldRentIncreaseEligible !== undefined)            dbUpdates.cold_rent_increase_eligible              = updates.coldRentIncreaseEligible;
  if (updates.coldRentIncreaseLockPeriod !== undefined)          dbUpdates.cold_rent_increase_lock_period           = updates.coldRentIncreaseLockPeriod;
  if (updates.coldRentIncreaseReminder !== undefined)            dbUpdates.cold_rent_increase_reminder              = updates.coldRentIncreaseReminder;
  if (updates.coldRentIncreasePercent !== undefined)             dbUpdates.cold_rent_increase_percent               = updates.coldRentIncreasePercent;
  if (updates.coldRentIncrease3YearAveragePercent !== undefined) dbUpdates.cold_rent_increase_3year_average_percent = updates.coldRentIncrease3YearAveragePercent;
  if (updates.lastRentIncrease !== undefined)                    dbUpdates.last_rent_increase                       = updates.lastRentIncrease;
  if (updates.lastRentIncreaseRelevance !== undefined)           dbUpdates.last_rent_increase_relevance             = updates.lastRentIncreaseRelevance;
  if (updates.lastRentIncreaseValue !== undefined)               dbUpdates.last_rent_increase_value                 = updates.lastRentIncreaseValue;
  if (updates.lastRentIncreasePercent !== undefined)             dbUpdates.last_rent_increase_percent               = updates.lastRentIncreasePercent;
  const { data, error } = await supabase
    .from('development_tomorrow')
    .update(dbUpdates)
    .eq('development_tomorrow_id', developmentTomorrowId)
    .select()
    .single();
  if (error || !data) return null;
  return toDevelopmentTomorrow(data);
}

export async function deleteDevelopmentTomorrow(developmentTomorrowId: number): Promise<boolean> {
  const { error } = await supabase
    .from('development_tomorrow')
    .delete()
    .eq('development_tomorrow_id', developmentTomorrowId);
  return !error;
}

// ─── DevelopmentTomorrowMetrics ───────────────────────────────────────────────

export async function getDevelopmentTomorrowMetrics(developmentTomorrowId: number): Promise<DevelopmentTomorrowMetrics[]> {
  const { data, error } = await supabase
    .from('development_tomorrow_metrics')
    .select('*')
    .eq('development_tomorrow_id', developmentTomorrowId)
    .order('computed_at', { ascending: false });
  if (error || !data) return [];
  return data.map(toDevelopmentTomorrowMetrics);
}

export async function createDevelopmentTomorrowMetrics(payload: DevelopmentTomorrowMetricsInsert): Promise<DevelopmentTomorrowMetrics | null> {
  const { data, error } = await supabase
    .from('development_tomorrow_metrics')
    .insert({
      development_tomorrow_id:              payload.developmentTomorrowId,
      sqm_price_with_ri:                    payload.sqmPriceWithRi ?? null,
      sqm_price_without_ri:                 payload.sqmPriceWithoutRi ?? null,
      total_rent_with_ri:                   payload.totalRentWithRi ?? null,
      total_rent_without_ri:                payload.totalRentWithoutRi ?? null,
      debt_service_diff_with_ri:            payload.debtServiceDiffWithRi ?? null,
      debt_service_diff_without_ri:         payload.debtServiceDiffWithoutRi ?? null,
      net_rent_yield_pre_tax_with_ri:       payload.netRentYieldPreTaxWithRi ?? null,
      net_rent_yield_pre_tax_without_ri:    payload.netRentYieldPreTaxWithoutRi ?? null,
      net_rent_yield_after_tax_with_ri:     payload.netRentYieldAfterTaxWithRi ?? null,
      net_rent_yield_after_tax_without_ri:  payload.netRentYieldAfterTaxWithoutRi ?? null,
      operative_cashflow_with_ri:           payload.operativeCashflowWithRi ?? null,
      operative_cashflow_without_ri:        payload.operativeCashflowWithoutRi ?? null,
      after_tax_cashflow_with_ri:           payload.afterTaxCashflowWithRi ?? null,
      after_tax_cashflow_without_ri:        payload.afterTaxCashflowWithoutRi ?? null,
    })
    .select()
    .single();
  if (error || !data) return null;
  return toDevelopmentTomorrowMetrics(data);
}

export async function deleteDevelopmentTomorrowMetrics(metricsId: number): Promise<boolean> {
  const { error } = await supabase
    .from('development_tomorrow_metrics')
    .delete()
    .eq('metrics_id', metricsId);
  return !error;
}
