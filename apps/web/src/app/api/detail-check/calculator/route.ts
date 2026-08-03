import {
  normalizeYyyymm,
  runRentCalculator,
  type CalculatorMode,
  type CalculatorParams,
  type PlacementMode,
} from '@/lib/detailCheck/rentCalculator';
import { type RenovationCase } from '@/lib/detailCheck/renovation';
import { computeIndividualAdditionalCosts, computeFinancing, type InterestPeriodYears } from '@/lib/detailCheck/financing';
import { estimateRentIndexPerM2 } from '@/lib/detailCheck/rentIndex';
import { roundCurrency } from '@/lib/detailCheck/acquisitionCosts';
import { requireUserId, workflowIdFor } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toMode(value: unknown): CalculatorMode {
  return value === 'POTENTIAL' ? 'POTENTIAL' : 'KNOWN';
}

function toPlacementMode(value: unknown): PlacementMode {
  return value === 'OPTIMIZED' ? 'OPTIMIZED' : 'DEFAULT';
}

function toInterestYears(value: unknown): InterestPeriodYears {
  const parsed = Number(value);
  return parsed === 15 || parsed === 20 ? parsed : 10;
}

function safeCases(value: unknown): RenovationCase[] {
  return Array.isArray(value) ? value as RenovationCase[] : [];
}

function normalizeTaxRate(value: unknown, fallback = 0.42): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const clamped = Math.max(0, parsed);
  if (clamped > 0.42) return 0.45;
  return Math.min(0.42, clamped);
}

async function loadContext(userId: string, workflowId: string, quickCheckId: string | null) {
  const contextRows = await db.query(
    `
      SELECT
        (
          SELECT row_to_json(item)
          FROM (
            SELECT quick_check_id, purchase_price, city, postal_code, cold_rent, year_of_construction
            FROM quick_check
            WHERE user_id = $1 AND quick_check_id = $3
            LIMIT 1
          ) item
        ) AS quick_check,
        (
          SELECT row_to_json(item)
          FROM (
            SELECT city, postal_code, living_area_m2, year_of_construction
            FROM detail_check_property_data
            WHERE user_id = $1 AND workflow_id = $2
            LIMIT 1
          ) item
        ) AS property,
        (
          SELECT row_to_json(item)
          FROM (
            SELECT valuation_date, cold_rent, service_charges_allocable, service_charges_non_allocable
            FROM detail_check_rental
            WHERE user_id = $1 AND workflow_id = $2
            LIMIT 1
          ) item
        ) AS rental,
        (
          SELECT row_to_json(item)
          FROM (
            SELECT *
            FROM detail_check_financing
            WHERE user_id = $1 AND workflow_id = $2
            LIMIT 1
          ) item
        ) AS financing,
        (
          SELECT row_to_json(item)
          FROM (
            SELECT cases, financed_amount
            FROM detail_check_renovation
            WHERE user_id = $1 AND workflow_id = $2
            LIMIT 1
          ) item
        ) AS renovation,
        (
          SELECT row_to_json(item)
          FROM (
            SELECT purchase_price, parking_purchase_price, total_additional_costs,
                   broker_percent, notary_percent, land_registry_percent,
                   property_transfer_tax_percent
            FROM detail_check_acquisition_costs
            WHERE user_id = $1 AND workflow_id = $2
            LIMIT 1
          ) item
        ) AS acquisition,
        (
          SELECT row_to_json(item)
          FROM (
            SELECT building_value, afa_percent
            FROM detail_check_depreciation
            WHERE user_id = $1 AND workflow_id = $2
            LIMIT 1
          ) item
        ) AS depreciation
    `,
    [userId, workflowId, quickCheckId ? Number(quickCheckId) : null],
  );

  const context = contextRows.rows[0] ?? {};
  const quickCheck = context.quick_check;
  const property = context.property;
  const rental = context.rental;
  const financing = context.financing;
  const renovation = context.renovation;
  const acquisition = context.acquisition;
  const depreciation = context.depreciation;
  const purchasePrice = toNumber(acquisition?.purchase_price ?? quickCheck?.purchase_price ?? 0);
  const parkingPrice = toNumber(acquisition?.parking_purchase_price ?? 0);
  const additionalCosts = toNumber(acquisition?.total_additional_costs ?? 0);
  const renovationCases = safeCases(renovation?.cases);
  const renovationFinancedAmount = toNumber(renovation?.financed_amount ?? 0);
  const selectedVariant = financing?.selected_variant === 'INDIVIDUAL' ? 'INDIVIDUAL' : 'OFFER';
  const individualPurchasePrice = toNumber(financing?.individual_purchase_price ?? purchasePrice);
  const individualParkingPrice = toNumber(financing?.individual_parking_price ?? parkingPrice);
  const individualAdditionalCosts = computeIndividualAdditionalCosts({
    purchasePrice: individualPurchasePrice,
    parkingPrice: individualParkingPrice,
    brokerPercent: toNumber(acquisition?.broker_percent ?? 3.57),
    notaryPercent: toNumber(acquisition?.notary_percent ?? 1.5),
    landRegistryPercent: toNumber(acquisition?.land_registry_percent ?? 0.5),
    propertyTransferTaxPercent: acquisition?.property_transfer_tax_percent == null
      ? null
      : toNumber(acquisition.property_transfer_tax_percent),
  });
  const offerFinancing = computeFinancing({
    purchasePrice,
    parkingPrice,
    additionalCosts,
    renovationCosts: toNumber(financing?.offer_renovation_costs ?? renovationFinancedAmount),
    equity: toNumber(financing?.offer_equity ?? 0),
    interestPeriodYears: toInterestYears(financing?.offer_interest_period_years),
    repaymentRate: toNumber(financing?.repayment_rate ?? 2) || 2,
    interestAdjustmentFactor: toNumber(financing?.interest_adjustment_factor ?? 1) || 1,
  });
  const individualFinancing = computeFinancing({
    purchasePrice: individualPurchasePrice,
    parkingPrice: individualParkingPrice,
    additionalCosts: individualAdditionalCosts,
    renovationCosts: toNumber(financing?.individual_renovation_costs ?? renovationFinancedAmount),
    equity: toNumber(financing?.individual_equity ?? 0),
    interestPeriodYears: toInterestYears(financing?.individual_interest_period_years),
    repaymentRate: toNumber(financing?.repayment_rate ?? 2) || 2,
    interestAdjustmentFactor: toNumber(financing?.interest_adjustment_factor ?? 1) || 1,
  });
  const selectedFinancing = selectedVariant === 'INDIVIDUAL' ? individualFinancing : offerFinancing;
  const selectedEquity = selectedVariant === 'INDIVIDUAL'
    ? toNumber(financing?.individual_equity ?? 0)
    : toNumber(financing?.offer_equity ?? 0);
  const buildingValue = toNumber(depreciation?.building_value ?? 0);
  const afaPercent = toNumber(depreciation?.afa_percent ?? 0);
  const propertyYear = toNumber(property?.year_of_construction ?? quickCheck?.year_of_construction ?? new Date().getFullYear());
  const livingAreaM2 = toNumber(property?.living_area_m2 ?? 0);
  const serviceChargesAllocable = toNumber(rental?.service_charges_allocable ?? 0);
  const serviceChargesNonAllocable = toNumber(rental?.service_charges_non_allocable ?? 0);
  return {
    quickCheck,
    city: property?.city ?? quickCheck?.city ?? '',
    postalCode: property?.postal_code ?? quickCheck?.postal_code ?? '',
    livingAreaM2,
    yearOfConstruction: propertyYear,
    valuationDate: rental?.valuation_date ?? null,
    coldRent: toNumber(rental?.cold_rent ?? quickCheck?.cold_rent ?? 0),
    serviceChargesAllocable,
    serviceChargesNonAllocable,
    selectedVariant,
    monthlyDebtService: toNumber(financing?.[selectedVariant === 'INDIVIDUAL' ? 'individual_monthly_debt_service' : 'offer_monthly_debt_service']) || selectedFinancing.monthlyDebtService,
    loanAmount: selectedFinancing.loanAmount,
    interestRate: toNumber(financing?.[selectedVariant === 'INDIVIDUAL' ? 'individual_interest_rate' : 'offer_interest_rate']) || selectedFinancing.interestRate,
    individualLoanAmount: individualFinancing.loanAmount,
    repaymentRate: toNumber(financing?.repayment_rate ?? 2) || 2,
    interestPeriodYears: toInterestYears(financing?.[selectedVariant === 'INDIVIDUAL' ? 'individual_interest_period_years' : 'offer_interest_period_years']),
    equityAmount: selectedEquity,
    monthlyAfa: buildingValue > 0 && afaPercent > 0 ? roundCurrency((buildingValue * (afaPercent / 100)) / 12) : 0,
    purchasePrice,
    totalInvestment: roundCurrency(selectedFinancing.totalCosts),
    renovationCases,
  };
}

function buildParams(saved: Record<string, unknown> | undefined, context: Awaited<ReturnType<typeof loadContext>>): CalculatorParams {
  const fallbackStart = new Date().toISOString().slice(0, 7);
  const livingAreaM2 = context.livingAreaM2;
  const rentStart = toNumber(saved?.monthly_rent_start ?? context.coldRent);
  const fallbackRentIndex = estimateRentIndexPerM2(context.yearOfConstruction, livingAreaM2)
    ?? (livingAreaM2 > 0 && rentStart > 0 ? (rentStart / livingAreaM2) * 1.02 : null);
  const savedResult = (saved?.result as Record<string, unknown> | undefined) ?? {};
  const savedParams = (savedResult.params as Record<string, unknown> | undefined) ?? {};
  const savedModernizationPlan = Array.isArray(savedResult.modernizationPlan)
    ? savedResult.modernizationPlan as Array<Record<string, unknown>>
    : [];
  const savedPlanPlacements = Object.fromEntries(
    savedModernizationPlan.flatMap((item) => (
      typeof item.id === 'string' && typeof item.effectiveYyyymm === 'string'
        ? [[item.id, item.effectiveYyyymm]]
        : []
    )),
  );
  const savedFinancingInterestRate = savedParams.financingInterestRateOverride == null
    ? context.interestRate
    : Math.max(0, Math.min(25, toNumber(savedParams.financingInterestRateOverride)));
  const savedRefinancingInterestRate = savedParams.interestRateOverride == null
    ? context.interestRate
    : Math.max(0, Math.min(25, toNumber(savedParams.interestRateOverride)));
  const monthlyDebtService = savedParams.financingInterestRateOverride == null
    ? context.monthlyDebtService
    : roundCurrency(context.loanAmount * ((savedFinancingInterestRate + context.repaymentRate) / 100) / 12);

  return {
    startYyyymm: normalizeYyyymm(saved?.start_yyyymm as string | undefined, fallbackStart),
    rentStartYyyymm: normalizeYyyymm(context.valuationDate, fallbackStart),
    monthlyRentStart: rentStart,
    livingAreaM2,
    yearOfConstruction: context.yearOfConstruction,
    city: context.city,
    postalCode: context.postalCode,
    last558Date: saved?.last_558_date ? normalizeYyyymm(saved.last_558_date as string) : null,
    last559Date: saved?.last_559_date ? normalizeYyyymm(saved.last_559_date as string) : null,
    rentIndexPerM2: saved?.rent_index_per_m2 == null ? fallbackRentIndex : toNumber(saved.rent_index_per_m2),
    rentIndexSource: saved?.rent_index_per_m2 == null ? 'AUTOMATIC' : 'MANUAL',
    monthlyDebtService,
    loanAmount: context.loanAmount,
    interestRate: savedFinancingInterestRate,
    repaymentRate: context.repaymentRate,
    monthlyAfa: context.monthlyAfa,
    serviceChargesAllocable: context.serviceChargesAllocable,
    serviceChargesNonAllocable: context.serviceChargesNonAllocable,
    purchasePrice: context.purchasePrice,
    totalInvestment: context.totalInvestment,
    taxRate: normalizeTaxRate(savedParams.taxRate),
    taxableLossesOffsettable: savedParams.taxableLossesOffsettable === true,
    equityAmount: context.equityAmount,
    equityIncluded: savedParams.equityIncluded === true,
    financingInterestRateOverride: savedParams.financingInterestRateOverride == null ? null : savedFinancingInterestRate,
    interestRateOverride: savedParams.interestRateOverride == null ? null : savedRefinancingInterestRate,
    interestPeriodYears: context.interestPeriodYears,
    refinancingInterestRate: savedParams.refinancingInterestRate == null ? savedRefinancingInterestRate : toNumber(savedParams.refinancingInterestRate),
    modernizationPlacements: (savedResult.modernizationPlacements as Record<string, string> | undefined)
      ?? (Object.keys(savedPlanPlacements).length > 0 ? savedPlanPlacements : undefined),
    modernizationCostOverrides: (savedResult.modernizationCostOverrides as Record<string, number> | undefined) ?? undefined,
    renovationTimingOverrides: (savedResult.renovationTimingOverrides as CalculatorParams['renovationTimingOverrides']) ?? undefined,
    rentIncreaseOverrides: (savedResult.rentIncreaseOverrides as Record<string, { effectiveYyyymm?: string; monthlyDelta?: number }> | undefined) ?? undefined,
    mode: toMode(saved?.mode),
    placementMode: toPlacementMode(savedResult.placementMode),
  };
}

export async function GET(request: Request) {
  const userId = await requireUserId(request);
  const url = new URL(request.url);
  const quickCheckId = url.searchParams.get('quickCheckId');
  const workflowId = workflowIdFor(userId, quickCheckId, url.searchParams.get('workflowId'));
  const context = await loadContext(userId, workflowId, quickCheckId);
  const savedRows = await db.query(
    'SELECT * FROM detail_check_rent_calculator WHERE user_id = $1 AND workflow_id = $2 LIMIT 1',
    [userId, workflowId],
  );
  const params = buildParams(savedRows.rows[0], context);
  const result = runRentCalculator(params, context.renovationCases);

  return NextResponse.json({
    workflowId,
    quickCheckId: context.quickCheck?.quick_check_id ?? null,
    selectedFinancingVariant: context.selectedVariant,
    renovationCases: context.renovationCases,
    ...result,
  });
}

export async function POST(request: Request) {
  const userId = await requireUserId(request);
  const input = await request.json();
  const quickCheckId = input.quickCheckId ? String(input.quickCheckId) : null;
  const workflowId = workflowIdFor(userId, quickCheckId, input.workflowId ? String(input.workflowId) : null);
  const context = await loadContext(userId, workflowId, quickCheckId);
  const savedResult = input.optimize === true ? 'OPTIMIZED' : 'DEFAULT';
  const requestedInterestRate = input.interestRateOverride == null ? null : toNumber(input.interestRateOverride);
  const requestedFinancingInterestRate = input.financingInterestRateOverride == null
    ? null
    : toNumber(input.financingInterestRateOverride);
  const interestRate = requestedFinancingInterestRate == null
    ? context.interestRate
    : Math.max(0, Math.min(25, requestedFinancingInterestRate));
  const refinancingInterestRate = requestedInterestRate == null
    ? context.interestRate
    : Math.max(0, Math.min(25, requestedInterestRate));
  const monthlyDebtService = requestedFinancingInterestRate == null
    ? context.monthlyDebtService
    : roundCurrency(context.loanAmount * ((interestRate + context.repaymentRate) / 100) / 12);
  const params: CalculatorParams = {
    startYyyymm: normalizeYyyymm(input.startYyyymm, new Date().toISOString().slice(0, 7)),
    rentStartYyyymm: normalizeYyyymm(context.valuationDate, new Date().toISOString().slice(0, 7)),
    monthlyRentStart: toNumber(input.monthlyRentStart),
    livingAreaM2: context.livingAreaM2,
    yearOfConstruction: context.yearOfConstruction,
    city: context.city,
    postalCode: context.postalCode,
    last558Date: input.last558Date ? normalizeYyyymm(input.last558Date) : null,
    last559Date: input.last559Date ? normalizeYyyymm(input.last559Date) : null,
    rentIndexPerM2: input.rentIndexSource !== 'MANUAL' || input.rentIndexPerM2 == null || input.rentIndexPerM2 === ''
      ? estimateRentIndexPerM2(context.yearOfConstruction, context.livingAreaM2)
      : toNumber(input.rentIndexPerM2),
    rentIndexSource: input.rentIndexSource === 'MANUAL' && input.rentIndexPerM2 != null && input.rentIndexPerM2 !== ''
      ? 'MANUAL'
      : 'AUTOMATIC',
    monthlyDebtService,
    loanAmount: context.loanAmount,
    interestRate,
    repaymentRate: context.repaymentRate,
    interestPeriodYears: context.interestPeriodYears,
    monthlyAfa: context.monthlyAfa,
    serviceChargesAllocable: context.serviceChargesAllocable,
    serviceChargesNonAllocable: context.serviceChargesNonAllocable,
    purchasePrice: context.purchasePrice,
    totalInvestment: context.totalInvestment,
    taxRate: normalizeTaxRate(input.taxRate),
    taxableLossesOffsettable: input.taxableLossesOffsettable === true,
    equityAmount: context.equityAmount,
    equityIncluded: input.equityIncluded === true,
    financingInterestRateOverride: requestedFinancingInterestRate,
    interestRateOverride: requestedInterestRate,
    refinancingInterestRate,
    modernizationPlacements: input.optimize !== true && input.modernizationPlacements && typeof input.modernizationPlacements === 'object'
      ? input.modernizationPlacements as Record<string, string>
      : undefined,
    modernizationCostOverrides: input.modernizationCostOverrides && typeof input.modernizationCostOverrides === 'object'
      ? input.modernizationCostOverrides as Record<string, number>
      : undefined,
    renovationTimingOverrides: input.renovationTimingOverrides && typeof input.renovationTimingOverrides === 'object'
      ? input.renovationTimingOverrides as CalculatorParams['renovationTimingOverrides']
      : undefined,
    rentIncreaseOverrides: input.rentIncreaseOverrides && typeof input.rentIncreaseOverrides === 'object'
      ? input.rentIncreaseOverrides as Record<string, { effectiveYyyymm?: string; monthlyDelta?: number }>
      : undefined,
    mode: toMode(input.mode),
    placementMode: savedResult,
  };

  const result = runRentCalculator(params, context.renovationCases);

  await db.query(
    `
      INSERT INTO detail_check_rent_calculator (
        user_id, quick_check_id, workflow_id, start_yyyymm, monthly_rent_start,
        rent_index_per_m2, last_558_date, last_559_date, mode, result
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT (user_id, workflow_id) DO UPDATE SET
        quick_check_id = EXCLUDED.quick_check_id,
        start_yyyymm = EXCLUDED.start_yyyymm,
        monthly_rent_start = EXCLUDED.monthly_rent_start,
        rent_index_per_m2 = EXCLUDED.rent_index_per_m2,
        last_558_date = EXCLUDED.last_558_date,
        last_559_date = EXCLUDED.last_559_date,
        mode = EXCLUDED.mode,
        result = EXCLUDED.result,
        updated_at = NOW()
    `,
    [
      userId,
      context.quickCheck?.quick_check_id ?? null,
      workflowId,
      params.startYyyymm,
      params.monthlyRentStart,
      params.rentIndexPerM2,
      params.last558Date,
      params.last559Date,
      params.mode,
      JSON.stringify(result),
    ],
  );

  if (input.apply === true) {
    const appliedCases = context.renovationCases.map((item) => ({
      ...item,
      ...(params.modernizationPlacements?.[item.id]
        ? { calculator_effective_yyyymm: params.modernizationPlacements[item.id] }
        : {}),
      ...(params.modernizationCostOverrides?.[item.id] != null
        ? { cost_selected: params.modernizationCostOverrides[item.id] }
        : {}),
      ...(params.renovationTimingOverrides?.[item.id]
        ? { zeitpunkt: params.renovationTimingOverrides[item.id] }
        : {}),
    }));
    await db.query(
      'UPDATE detail_check_renovation SET cases = $1, updated_at = NOW() WHERE user_id = $2 AND workflow_id = $3',
      [JSON.stringify(appliedCases), userId, workflowId],
    );
    const individualMonthlyDebtService = roundCurrency(
      context.individualLoanAmount * ((params.interestRate + context.repaymentRate) / 100) / 12,
    );
    await db.query(
      `
        UPDATE detail_check_financing
        SET individual_interest_rate = $1,
            individual_monthly_debt_service = $2,
            updated_at = NOW()
        WHERE user_id = $3 AND workflow_id = $4
      `,
      [params.interestRate, individualMonthlyDebtService, userId, workflowId],
    );
    if (context.selectedVariant === 'OFFER') {
      await db.query(
        `
          UPDATE detail_check_financing
          SET offer_interest_rate = $1,
              offer_monthly_debt_service = $2,
              updated_at = NOW()
          WHERE user_id = $3 AND workflow_id = $4
        `,
        [params.interestRate, params.monthlyDebtService, userId, workflowId],
      );
    }
  }

  return NextResponse.json({
    status: 'OK',
    next: 'MAKROLAGE',
    selectedFinancingVariant: context.selectedVariant,
    renovationCases: context.renovationCases,
    ...result,
  });
}
