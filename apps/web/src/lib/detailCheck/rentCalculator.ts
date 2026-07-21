import { roundCurrency } from './acquisitionCosts';
import { costForCase, type RenovationCase } from './renovation';

export type CalculatorMode = 'KNOWN' | 'POTENTIAL';
export type PlacementMode = 'DEFAULT' | 'OPTIMIZED';
export type RentIndexSource = 'MANUAL' | 'AUTOMATIC';

export const CALCULATION_HORIZON_YEARS = 50;
export const CALCULATION_HORIZON_MONTHS = CALCULATION_HORIZON_YEARS * 12;

export type CalculatorParams = {
  startYyyymm: string;
  monthlyRentStart: number;
  livingAreaM2: number;
  yearOfConstruction: number;
  city: string;
  postalCode: string;
  last558Date: string | null;
  last559Date: string | null;
  rentIndexPerM2: number | null;
  rentIndexSource: RentIndexSource;
  monthlyDebtService: number;
  loanAmount: number;
  interestRate: number;
  repaymentRate: number;
  monthlyAfa: number;
  serviceChargesAllocable: number;
  serviceChargesNonAllocable: number;
  purchasePrice: number;
  totalInvestment: number;
  taxRate: number;
  mode: CalculatorMode;
  placementMode: PlacementMode;
};

export type RentTimelineRow = {
  yyyymm: string;
  rentTotal: number;
  rentTotalWithRentIndex: number;
  delta558: number;
  delta559: number;
  renovationPayment: number;
  debtService: number;
  interest: number;
  afa: number;
  allocableCosts: number;
  nonAllocableCosts: number;
  taxes: number;
  income: number;
  expenses: number;
  monthlyDelta: number;
  afterTaxCashflow: number;
  cumulativeIncome: number;
  cumulativeExpenses: number;
  cumulativeCashflow: number;
};

export type ModernizationPlanRow = {
  id: string;
  title: string;
  source: 'KNOWN' | 'POTENTIAL';
  paymentYyyymm: string;
  effectiveYyyymm: string;
  monthlyDelta: number;
  allocableCosts: number;
};

export type RentIncrease558Row = {
  effectiveYyyymm: string;
  monthlyDelta: number;
};

export const DENSE_MARKET_CITIES = [
  'stuttgart', 'freiburg im breisgau', 'heidelberg', 'münchen', 'muenchen',
  'nürnberg', 'nuernberg', 'augsburg', 'berlin', 'potsdam', 'wildau', 'bremen',
  'hamburg', 'frankfurt am main', 'wiesbaden', 'rostock', 'hannover', 'göttingen',
  'goettingen', 'köln', 'koeln', 'düsseldorf', 'duesseldorf', 'mainz',
  'ludwigshafen', 'dresden', 'leipzig', 'erfurt', 'jena',
];

export function isDenseMarket(city?: string | null): boolean {
  return DENSE_MARKET_CITIES.includes((city ?? '').trim().toLowerCase());
}

export function normalizeYyyymm(value?: string | null, fallback?: string): string {
  if (value && /^\d{4}-\d{2}$/.test(value)) return value;
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value.slice(0, 7);
  return fallback ?? new Date().toISOString().slice(0, 7);
}

export function addMonths(yyyymm: string, months: number): string {
  const [year, month] = yyyymm.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1 + months, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function monthDiff(from: string, to: string): number {
  const [fromYear, fromMonth] = from.split('-').map(Number);
  const [toYear, toMonth] = to.split('-').map(Number);
  return (toYear - fromYear) * 12 + (toMonth - fromMonth);
}

function compareMonth(a: string, b: string): number {
  return monthDiff(b, a);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function capRoomAt(planned: ModernizationPlanRow[], effectiveYyyymm: string, capAbs: number): number {
  const used = planned.reduce((sum, item) => {
    const diff = Math.abs(monthDiff(item.effectiveYyyymm, effectiveYyyymm));
    return diff < 72 ? sum + item.monthlyDelta : sum;
  }, 0);
  return roundCurrency(Math.max(0, capAbs - used));
}

function buildPlanFromPlacements(
  params: CalculatorParams,
  renovationCases: RenovationCase[],
  placements: number[],
  capAbs: number,
  source: 'KNOWN' | 'POTENTIAL' = 'KNOWN',
): ModernizationPlanRow[] {
  const relevant = renovationCases
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.selected && item.ai)
    .sort((a, b) => (placements[a.index] ?? 0) - (placements[b.index] ?? 0) || a.index - b.index);
  const plan: ModernizationPlanRow[] = [];

  for (const { item, index } of relevant) {
    const allocableCosts = costForCase(item);
    const effective = addMonths(params.startYyyymm, placements[index] ?? 3);
    const wantedDelta = roundCurrency((0.08 * allocableCosts) / 12);
    const monthlyDelta = roundCurrency(Math.min(wantedDelta, capRoomAt(plan, effective, capAbs)));
    if (monthlyDelta <= 0) continue;
    plan.push({
      id: item.id,
      title: item.massnahme,
      source,
      paymentYyyymm: addMonths(effective, -2),
      effectiveYyyymm: effective,
      monthlyDelta,
      allocableCosts,
    });
  }

  return plan.sort((a, b) => a.effectiveYyyymm.localeCompare(b.effectiveYyyymm));
}

function defaultPlacements(params: CalculatorParams, renovationCases: RenovationCase[]): number[] {
  let nextFlexible = 6;
  const last559Offset = params.last559Date ? Math.max(0, monthDiff(params.startYyyymm, normalizeYyyymm(params.last559Date))) : -1000;
  const earliestAfter559 = last559Offset > -1000 ? Math.max(3, last559Offset + 72) : 3;

  return renovationCases.map((item) => {
    const offset = item.zeitpunkt === 'SOFORT' ? 3 : nextFlexible;
    nextFlexible += 3;
    return Math.max(earliestAfter559, offset);
  });
}

function placeKnownModernizations(params: CalculatorParams, renovationCases: RenovationCase[], capAbs: number) {
  return buildPlanFromPlacements(params, renovationCases, defaultPlacements(params, renovationCases), capAbs);
}

function placePotentialModernizations(params: CalculatorParams, capAbs: number) {
  const potentialCases: RenovationCase[] = [
    {
      id: 'potential-1',
      kategorie: 'WOHNWERT',
      massnahme: 'Potenzial 1',
      ai: { summary: '', price_min: 0, price_max: 0, confidence: 1, source: 'FALLBACK' },
      selected: true,
      zeitpunkt: 'SOFORT',
      publish_order: false,
    },
    {
      id: 'potential-2',
      kategorie: 'WOHNWERT',
      massnahme: 'Potenzial 2',
      ai: { summary: '', price_min: 0, price_max: 0, confidence: 1, source: 'FALLBACK' },
      selected: true,
      zeitpunkt: 'FLEXIBEL',
      publish_order: false,
    },
  ];
  const firstEffective = 3;
  const secondEffective = 75;
  const plan: ModernizationPlanRow[] = [];
  for (const [index, offset] of [firstEffective, secondEffective].entries()) {
    if (offset >= CALCULATION_HORIZON_MONTHS) continue;
    const room = capRoomAt(plan, addMonths(params.startYyyymm, offset), capAbs);
    if (room <= 0) continue;
    const effectiveYyyymm = addMonths(params.startYyyymm, offset);
    plan.push({
      id: potentialCases[index].id,
      title: potentialCases[index].massnahme,
      source: 'POTENTIAL',
      paymentYyyymm: addMonths(effectiveYyyymm, -2),
      effectiveYyyymm,
      monthlyDelta: room,
      allocableCosts: roundCurrency((room * 12) / 0.08),
    });
  }
  return plan;
}

function plan558(params: CalculatorParams, capPercent: number, targetPerM2: number) {
  const steps: RentIncrease558Row[] = [];
  if (params.monthlyRentStart <= 0 || params.livingAreaM2 <= 0) return steps;

  let lastEffective = params.last558Date
    ? normalizeYyyymm(params.last558Date, addMonths(params.startYyyymm, -1000))
    : addMonths(params.startYyyymm, -1000);
  let current558Base = params.monthlyRentStart;

  for (let offset = 0; offset < CALCULATION_HORIZON_MONTHS; offset += 1) {
    const month = addMonths(params.startYyyymm, offset);
    if (monthDiff(lastEffective, month) < 15) continue;

    const target = roundCurrency(targetPerM2 * Math.pow(1.02, Math.floor(offset / 12)) * params.livingAreaM2);
    const windowStart = addMonths(month, -35);
    const usedInWindow = steps.reduce((sum, step) => {
      if (compareMonth(step.effectiveYyyymm, windowStart) >= 0 && compareMonth(step.effectiveYyyymm, month) <= 0) {
        return sum + step.monthlyDelta;
      }
      return sum;
    }, 0);
    const room = roundCurrency(Math.max(0, params.monthlyRentStart * capPercent - usedInWindow));
    const delta = roundCurrency(clamp(target - current558Base, 0, room));

    if (delta > 0) {
      steps.push({ effectiveYyyymm: month, monthlyDelta: delta });
      current558Base = roundCurrency(current558Base + delta);
      lastEffective = month;
    }
  }

  return steps;
}

function totalRentAt(month: string, startRent: number, increases: RentIncrease558Row[], modernizations: ModernizationPlanRow[]) {
  const active558 = increases
    .filter((item) => compareMonth(item.effectiveYyyymm, month) <= 0)
    .reduce((sum, item) => sum + item.monthlyDelta, 0);
  const active559 = modernizations
    .filter((item) => compareMonth(item.effectiveYyyymm, month) <= 0)
    .reduce((sum, item) => sum + item.monthlyDelta, 0);
  return roundCurrency(startRent + active558 + active559);
}

function buildTimeline(
  params: CalculatorParams,
  increases558: RentIncrease558Row[],
  increases558WithRentIndex: RentIncrease558Row[],
  modernizationPlan: ModernizationPlanRow[],
) {
  let balance = Math.max(0, params.loanAmount);
  let cumulativeIncome = 0;
  let cumulativeExpenses = 0;
  let cumulativeCashflow = 0;
  let breakEven: string | null = null;
  let breakEvenWithRentIndex: string | null = null;

  const timeline: RentTimelineRow[] = Array.from({ length: CALCULATION_HORIZON_MONTHS }, (_, offset) => {
    const yyyymm = addMonths(params.startYyyymm, offset);
    const delta558 = roundCurrency(increases558
      .filter((item) => item.effectiveYyyymm === yyyymm)
      .reduce((sum, item) => sum + item.monthlyDelta, 0));
    const delta559 = roundCurrency(modernizationPlan
      .filter((item) => item.effectiveYyyymm === yyyymm)
      .reduce((sum, item) => sum + item.monthlyDelta, 0));
    const renovationPayment = roundCurrency(modernizationPlan
      .filter((item) => item.paymentYyyymm === yyyymm)
      .reduce((sum, item) => sum + item.allocableCosts, 0));
    const rentTotal = totalRentAt(yyyymm, params.monthlyRentStart, increases558, modernizationPlan);
    const rentTotalWithRentIndex = totalRentAt(yyyymm, params.monthlyRentStart, increases558WithRentIndex, modernizationPlan);
    const annualCostFactor = Math.pow(1.02, Math.floor(offset / 12));
    const allocableCosts = roundCurrency(params.serviceChargesAllocable * annualCostFactor);
    const nonAllocableCosts = roundCurrency(params.serviceChargesNonAllocable * annualCostFactor);
    const debtService = roundCurrency(Math.min(params.monthlyDebtService, balance > 0 ? params.monthlyDebtService : 0));
    const interest = roundCurrency(balance * (params.interestRate / 100) / 12);
    const principal = roundCurrency(Math.min(balance, Math.max(0, debtService - interest)));
    balance = roundCurrency(Math.max(0, balance - principal));
    const afa = roundCurrency(params.monthlyAfa);
    const taxes = roundCurrency((rentTotal - nonAllocableCosts - afa - interest) * params.taxRate);
    const income = rentTotal;
    const expenses = roundCurrency(debtService + nonAllocableCosts + renovationPayment);
    const monthlyDelta = roundCurrency(income - expenses);
    const afterTaxCashflow = roundCurrency(monthlyDelta - taxes);
    cumulativeIncome = roundCurrency(cumulativeIncome + income);
    cumulativeExpenses = roundCurrency(cumulativeExpenses + expenses);
    cumulativeCashflow = roundCurrency(cumulativeCashflow + monthlyDelta);
    if (!breakEven && cumulativeCashflow >= 0) breakEven = yyyymm;

    return {
      yyyymm,
      rentTotal,
      rentTotalWithRentIndex,
      delta558,
      delta559,
      renovationPayment,
      debtService,
      interest,
      afa,
      allocableCosts,
      nonAllocableCosts,
      taxes,
      income,
      expenses,
      monthlyDelta,
      afterTaxCashflow,
      cumulativeIncome,
      cumulativeExpenses,
      cumulativeCashflow,
    };
  });

  let runningWithRentIndex = 0;
  timeline.forEach((row) => {
    runningWithRentIndex = roundCurrency(runningWithRentIndex + row.rentTotalWithRentIndex - row.expenses);
    if (!breakEvenWithRentIndex && runningWithRentIndex >= 0) breakEvenWithRentIndex = row.yyyymm;
  });

  return { timeline, breakEven, breakEvenWithRentIndex };
}

function placementScore(params: CalculatorParams, plan: ModernizationPlanRow[], increases558: RentIncrease558Row[], increases558WithRentIndex: RentIncrease558Row[]) {
  const result = buildTimeline(params, increases558, increases558WithRentIndex, plan);
  const breakEvenOffset = result.breakEven ? monthDiff(params.startYyyymm, result.breakEven) : 9999;
  const last = result.timeline[result.timeline.length - 1];
  return { ...result, breakEvenOffset, endingCashflow: last?.cumulativeCashflow ?? -Infinity };
}

function optimizeKnownModernizations(
  params: CalculatorParams,
  renovationCases: RenovationCase[],
  capAbs: number,
  increases558: RentIncrease558Row[],
  increases558WithRentIndex: RentIncrease558Row[],
) {
  const relevant = renovationCases.filter((item) => item.selected && item.ai);
  if (relevant.length === 0) return [];

  type Candidate = { placements: number[]; plan: ModernizationPlanRow[]; breakEvenOffset: number; endingCashflow: number };
  let candidates: Candidate[] = [{ placements: [], plan: [], breakEvenOffset: 9999, endingCashflow: -Infinity }];
  const possibleOffsets = Array.from(
    { length: Math.floor((CALCULATION_HORIZON_MONTHS - 4) / 3) + 1 },
    (_, index) => 3 + index * 3,
  ).filter((value) => value < CALCULATION_HORIZON_MONTHS);

  for (let index = 0; index < relevant.length; index += 1) {
    const next: Candidate[] = [];
    for (const candidate of candidates) {
      for (const offset of possibleOffsets) {
        const placements = [...candidate.placements, offset];
        const plan = buildPlanFromPlacements(params, relevant, placements, capAbs);
        const score = placementScore(params, plan, increases558, increases558WithRentIndex);
        next.push({ placements, plan, breakEvenOffset: score.breakEvenOffset, endingCashflow: score.endingCashflow });
      }
    }
    next.sort((a, b) => a.breakEvenOffset - b.breakEvenOffset || b.endingCashflow - a.endingCashflow);
    candidates = next.slice(0, 24);
  }

  return candidates[0]?.plan ?? [];
}

export function runRentCalculator(params: CalculatorParams, renovationCases: RenovationCase[]) {
  const denseMarket = isDenseMarket(params.city);
  const capPercent = denseMarket ? 0.15 : 0.2;
  const rentPerM2 = params.livingAreaM2 > 0 ? params.monthlyRentStart / params.livingAreaM2 : 0;
  const capPerM2 = rentPerM2 < 7 ? 2 : 3;
  const capAbs = roundCurrency(capPerM2 * Math.max(0, params.livingAreaM2));
  const conservativeRentIndexPerM2 = rentPerM2 > 0 ? roundCurrency(rentPerM2 * 1.02) : 0;
  const marketRentIndexPerM2 = params.rentIndexPerM2 && params.rentIndexPerM2 > 0
    ? params.rentIndexPerM2
    : conservativeRentIndexPerM2;
  const increases558 = plan558(params, capPercent, conservativeRentIndexPerM2);
  const increases558WithRentIndex = plan558(params, capPercent, marketRentIndexPerM2);
  const defaultPlan = params.mode === 'POTENTIAL'
    ? placePotentialModernizations(params, capAbs)
    : placeKnownModernizations(params, renovationCases, capAbs);
  const modernizationPlan = params.placementMode === 'OPTIMIZED' && params.mode === 'KNOWN'
    ? optimizeKnownModernizations(params, renovationCases, capAbs, increases558, increases558WithRentIndex)
    : defaultPlan;
  const scenario = buildTimeline(params, increases558, increases558WithRentIndex, modernizationPlan);

  const lastRow = scenario.timeline[scenario.timeline.length - 1];
  const firstRow = scenario.timeline[0];
  const totalRenovationCosts = modernizationPlan.reduce((sum, item) => sum + item.allocableCosts, 0);
  const metrics = {
    totalInvestment: roundCurrency(params.totalInvestment),
    totalRenovationCosts: roundCurrency(totalRenovationCosts),
    grossYieldToday: params.purchasePrice > 0 ? roundCurrency((params.monthlyRentStart * 12 / params.purchasePrice) * 100) : 0,
    netYieldToday: params.totalInvestment > 0
      ? roundCurrency(((params.monthlyRentStart - (firstRow?.nonAllocableCosts ?? 0)) * 12 / params.totalInvestment) * 100)
      : 0,
    cashflowToday: firstRow?.monthlyDelta ?? 0,
    afterTaxCashflowToday: firstRow?.afterTaxCashflow ?? 0,
    rentAtHorizon: lastRow?.rentTotal ?? 0,
    rentAtHorizonWithRentIndex: lastRow?.rentTotalWithRentIndex ?? 0,
    endingCashflow: lastRow?.cumulativeCashflow ?? 0,
    endingCashflowWithRentIndex: scenario.timeline.reduce((sum, row) => sum + row.rentTotalWithRentIndex - row.expenses, 0),
  };

  return {
    params: { ...params, rentIndexPerM2: marketRentIndexPerM2 },
    denseMarket,
    capPercent,
    capPerM2,
    capAbs,
    rentIndexPerM2: marketRentIndexPerM2,
    rentIndexSource: params.rentIndexSource,
    timeline: scenario.timeline,
    modernizationPlan,
    increases558,
    increases558WithRentIndex,
    breakEven: scenario.breakEven,
    breakEvenWithRentIndex: scenario.breakEvenWithRentIndex,
    placementMode: params.placementMode,
    metrics,
  };
}
