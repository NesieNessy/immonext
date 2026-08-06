import { describe, expect, it } from 'vitest';
import { calculatorContextFingerprint, type CalculatorUpstreamContext } from './calculatorContextFingerprint';

/**
 * Regression tests for the bug where every manual calculator override
 * (Gantt placements, renovation timings, rate overrides) was silently
 * discarded merely by visiting another wizard step and coming back.
 *
 * The cause was that "has the upstream data changed?" was answered by
 * comparing `updated_at` timestamps. Every detail-check step re-saves
 * unconditionally when it is left — even when the user changed nothing —
 * which bumps `updated_at` and made a no-op visit look like a real change.
 *
 * The fingerprint answers the same question from the *content* the
 * calculator actually consumes, so a save that changed nothing produces an
 * identical fingerprint and resets nothing.
 */

const baseContext: CalculatorUpstreamContext = {
  city: 'München',
  postalCode: '80333',
  livingAreaM2: 120,
  yearOfConstruction: 1980,
  valuationDate: '2026-08',
  coldRent: 2000,
  serviceChargesAllocable: 150,
  serviceChargesNonAllocable: 50,
  monthlyDebtService: 1800,
  loanAmount: 500000,
  interestRate: 3.4,
  repaymentRate: 2,
  interestPeriodYears: 10,
  equityAmount: 100000,
  monthlyAfa: 400,
  purchasePrice: 600000,
  totalInvestment: 650000,
  selectedVariant: 'OFFER',
  renovationCases: [
    { id: 'a', cost_selected: 19406.73, zeitpunkt: 'SOFORT', calculator_effective_yyyymm: null },
    { id: 'b', cost_selected: 12977.17, zeitpunkt: 'FLEXIBEL', calculator_effective_yyyymm: '2028-04' },
  ],
};

describe('calculatorContextFingerprint', () => {
  it('is stable across a re-save that changed nothing — the actual reported bug', () => {
    // Leaving the "Objektdaten" step POSTs unconditionally, bumping
    // `updated_at` without altering a single value. That must not read as a
    // change, or every override the user made is thrown away.
    const afterNoOpResave = { ...baseContext, renovationCases: baseContext.renovationCases.map((item) => ({ ...item })) };
    expect(calculatorContextFingerprint(afterNoOpResave)).toBe(calculatorContextFingerprint(baseContext));
  });

  it('ignores object key order, so a differently-serialized row is not a change', () => {
    const reordered: CalculatorUpstreamContext = {
      ...baseContext,
      renovationCases: [
        { calculator_effective_yyyymm: null, zeitpunkt: 'SOFORT', cost_selected: 19406.73, id: 'a' },
        { zeitpunkt: 'FLEXIBEL', id: 'b', calculator_effective_yyyymm: '2028-04', cost_selected: 12977.17 },
      ],
    };
    expect(calculatorContextFingerprint(reordered)).toBe(calculatorContextFingerprint(baseContext));
  });

  it('ignores renovation case ordering — row order is not semantic', () => {
    const swapped: CalculatorUpstreamContext = {
      ...baseContext,
      renovationCases: [baseContext.renovationCases[1], baseContext.renovationCases[0]],
    };
    expect(calculatorContextFingerprint(swapped)).toBe(calculatorContextFingerprint(baseContext));
  });

  it.each([
    ['livingAreaM2', { livingAreaM2: 125 }],
    ['yearOfConstruction', { yearOfConstruction: 1985 }],
    ['coldRent', { coldRent: 2100 }],
    ['loanAmount', { loanAmount: 510000 }],
    ['interestRate', { interestRate: 3.9 }],
    ['monthlyDebtService', { monthlyDebtService: 1850 }],
    ['monthlyAfa', { monthlyAfa: 410 }],
    ['purchasePrice', { purchasePrice: 610000 }],
    ['totalInvestment', { totalInvestment: 660000 }],
    ['equityAmount', { equityAmount: 90000 }],
    ['repaymentRate', { repaymentRate: 2.5 }],
    ['interestPeriodYears', { interestPeriodYears: 15 }],
    ['serviceChargesAllocable', { serviceChargesAllocable: 160 }],
    ['serviceChargesNonAllocable', { serviceChargesNonAllocable: 60 }],
    ['valuationDate', { valuationDate: '2026-09' }],
    ['selectedVariant', { selectedVariant: 'INDIVIDUAL' }],
    ['city', { city: 'Berlin' }],
    ['postalCode', { postalCode: '10115' }],
  ])('changes when %s actually changes', (_label, patch) => {
    expect(calculatorContextFingerprint({ ...baseContext, ...patch })).not.toBe(calculatorContextFingerprint(baseContext));
  });

  it('changes when a renovation case cost changes', () => {
    const changed: CalculatorUpstreamContext = {
      ...baseContext,
      renovationCases: [{ ...baseContext.renovationCases[0], cost_selected: 20000 }, baseContext.renovationCases[1]],
    };
    expect(calculatorContextFingerprint(changed)).not.toBe(calculatorContextFingerprint(baseContext));
  });

  it('changes when a renovation case is added or removed', () => {
    const removed: CalculatorUpstreamContext = { ...baseContext, renovationCases: [baseContext.renovationCases[0]] };
    expect(calculatorContextFingerprint(removed)).not.toBe(calculatorContextFingerprint(baseContext));
  });

  it('tolerates missing/null optional case fields without throwing', () => {
    const sparse: CalculatorUpstreamContext = {
      ...baseContext,
      renovationCases: [{ id: 'a' }],
    };
    expect(typeof calculatorContextFingerprint(sparse)).toBe('string');
  });
});
