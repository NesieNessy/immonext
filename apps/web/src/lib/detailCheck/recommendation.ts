export type MetricStatus = 'DEFINED' | 'FALLBACK' | 'UNDEFINED';

export type RecommendationLevel = 'BUY' | 'CHECK' | 'CRITICAL' | 'NO_BUY';

export type RecommendationMetric = {
  key: string;
  label: string;
  value: number | null;
  unit: 'EUR' | 'PERCENT' | 'EUR_MONTH' | 'TEXT';
  status: MetricStatus;
  note: string;
};

export type RecommendationScorePart = {
  key: string;
  label: string;
  score: number;
  weight: number;
  status: MetricStatus;
  note: string;
};

export type RecommendationInput = {
  purchasePrice: number;
  parkingPurchasePrice: number;
  totalAdditionalCosts: number;
  totalCosts: number;
  coldRentToday: number;
  rentInTenYears: number;
  monthlyDebtService: number;
  serviceChargesNonAllocable: number;
  afaPercent: number;
  buildingValue: number;
  locationScore: number | null;
  comparisonSimilarityScore: number | null;
  taxRatePercent?: number;
  propertyAppreciationPercentPA?: number;
};

export type RecommendationResult = {
  recommendationScore: number;
  level: RecommendationLevel;
  label: string;
  summary: string;
  metrics: RecommendationMetric[];
  scoreParts: RecommendationScorePart[];
  missingDefinitions: string[];
  assumptions: string[];
};

const DEFAULT_TAX_RATE_PERCENT = 35;
const DEFAULT_PROPERTY_APPRECIATION_PERCENT_PA = 1.5;

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

function scoreBetween(value: number | null, low: number, high: number): number {
  if (value == null || !Number.isFinite(value)) return 50;
  if (value <= low) return 20;
  if (value >= high) return 100;
  return round2(20 + ((value - low) / (high - low)) * 80);
}

function scoreCashflow(value: number | null): number {
  if (value == null || !Number.isFinite(value)) return 50;
  if (value <= -600) return 10;
  if (value >= 300) return 100;
  return round2(10 + ((value + 600) / 900) * 90);
}

function levelFor(score: number): Pick<RecommendationResult, 'level' | 'label'> {
  if (score >= 75) return { level: 'BUY', label: 'Kaufen / sehr attraktiv' };
  if (score >= 60) return { level: 'CHECK', label: 'Kaufen nach Prüfung / solide' };
  if (score >= 45) return { level: 'CRITICAL', label: 'Kritisch prüfen' };
  return { level: 'NO_BUY', label: 'Nicht empfehlen' };
}

function metric(
  key: string,
  label: string,
  value: number | null,
  unit: RecommendationMetric['unit'],
  status: MetricStatus,
  note: string,
): RecommendationMetric {
  return { key, label, value: value == null ? null : round2(value), unit, status, note };
}

function weightedAverage(parts: RecommendationScorePart[]): number {
  const weighted = parts.reduce((sum, part) => sum + part.score * part.weight, 0);
  const weights = parts.reduce((sum, part) => sum + part.weight, 0);
  return weights > 0 ? round2(weighted / weights) : 0;
}

export function computeRecommendation(input: RecommendationInput): RecommendationResult {
  const taxRatePercent = input.taxRatePercent ?? DEFAULT_TAX_RATE_PERCENT;
  const appreciationPercentPA = input.propertyAppreciationPercentPA ?? DEFAULT_PROPERTY_APPRECIATION_PERCENT_PA;
  const effectivePurchasePrice = input.purchasePrice + input.parkingPurchasePrice;
  const effectiveTotalCosts = input.totalCosts || effectivePurchasePrice + input.totalAdditionalCosts;
  const annualRentToday = input.coldRentToday * 12;
  const annualRentAfterNonAllocableCosts = Math.max(0, annualRentToday - input.serviceChargesNonAllocable * 12);
  const grossYield = effectivePurchasePrice > 0 ? (annualRentToday / effectivePurchasePrice) * 100 : null;
  const netYield = effectiveTotalCosts > 0 ? (annualRentAfterNonAllocableCosts / effectiveTotalCosts) * 100 : null;
  const cashflowBeforeTaxToday = input.coldRentToday - input.monthlyDebtService;
  const cashflowBeforeTaxInTenYears = input.rentInTenYears - input.monthlyDebtService;
  const monthlyAfa = input.buildingValue > 0 && input.afaPercent > 0
    ? (input.buildingValue * (input.afaPercent / 100)) / 12
    : null;
  const taxEffectMonthly = monthlyAfa == null ? null : monthlyAfa * (taxRatePercent / 100);
  const cashflowAfterTaxToday = taxEffectMonthly == null ? null : cashflowBeforeTaxToday + taxEffectMonthly;
  const cashflowAfterTaxInTenYears = taxEffectMonthly == null ? null : cashflowBeforeTaxInTenYears + taxEffectMonthly;
  const appreciationFactor = Math.pow(1 + appreciationPercentPA / 100, 10);
  const propertyAppreciation = effectiveTotalCosts > 0 ? effectiveTotalCosts * (appreciationFactor - 1) : null;
  const rentGrowthTenYears = input.coldRentToday > 0
    ? ((input.rentInTenYears - input.coldRentToday) / input.coldRentToday) * 100
    : null;

  const financeScore = round2((
    scoreBetween(grossYield, 2.5, 6.5)
    + scoreBetween(netYield, 2, 5.5)
    + scoreCashflow(cashflowAfterTaxToday)
    + scoreCashflow(cashflowAfterTaxInTenYears)
  ) / 4);
  const developmentScore = round2((
    scoreBetween(rentGrowthTenYears, 0, 35)
    + scoreBetween(propertyAppreciation == null || effectiveTotalCosts <= 0 ? null : (propertyAppreciation / effectiveTotalCosts) * 100, 0, 25)
  ) / 2);
  const taxScore = monthlyAfa == null ? 50 : scoreBetween(taxEffectMonthly, 0, 250);
  const locationScore = input.locationScore == null ? 50 : clamp(input.locationScore);
  const comparisonScore = input.comparisonSimilarityScore == null
    ? 50
    : clamp(100 - input.comparisonSimilarityScore * 1.6);

  const scoreParts: RecommendationScorePart[] = [
    {
      key: 'finance',
      label: 'Finanzen',
      score: financeScore,
      weight: 0.5,
      status: 'FALLBACK',
      note: 'MVP-Bewertung aus Rendite und Cashflow. Fachliche Schwellenwerte sind noch zu bestätigen.',
    },
    {
      key: 'development',
      label: 'Entwicklung',
      score: developmentScore,
      weight: 0.2,
      status: 'FALLBACK',
      note: 'Nutzt Mietkalkulator und eine angenommene Wertsteigerung, da Wertsteigerung fachlich noch offen ist.',
    },
    {
      key: 'tax',
      label: 'Steuern/AfA',
      score: round2(taxScore),
      weight: 0.1,
      status: monthlyAfa == null ? 'UNDEFINED' : 'FALLBACK',
      note: 'AfA ist berechenbar; Steuerwirkung nutzt vorläufig 35 % persönlichen Steuersatz.',
    },
    {
      key: 'location',
      label: 'Lage',
      score: round2(locationScore),
      weight: 0.15,
      status: input.locationScore == null ? 'UNDEFINED' : 'DEFINED',
      note: input.locationScore == null ? 'Lagescore wurde noch nicht ermittelt.' : 'Übernimmt den Score aus Mikro-/Makrolage.',
    },
    {
      key: 'comparison',
      label: 'Vergleich',
      score: round2(comparisonScore),
      weight: 0.05,
      status: input.comparisonSimilarityScore == null ? 'UNDEFINED' : 'DEFINED',
      note: input.comparisonSimilarityScore == null ? 'Keine Vergleichsobjekte gespeichert.' : 'Bewertet die Nähe zum besten Referenzobjekt.',
    },
  ];

  const recommendationScore = weightedAverage(scoreParts);
  const level = levelFor(recommendationScore);
  const summary = `${level.label}: Die Empfehlung basiert aktuell auf Finanzkennzahlen, Mietentwicklung, AfA, Lage und Vergleichsobjekten. Wo Fachlogik noch offen ist, werden MVP-Annahmen ausgewiesen statt versteckt.`;

  return {
    recommendationScore,
    ...level,
    summary,
    metrics: [
      metric('grossYield', 'Bruttorendite', grossYield, 'PERCENT', 'DEFINED', 'Jahreskaltmiete heute / Kaufpreis inkl. Stellplätze.'),
      metric('netYield', 'Nettorendite', netYield, 'PERCENT', 'FALLBACK', 'Vorläufig: Jahreskaltmiete abzüglich nicht umlagefähiger Nebenkosten / Gesamtkosten. Instandhaltung, Verwaltung und Steuer sind noch nicht vollständig definiert.'),
      metric('rentToday', 'Mieteinnahme heute', input.coldRentToday, 'EUR_MONTH', 'DEFINED', 'Aus Schritt Vermietung.'),
      metric('rentInTenYears', 'Mieteinnahme in 10 Jahren', input.rentInTenYears, 'EUR_MONTH', 'DEFINED', 'Aus dem letzten Monat des Mietkalkulators; falls nicht vorhanden, wird die aktuelle Miete verwendet.'),
      metric('cashflowBeforeTaxToday', 'Cashflow heute vor Steuer', cashflowBeforeTaxToday, 'EUR_MONTH', 'DEFINED', 'Miete heute minus Kapitaldienst pro Monat.'),
      metric('cashflowBeforeTaxInTenYears', 'Cashflow in 10 Jahren vor Steuer', cashflowBeforeTaxInTenYears, 'EUR_MONTH', 'DEFINED', 'Miete in 10 Jahren minus Kapitaldienst pro Monat.'),
      metric('monthlyAfa', 'AfA umgerechnet auf den Monat', monthlyAfa, 'EUR_MONTH', monthlyAfa == null ? 'UNDEFINED' : 'DEFINED', 'Gebäudewert * AfA-Satz / 12. Nur verfügbar, wenn Abschreibung berechnet wurde.'),
      metric('cashflowAfterTaxToday', 'Cashflow heute nach Steuer', cashflowAfterTaxToday, 'EUR_MONTH', taxEffectMonthly == null ? 'UNDEFINED' : 'FALLBACK', 'Vorläufig: Cashflow vor Steuer plus AfA-Steuereffekt mit 35 % Steuersatz.'),
      metric('cashflowAfterTaxInTenYears', 'Cashflow in 10 Jahren nach Steuer', cashflowAfterTaxInTenYears, 'EUR_MONTH', taxEffectMonthly == null ? 'UNDEFINED' : 'FALLBACK', 'Vorläufig: Cashflow in 10 Jahren plus AfA-Steuereffekt mit 35 % Steuersatz.'),
      metric('propertyAppreciation', 'Wertsteigerung Immobilie', propertyAppreciation, 'EUR', 'FALLBACK', 'Noch nicht fachlich definiert. MVP-Annahme: 1,5 % p.a. über 10 Jahre.'),
    ],
    scoreParts,
    missingDefinitions: [
      'Persönlicher Steuersatz und vollständige Steuerlogik für Cashflow nach Steuer.',
      'Vollständige Nettorendite inklusive Instandhaltung, Verwaltung, Leerstand, Rücklagen und Steuern.',
      'Fachliche Schwellenwerte für Kaufen / Prüfen / Nicht kaufen.',
      'Wertsteigerung der Immobilie nach Markt, Lage, Zustand und Vergleichswerten.',
      'Genaue Gewichtung der Empfehlung nach Finanzkennzahlen, Lage, Vergleich und steuerlicher Wirkung.',
    ],
    assumptions: [
      `Steuersatz für MVP-Steuereffekt: ${taxRatePercent} %.`,
      `Wertsteigerung Immobilie als Platzhalter: ${appreciationPercentPA} % p.a.`,
      'Kapitaldienst wird konstant aus der gewählten Finanzierungsvariante übernommen.',
      'Bruttorendite und Mieteinnahmen beziehen sich auf Kaltmiete ohne Stellplatzmiete.',
      'Empfehlungsschwellen: ab 75 Kaufen, ab 60 Kaufen nach Prüfung, ab 45 kritisch prüfen, darunter nicht empfehlen.',
    ],
  };
}
