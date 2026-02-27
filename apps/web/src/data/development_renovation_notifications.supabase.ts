// ==============================================================================
// ImmoNext – Supabase Client: development_tomorrow, renovation,
//            legal_requirements, system_config, notifications
// ==============================================================================
import { supabase } from '@/lib/supabase/client';
import type {
  DevelopmentTomorrow, DevelopmentTomorrowInsert, DevelopmentTomorrowUpdate,
  DevelopmentTomorrowMetrics, DevelopmentTomorrowMetricsInsert,
  Renovation, RenovationInsert, RenovationUpdate,
  LegalRequirements, LegalRequirementsInsert, LegalRequirementsUpdate,
  SystemConfig, SystemConfigUpdate,
  Notification, NotificationInsert,
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

function toSystemConfig(row: Record<string, unknown>): SystemConfig {
  return {
    configId:    row.config_id as number,
    configKey:   row.config_key as string,
    configValue: row.config_value as string,
    description: row.description as string | null,
    createdAt:   row.created_at as string,
    updatedAt:   row.updated_at as string,
  };
}

function toNotification(row: Record<string, unknown>): Notification {
  return {
    notificationId:  row.notification_id as number,
    userId:          row.user_id as string,
    propertyId:      row.property_id as number | null,
    type:            row.type as Notification['type'],
    message:         row.message as string,
    tradesperson:    row.tradesperson as string | null,
    financialBroker: row.financial_broker as string | null,
    readAt:          row.read_at as string | null,
    createdAt:       row.created_at as string,
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
  const { data, error } = await supabase.from('development_tomorrow').select('*').eq('development_tomorrow_id', developmentTomorrowId).single();
  if (error || !data) return null;
  return toDevelopmentTomorrow(data);
}

export async function createDevelopmentTomorrow(payload: DevelopmentTomorrowInsert): Promise<DevelopmentTomorrow | null> {
  const { data, error } = await supabase
    .from('development_tomorrow')
    .insert({
      property_id:                            payload.propertyId,
      tenancy_id:                             payload.tenancyId ?? null,
      city_id:                                payload.cityId ?? null,
      legal_requirements_id:                  payload.legalRequirementsId ?? null,
      rent_index_id:                          payload.rentIndexId ?? null,
      financing_id:                           payload.financingId ?? null,
      development_year:                       payload.developmentYear ?? null,
      year_start:                             payload.yearStart ?? null,
      date_start:                             payload.dateStart ?? null,
      metropolitan_area:                      payload.metropolitanArea ?? null,
      cold_rent_increase:                     payload.coldRentIncrease ?? null,
      cold_rent_increase_eligible:            payload.coldRentIncreaseEligible ?? null,
      cold_rent_increase_lock_period:         payload.coldRentIncreaseLockPeriod ?? null,
      cold_rent_increase_reminder:            payload.coldRentIncreaseReminder ?? null,
      cold_rent_increase_percent:             payload.coldRentIncreasePercent ?? null,
      cold_rent_increase_3year_average_percent: payload.coldRentIncrease3YearAveragePercent ?? null,
      last_rent_increase:                     payload.lastRentIncrease ?? null,
      last_rent_increase_relevance:           payload.lastRentIncreaseRelevance ?? null,
      last_rent_increase_value:               payload.lastRentIncreaseValue ?? null,
      last_rent_increase_percent:             payload.lastRentIncreasePercent ?? null,
    })
    .select()
    .single();
  if (error || !data) return null;
  return toDevelopmentTomorrow(data);
}

export async function updateDevelopmentTomorrow(developmentTomorrowId: number, updates: DevelopmentTomorrowUpdate): Promise<DevelopmentTomorrow | null> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.tenancyId !== undefined)                          dbUpdates.tenancy_id                              = updates.tenancyId;
  if (updates.cityId !== undefined)                             dbUpdates.city_id                                 = updates.cityId;
  if (updates.legalRequirementsId !== undefined)                dbUpdates.legal_requirements_id                   = updates.legalRequirementsId;
  if (updates.rentIndexId !== undefined)                        dbUpdates.rent_index_id                           = updates.rentIndexId;
  if (updates.financingId !== undefined)                        dbUpdates.financing_id                            = updates.financingId;
  if (updates.developmentYear !== undefined)                    dbUpdates.development_year                        = updates.developmentYear;
  if (updates.yearStart !== undefined)                          dbUpdates.year_start                              = updates.yearStart;
  if (updates.dateStart !== undefined)                          dbUpdates.date_start                              = updates.dateStart;
  if (updates.metropolitanArea !== undefined)                   dbUpdates.metropolitan_area                       = updates.metropolitanArea;
  if (updates.coldRentIncrease !== undefined)                   dbUpdates.cold_rent_increase                      = updates.coldRentIncrease;
  if (updates.coldRentIncreaseEligible !== undefined)           dbUpdates.cold_rent_increase_eligible             = updates.coldRentIncreaseEligible;
  if (updates.coldRentIncreaseLockPeriod !== undefined)         dbUpdates.cold_rent_increase_lock_period          = updates.coldRentIncreaseLockPeriod;
  if (updates.coldRentIncreaseReminder !== undefined)           dbUpdates.cold_rent_increase_reminder             = updates.coldRentIncreaseReminder;
  if (updates.coldRentIncreasePercent !== undefined)            dbUpdates.cold_rent_increase_percent              = updates.coldRentIncreasePercent;
  if (updates.coldRentIncrease3YearAveragePercent !== undefined) dbUpdates.cold_rent_increase_3year_average_percent = updates.coldRentIncrease3YearAveragePercent;
  if (updates.lastRentIncrease !== undefined)                   dbUpdates.last_rent_increase                      = updates.lastRentIncrease;
  if (updates.lastRentIncreaseRelevance !== undefined)          dbUpdates.last_rent_increase_relevance            = updates.lastRentIncreaseRelevance;
  if (updates.lastRentIncreaseValue !== undefined)              dbUpdates.last_rent_increase_value                = updates.lastRentIncreaseValue;
  if (updates.lastRentIncreasePercent !== undefined)            dbUpdates.last_rent_increase_percent              = updates.lastRentIncreasePercent;
  const { data, error } = await supabase.from('development_tomorrow').update(dbUpdates).eq('development_tomorrow_id', developmentTomorrowId).select().single();
  if (error || !data) return null;
  return toDevelopmentTomorrow(data);
}

export async function deleteDevelopmentTomorrow(developmentTomorrowId: number): Promise<boolean> {
  const { error } = await supabase.from('development_tomorrow').delete().eq('development_tomorrow_id', developmentTomorrowId);
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
  const { error } = await supabase.from('development_tomorrow_metrics').delete().eq('metrics_id', metricsId);
  return !error;
}

// ─── Renovation ───────────────────────────────────────────────────────────────

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
  const { data, error } = await supabase.from('renovation').select('*').eq('renovation_id', renovationId).single();
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
  const { data, error } = await supabase.from('renovation').update(dbUpdates).eq('renovation_id', renovationId).select().single();
  if (error || !data) return null;
  return toRenovation(data);
}

export async function deleteRenovation(renovationId: number): Promise<boolean> {
  const { error } = await supabase.from('renovation').delete().eq('renovation_id', renovationId);
  return !error;
}

// ─── LegalRequirements ────────────────────────────────────────────────────────

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
  const { data, error } = await supabase.from('legal_requirements').select('*').eq('legal_requirements_id', legalRequirementsId).single();
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

export async function updateLegalRequirements(legalRequirementsId: number, updates: LegalRequirementsUpdate): Promise<LegalRequirements | null> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.rentCapLimit !== undefined)           dbUpdates.rent_cap_limit           = updates.rentCapLimit;
  if (updates.sqmIncreaseLow !== undefined)         dbUpdates.sqm_increase_low         = updates.sqmIncreaseLow;
  if (updates.sqmIncreaseHigh !== undefined)        dbUpdates.sqm_increase_high        = updates.sqmIncreaseHigh;
  if (updates.renovationLimitPercent !== undefined) dbUpdates.renovation_limit_percent = updates.renovationLimitPercent;
  if (updates.validFrom !== undefined)              dbUpdates.valid_from               = updates.validFrom;
  if (updates.validUntil !== undefined)             dbUpdates.valid_until              = updates.validUntil;
  const { data, error } = await supabase.from('legal_requirements').update(dbUpdates).eq('legal_requirements_id', legalRequirementsId).select().single();
  if (error || !data) return null;
  return toLegalRequirements(data);
}

// ─── SystemConfig ─────────────────────────────────────────────────────────────

export async function getAllSystemConfig(): Promise<SystemConfig[]> {
  const { data, error } = await supabase.from('system_config').select('*').order('config_key');
  if (error || !data) return [];
  return data.map(toSystemConfig);
}

export async function getSystemConfigByKey(configKey: string): Promise<SystemConfig | null> {
  const { data, error } = await supabase.from('system_config').select('*').eq('config_key', configKey).single();
  if (error || !data) return null;
  return toSystemConfig(data);
}

// Admin / service role only
export async function updateSystemConfig(configId: number, updates: SystemConfigUpdate): Promise<SystemConfig | null> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.configValue !== undefined) dbUpdates.config_value = updates.configValue;
  if (updates.description !== undefined) dbUpdates.description  = updates.description;
  const { data, error } = await supabase.from('system_config').update(dbUpdates).eq('config_id', configId).select().single();
  if (error || !data) return null;
  return toSystemConfig(data);
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function getNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map(toNotification);
}

export async function getUnreadNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .is('read_at', null)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map(toNotification);
}

export async function createNotification(payload: NotificationInsert): Promise<Notification | null> {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id:          payload.userId,
      property_id:      payload.propertyId ?? null,
      type:             payload.type,
      message:          payload.message,
      tradesperson:     payload.tradesperson ?? null,
      financial_broker: payload.financialBroker ?? null,
    })
    .select()
    .single();
  if (error || !data) return null;
  return toNotification(data);
}

export async function markNotificationRead(notificationId: number): Promise<Notification | null> {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('notification_id', notificationId)
    .select()
    .single();
  if (error || !data) return null;
  return toNotification(data);
}

export async function markAllNotificationsRead(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null);
  return !error;
}

export async function deleteNotification(notificationId: number): Promise<boolean> {
  const { error } = await supabase.from('notifications').delete().eq('notification_id', notificationId);
  return !error;
}
