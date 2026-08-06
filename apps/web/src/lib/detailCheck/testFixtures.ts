import type { CalculatorParams } from './rentCalculator';
import type { RenovationCase } from './renovation';

/**
 * Shared fixtures for the detail-check calculation tests.
 *
 * Deliberately a plain module rather than inline literals in each test file:
 * `CalculatorParams` has ~35 required fields, and repeating them per test
 * buries the one value a test is actually about.
 */

/** Neutral baseline: 1.000 € cold rent on 100 m² (10 €/m²), no history, no financing. */
export function calculatorParams(overrides: Partial<CalculatorParams> = {}): CalculatorParams {
  return {
    startYyyymm: '2026-01',
    rentStartYyyymm: '2026-01',
    monthlyRentStart: 1000,
    livingAreaM2: 100,
    yearOfConstruction: 1990,
    // Not in DENSE_MARKET_CITIES, so the 20 % Kappungsgrenze applies.
    city: 'Musterstadt',
    postalCode: '99999',
    last558Date: null,
    last559Date: null,
    last559MonthlyDelta: 0,
    rentIncreaseIntervalMonths: 15,
    rentIncreaseUtilizationPercent: 100,
    // High enough that the ortsübliche Vergleichsmiete never binds, which
    // leaves the Kappungsgrenze as the only ceiling — see rentCalculator's
    // `increases558WithRentIndex`, the variant that uses this value.
    rentIndexPerM2: 60,
    rentIndexSource: 'MANUAL',
    monthlyDebtService: 0,
    loanAmount: 0,
    interestRate: 0,
    repaymentRate: 0,
    monthlyAfa: 0,
    serviceChargesAllocable: 0,
    serviceChargesNonAllocable: 0,
    purchasePrice: 300000,
    totalInvestment: 300000,
    taxRate: 0.42,
    mode: 'KNOWN',
    placementMode: 'DEFAULT',
    ...overrides,
  };
}

/** A selected, priced modernization. `cost` is both the min and max indication. */
export function renovationCase(id: string, cost: number, overrides: Partial<RenovationCase> = {}): RenovationCase {
  return {
    id,
    kategorie: 'ENERGETISCH',
    massnahme: `Maßnahme ${id}`,
    selected: true,
    zeitpunkt: 'FLEXIBEL',
    cost_selected: cost,
    publish_order: false,
    ai: { summary: '', price_min: cost, price_max: cost, confidence: 1, source: 'FALLBACK' },
    ...overrides,
  };
}

/** Month index, for asserting distances between yyyy-mm strings. */
export function monthIndex(yyyymm: string): number {
  return Number(yyyymm.slice(0, 4)) * 12 + Number(yyyymm.slice(5, 7));
}
