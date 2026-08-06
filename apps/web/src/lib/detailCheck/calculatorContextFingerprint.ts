/**
 * A content fingerprint of the upstream data the rent calculator depends on.
 *
 * The calculator caches manual overrides — Gantt placements, renovation
 * timings, interest-rate overrides, the §558 plan — against a snapshot of the
 * earlier wizard steps. When that upstream data genuinely changes (a different
 * living area, a re-negotiated loan), those overrides were computed against
 * numbers that no longer hold and get dropped.
 *
 * Deciding *whether* it changed used to be a comparison of `updated_at`
 * timestamps. That was wrong: every detail-check step re-saves unconditionally
 * when the user leaves it, even having changed nothing, so simply visiting
 * another tab and coming back bumped the timestamp and wiped every override.
 * A fingerprint over the actual values answers the real question — did any
 * number the calculator consumes move? — and a no-op re-save leaves it
 * untouched.
 *
 * Kept deliberately narrow: only fields that feed `runRentCalculator` belong
 * here. Adding an unrelated field would resurrect the original bug in a new
 * form, since edits to it would start discarding overrides for no reason.
 */

/** One renovation case, reduced to the fields that affect the calculation. */
export type CalculatorUpstreamCase = {
  id: string;
  cost_selected?: number | null;
  zeitpunkt?: string | null;
  calculator_effective_yyyymm?: string | null;
};

/** Everything the calculator reads from the earlier wizard steps. */
export type CalculatorUpstreamContext = {
  city: string;
  postalCode: string;
  livingAreaM2: number;
  yearOfConstruction: number;
  valuationDate: string | null;
  coldRent: number;
  serviceChargesAllocable: number;
  serviceChargesNonAllocable: number;
  monthlyDebtService: number;
  loanAmount: number;
  interestRate: number;
  repaymentRate: number;
  interestPeriodYears: number;
  equityAmount: number;
  monthlyAfa: number;
  purchasePrice: number;
  totalInvestment: number;
  selectedVariant: string;
  renovationCases: CalculatorUpstreamCase[];
};

/**
 * Rounded before hashing so that a value which merely round-trips through
 * the database differently (float noise on a currency column) does not read
 * as a change and throw away the user's work.
 */
function stableNumber(value: number | null | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : 0;
}

export function calculatorContextFingerprint(context: CalculatorUpstreamContext): string {
  // Cases are sorted by id and reduced to fixed-order tuples: neither the row
  // order the database happens to return nor the key order of the stored JSON
  // is semantic, and treating either as such would make the fingerprint
  // spuriously unstable.
  const cases = [...(context.renovationCases ?? [])]
    .map((item) => [
      String(item.id ?? ''),
      stableNumber(item.cost_selected),
      item.zeitpunkt ?? '',
      item.calculator_effective_yyyymm ?? '',
    ] as const)
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));

  return JSON.stringify([
    context.city ?? '',
    context.postalCode ?? '',
    stableNumber(context.livingAreaM2),
    stableNumber(context.yearOfConstruction),
    context.valuationDate ?? '',
    stableNumber(context.coldRent),
    stableNumber(context.serviceChargesAllocable),
    stableNumber(context.serviceChargesNonAllocable),
    stableNumber(context.monthlyDebtService),
    stableNumber(context.loanAmount),
    stableNumber(context.interestRate),
    stableNumber(context.repaymentRate),
    stableNumber(context.interestPeriodYears),
    stableNumber(context.equityAmount),
    stableNumber(context.monthlyAfa),
    stableNumber(context.purchasePrice),
    stableNumber(context.totalInvestment),
    context.selectedVariant ?? '',
    cases,
  ]);
}
