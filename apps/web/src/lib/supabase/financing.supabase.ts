// ==============================================================================
// ImmoNext – Supabase Client: financing
// ==============================================================================
import { supabase } from '@/lib/supabase/client.supabase';
import type {
  Financing,
  FinancingCalculation, FinancingCalculationInsert,
  FinancingInsert, FinancingUpdate,
  InterestCalculation, InterestCalculationInsert, InterestCalculationUpdate,
} from '@immonext/types';

// ─── Mappers ──────────────────────────────────────────────────────────────────

function toFinancing(row: Record<string, unknown>): Financing {
  return {
    financingId:                  row.financing_id as number,
    propertyId:                   row.property_id as number,
    numberOfLoans:                row.number_of_loans as number,
    weightedLoanAmount:           row.weighted_loan_amount as number | null,
    weightedEquity:               row.weighted_equity as number | null,
    weightedInterestRate:         row.weighted_interest_rate as number | null,
    weightedRepaymentRate:        row.weighted_repayment_rate as number | null,
    weightedMonthlyDebtService:   row.weighted_monthly_debt_service as number | null,
    singleLoanAmount:             row.single_loan_amount as number | null,
    singleEquity:                 row.single_equity as number | null,
    singleInterestRate:           row.single_interest_rate as number | null,
    singleRepaymentRate:          row.single_repayment_rate as number | null,
    singleMonthlyDebtService:     row.single_monthly_debt_service as number | null,
    singleRepaymentStartDate:     row.single_repayment_start_date as string | null,
    fixedInterestPeriod:          row.fixed_interest_period as number | null,
    interestRate:                 row.interest_rate as number | null,
    regularInterestRate:          row.regular_interest_rate as number | null,
    createdAt:                    row.created_at as string,
    updatedAt:                    row.updated_at as string,
  };
}

function toFinancingCalculation(row: Record<string, unknown>): FinancingCalculation {
  return {
    financingCalculationId:     row.financing_calculation_id as number,
    financingId:                row.financing_id as number,
    month:                      row.month as number,
    monthlyDebtService:         row.monthly_debt_service as number | null,
    singleMonthlyDebtService:   row.single_monthly_debt_service as number | null,
    interestPortion:            row.interest_portion as number | null,
    repaymentPortion:           row.repayment_portion as number | null,
    remainingDebt:              row.remaining_debt as number | null,
    repaymentYear:              row.repayment_year as number | null,
    repaymentMonth:             row.repayment_month as number | null,
    createdAt:                  row.created_at as string,
  };
}

function toInterestCalculation(row: Record<string, unknown>): InterestCalculation {
  return {
    interestCalculationId:        row.interest_calculation_id as number,
    financingId:                  row.financing_id as number,
    modificationVariable:         row.modification_variable as number | null,
    fixedInterestPeriod:          row.fixed_interest_period as number | null,
    fixedInterestPeriodPercent:   row.fixed_interest_period_percent as number | null,
    estimatedInterestRate:        row.estimated_interest_rate as number | null,
    loanToValueEquityShare:       row.loan_to_value_equity_share as number | null,
    equityThresholds:             row.equity_thresholds as number | null,
    equityThresholdsCorridor:     row.equity_thresholds_corridor as number | null,
    equityThresholdsPercent:      row.equity_thresholds_percent as number | null,
    createdAt:                    row.created_at as string,
    updatedAt:                    row.updated_at as string,
  };
}

// ─── Financing ────────────────────────────────────────────────────────────────

export async function getFinancings(propertyId: number): Promise<Financing[]> {
  const { data, error } = await supabase.from('financing').select('*').eq('property_id', propertyId);
  if (error || !data) return [];
  return data.map(toFinancing);
}

export async function getFinancingById(financingId: number): Promise<Financing | null> {
  const { data, error } = await supabase.from('financing').select('*').eq('financing_id', financingId).single();
  if (error || !data) return null;
  return toFinancing(data);
}

export async function createFinancing(payload: FinancingInsert): Promise<Financing | null> {
  const { data, error } = await supabase
    .from('financing')
    .insert({
      property_id:                    payload.propertyId,
      number_of_loans:                payload.numberOfLoans,
      weighted_loan_amount:           payload.weightedLoanAmount ?? null,
      weighted_equity:                payload.weightedEquity ?? null,
      weighted_interest_rate:         payload.weightedInterestRate ?? null,
      weighted_repayment_rate:        payload.weightedRepaymentRate ?? null,
      weighted_monthly_debt_service:  payload.weightedMonthlyDebtService ?? null,
      single_loan_amount:             payload.singleLoanAmount ?? null,
      single_equity:                  payload.singleEquity ?? null,
      single_interest_rate:           payload.singleInterestRate ?? null,
      single_repayment_rate:          payload.singleRepaymentRate ?? null,
      single_monthly_debt_service:    payload.singleMonthlyDebtService ?? null,
      single_repayment_start_date:    payload.singleRepaymentStartDate ?? null,
      fixed_interest_period:          payload.fixedInterestPeriod ?? null,
      interest_rate:                  payload.interestRate ?? null,
      regular_interest_rate:          payload.regularInterestRate ?? null,
    })
    .select()
    .single();
  if (error || !data) return null;
  return toFinancing(data);
}

export async function updateFinancing(financingId: number, updates: FinancingUpdate): Promise<Financing | null> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.numberOfLoans !== undefined)              dbUpdates.number_of_loans               = updates.numberOfLoans;
  if (updates.weightedLoanAmount !== undefined)         dbUpdates.weighted_loan_amount          = updates.weightedLoanAmount;
  if (updates.weightedEquity !== undefined)             dbUpdates.weighted_equity               = updates.weightedEquity;
  if (updates.weightedInterestRate !== undefined)       dbUpdates.weighted_interest_rate        = updates.weightedInterestRate;
  if (updates.weightedRepaymentRate !== undefined)      dbUpdates.weighted_repayment_rate       = updates.weightedRepaymentRate;
  if (updates.weightedMonthlyDebtService !== undefined) dbUpdates.weighted_monthly_debt_service = updates.weightedMonthlyDebtService;
  if (updates.singleLoanAmount !== undefined)           dbUpdates.single_loan_amount            = updates.singleLoanAmount;
  if (updates.singleEquity !== undefined)               dbUpdates.single_equity                 = updates.singleEquity;
  if (updates.singleInterestRate !== undefined)         dbUpdates.single_interest_rate          = updates.singleInterestRate;
  if (updates.singleRepaymentRate !== undefined)        dbUpdates.single_repayment_rate         = updates.singleRepaymentRate;
  if (updates.singleMonthlyDebtService !== undefined)   dbUpdates.single_monthly_debt_service   = updates.singleMonthlyDebtService;
  if (updates.singleRepaymentStartDate !== undefined)   dbUpdates.single_repayment_start_date   = updates.singleRepaymentStartDate;
  if (updates.fixedInterestPeriod !== undefined)        dbUpdates.fixed_interest_period         = updates.fixedInterestPeriod;
  if (updates.interestRate !== undefined)               dbUpdates.interest_rate                 = updates.interestRate;
  if (updates.regularInterestRate !== undefined)        dbUpdates.regular_interest_rate         = updates.regularInterestRate;
  const { data, error } = await supabase.from('financing').update(dbUpdates).eq('financing_id', financingId).select().single();
  if (error || !data) return null;
  return toFinancing(data);
}

export async function deleteFinancing(financingId: number): Promise<boolean> {
  const { error } = await supabase.from('financing').delete().eq('financing_id', financingId);
  return !error;
}

// ─── FinancingCalculation ─────────────────────────────────────────────────────

export async function getFinancingCalculations(financingId: number): Promise<FinancingCalculation[]> {
  const { data, error } = await supabase
    .from('financing_calculation')
    .select('*')
    .eq('financing_id', financingId)
    .order('month', { ascending: true });
  if (error || !data) return [];
  return data.map(toFinancingCalculation);
}

export async function bulkInsertFinancingCalculations(rows: FinancingCalculationInsert[]): Promise<boolean> {
  const { error } = await supabase
    .from('financing_calculation')
    .insert(rows.map(r => ({
      financing_id:               r.financingId,
      month:                      r.month,
      monthly_debt_service:       r.monthlyDebtService ?? null,
      single_monthly_debt_service:r.singleMonthlyDebtService ?? null,
      interest_portion:           r.interestPortion ?? null,
      repayment_portion:          r.repaymentPortion ?? null,
      remaining_debt:             r.remainingDebt ?? null,
      repayment_year:             r.repaymentYear ?? null,
      repayment_month:            r.repaymentMonth ?? null,
    })));
  return !error;
}

export async function deleteFinancingCalculations(financingId: number): Promise<boolean> {
  const { error } = await supabase.from('financing_calculation').delete().eq('financing_id', financingId);
  return !error;
}

// ─── InterestCalculation ──────────────────────────────────────────────────────

export async function getInterestCalculations(financingId: number): Promise<InterestCalculation[]> {
  const { data, error } = await supabase
    .from('interest_calculation')
    .select('*')
    .eq('financing_id', financingId);
  if (error || !data) return [];
  return data.map(toInterestCalculation);
}

export async function createInterestCalculation(payload: InterestCalculationInsert): Promise<InterestCalculation | null> {
  const { data, error } = await supabase
    .from('interest_calculation')
    .insert({
      financing_id:               payload.financingId,
      modification_variable:      payload.modificationVariable ?? null,
      fixed_interest_period:      payload.fixedInterestPeriod ?? null,
      fixed_interest_period_percent: payload.fixedInterestPeriodPercent ?? null,
      estimated_interest_rate:    payload.estimatedInterestRate ?? null,
      loan_to_value_equity_share: payload.loanToValueEquityShare ?? null,
      equity_thresholds:          payload.equityThresholds ?? null,
      equity_thresholds_corridor: payload.equityThresholdsCorridor ?? null,
      equity_thresholds_percent:  payload.equityThresholdsPercent ?? null,
    })
    .select()
    .single();
  if (error || !data) return null;
  return toInterestCalculation(data);
}

export async function updateInterestCalculation(interestCalculationId: number, updates: InterestCalculationUpdate): Promise<InterestCalculation | null> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.modificationVariable !== undefined)       dbUpdates.modification_variable         = updates.modificationVariable;
  if (updates.fixedInterestPeriod !== undefined)        dbUpdates.fixed_interest_period         = updates.fixedInterestPeriod;
  if (updates.fixedInterestPeriodPercent !== undefined) dbUpdates.fixed_interest_period_percent = updates.fixedInterestPeriodPercent;
  if (updates.estimatedInterestRate !== undefined)      dbUpdates.estimated_interest_rate       = updates.estimatedInterestRate;
  if (updates.loanToValueEquityShare !== undefined)     dbUpdates.loan_to_value_equity_share    = updates.loanToValueEquityShare;
  if (updates.equityThresholds !== undefined)           dbUpdates.equity_thresholds             = updates.equityThresholds;
  if (updates.equityThresholdsCorridor !== undefined)   dbUpdates.equity_thresholds_corridor    = updates.equityThresholdsCorridor;
  if (updates.equityThresholdsPercent !== undefined)    dbUpdates.equity_thresholds_percent     = updates.equityThresholdsPercent;
  const { data, error } = await supabase.from('interest_calculation').update(dbUpdates).eq('interest_calculation_id', interestCalculationId).select().single();
  if (error || !data) return null;
  return toInterestCalculation(data);
}

export async function deleteInterestCalculation(interestCalculationId: number): Promise<boolean> {
  const { error } = await supabase.from('interest_calculation').delete().eq('interest_calculation_id', interestCalculationId);
  return !error;
}
