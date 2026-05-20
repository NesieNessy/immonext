import { roundCurrency } from './acquisitionCosts';
import { costForCase, type RenovationCase } from './renovation';

export type CalculatorMode = 'KNOWN' | 'POTENTIAL';

export type CalculatorParams = {
  startYyyymm: string;
  monthlyRentStart: number;
  livingAreaM2: number;
  city: string;
  postalCode: string;
  last558Date: string | null;
  last559Date: string | null;
  rentIndexPerM2: number | null;
  monthlyDebtService: number;
  mode: CalculatorMode;
};

export type RentTimelineRow = {
  yyyymm: string;
  rentTotal: number;
  delta558: number;
  delta559: number;
  renovationPayment: number;
  debtService: number;
  income: number;
  expenses: number;
  monthlyDelta: number;
  cumulativeIncome: number;
  cumulativeExpenses: number;
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
  'stuttgart',
  'freiburg im breisgau',
  'heidelberg',
  'münchen',
  'muenchen',
  'nürnberg',
  'nuernberg',
  'augsburg',
  'berlin',
  'potsdam',
  'wildau',
  'bremen',
  'hamburg',
  'frankfurt am main',
  'wiesbaden',
  'rostock',
  'hannover',
  'göttingen',
  'goettingen',
  'köln',
  'koeln',
  'düsseldorf',
  'duesseldorf',
  'mainz',
  'ludwigshafen',
  'dresden',
  'leipzig',
  'erfurt',
  'jena',
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

function placeKnownModernizations(params: CalculatorParams, renovationCases: RenovationCase[], capAbs: number) {
  const plan: ModernizationPlanRow[] = [];
  const relevant = renovationCases.filter((item) => item.selected && item.ai);

  relevant.forEach((item, index) => {
    const allocableCosts = costForCase(item);
    const wantedDelta = roundCurrency((0.08 * allocableCosts) / 12);
    let effective = addMonths(params.startYyyymm, item.zeitpunkt === 'SOFORT' ? 3 : 6 + index * 3);
    let room = capRoomAt(plan, effective, capAbs);

    while (room <= 0 && compareMonth(effective, addMonths(params.startYyyymm, 119)) < 0) {
      effective = addMonths(effective, 1);
      room = capRoomAt(plan, effective, capAbs);
    }

    const monthlyDelta = roundCurrency(Math.min(wantedDelta, room));
    if (monthlyDelta <= 0) return;

    plan.push({
      id: item.id,
      title: item.massnahme,
      source: 'KNOWN',
      paymentYyyymm: item.zeitpunkt === 'SOFORT' ? params.startYyyymm : addMonths(effective, -2),
      effectiveYyyymm: effective,
      monthlyDelta,
      allocableCosts,
    });
  });

  return plan;
}

function placePotentialModernizations(params: CalculatorParams, capAbs: number) {
  const plan: ModernizationPlanRow[] = [];
  const firstEffective = addMonths(params.startYyyymm, 3);
  const secondEffective = addMonths(firstEffective, 72);
  [firstEffective, secondEffective].forEach((effective, index) => {
    if (compareMonth(effective, addMonths(params.startYyyymm, 119)) > 0) return;
    const room = capRoomAt(plan, effective, capAbs);
    if (room <= 0) return;
    plan.push({
      id: `potential-${index + 1}`,
      title: `Potenzial ${index + 1}`,
      source: 'POTENTIAL',
      paymentYyyymm: addMonths(effective, -2),
      effectiveYyyymm: effective,
      monthlyDelta: room,
      allocableCosts: roundCurrency((room * 12) / 0.08),
    });
  });
  return plan;
}

function plan558(params: CalculatorParams, capPercent: number) {
  const steps: RentIncrease558Row[] = [];
  if (params.monthlyRentStart <= 0 || params.livingAreaM2 <= 0) return steps;

  let lastEffective = params.last558Date
    ? normalizeYyyymm(params.last558Date, addMonths(params.startYyyymm, -1000))
    : addMonths(params.startYyyymm, -1000);
  let current558Base = params.monthlyRentStart;
  const startPerM2 = params.rentIndexPerM2 && params.rentIndexPerM2 > 0
    ? params.rentIndexPerM2
    : (params.monthlyRentStart / params.livingAreaM2) * 1.02;

  for (let offset = 0; offset < 120; offset += 1) {
    const month = addMonths(params.startYyyymm, offset);
    if (monthDiff(lastEffective, month) < 15) continue;

    const yearIndex = Math.floor(offset / 12);
    const target = roundCurrency(startPerM2 * Math.pow(1.02, yearIndex) * params.livingAreaM2);
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

export function runRentCalculator(params: CalculatorParams, renovationCases: RenovationCase[]) {
  const denseMarket = isDenseMarket(params.city);
  const capPercent = denseMarket ? 0.15 : 0.2;
  const rentPerM2 = params.livingAreaM2 > 0 ? params.monthlyRentStart / params.livingAreaM2 : 0;
  const capPerM2 = rentPerM2 < 7 ? 2 : 3;
  const capAbs = roundCurrency(capPerM2 * Math.max(0, params.livingAreaM2));
  const increases558 = plan558(params, capPercent);
  const modernizationPlan = params.mode === 'POTENTIAL'
    ? placePotentialModernizations(params, capAbs)
    : placeKnownModernizations(params, renovationCases, capAbs);

  let cumulativeIncome = 0;
  let cumulativeExpenses = 0;
  let breakEven: string | null = null;

  const timeline: RentTimelineRow[] = Array.from({ length: 120 }, (_, offset) => {
    const yyyymm = addMonths(params.startYyyymm, offset);
    const delta558 = roundCurrency(
      increases558
        .filter((item) => item.effectiveYyyymm === yyyymm)
        .reduce((sum, item) => sum + item.monthlyDelta, 0),
    );
    const delta559 = roundCurrency(
      modernizationPlan
        .filter((item) => item.effectiveYyyymm === yyyymm)
        .reduce((sum, item) => sum + item.monthlyDelta, 0),
    );
    const active558 = increases558
      .filter((item) => compareMonth(item.effectiveYyyymm, yyyymm) <= 0)
      .reduce((sum, item) => sum + item.monthlyDelta, 0);
    const active559 = modernizationPlan
      .filter((item) => compareMonth(item.effectiveYyyymm, yyyymm) <= 0)
      .reduce((sum, item) => sum + item.monthlyDelta, 0);
    const renovationPayment = roundCurrency(
      modernizationPlan
        .filter((item) => item.paymentYyyymm === yyyymm)
        .reduce((sum, item) => sum + item.allocableCosts, 0),
    );
    const rentTotal = roundCurrency(params.monthlyRentStart + active558 + active559);
    const income = rentTotal;
    const expenses = roundCurrency(params.monthlyDebtService + renovationPayment);
    const monthlyDelta = roundCurrency(income - expenses);
    cumulativeIncome = roundCurrency(cumulativeIncome + income);
    cumulativeExpenses = roundCurrency(cumulativeExpenses + expenses);
    if (!breakEven && cumulativeIncome > cumulativeExpenses) breakEven = yyyymm;

    return {
      yyyymm,
      rentTotal,
      delta558,
      delta559,
      renovationPayment,
      debtService: params.monthlyDebtService,
      income,
      expenses,
      monthlyDelta,
      cumulativeIncome,
      cumulativeExpenses,
    };
  });

  return {
    params,
    denseMarket,
    capPercent,
    capPerM2,
    capAbs,
    timeline,
    modernizationPlan,
    increases558,
    breakEven,
  };
}
