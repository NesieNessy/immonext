// ==============================================================================
// ImmoNext – Supabase Client: metrics_today (view — read-only)
// ==============================================================================
import { supabase } from '@/lib/supabase/client.supabase';
import type { MetricsToday } from '@immonext/types';

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

export async function getMetricsTodayForUser(userId: string): Promise<MetricsToday[]> {
  const { data, error } = await supabase
    .from('metrics_today')
    .select('*')
    .eq('user_id', userId);
  if (error || !data) return [];
  return data.map(toMetricsToday);
}

export async function getMetricsTodayForProperty(propertyId: number): Promise<MetricsToday | null> {
  const { data, error } = await supabase
    .from('metrics_today')
    .select('*')
    .eq('property_id', propertyId)
    .single();
  if (error || !data) return null;
  return toMetricsToday(data);
}
