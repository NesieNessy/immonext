import { roundCurrency } from './acquisitionCosts';

export type TrafficLight = 'GREEN' | 'YELLOW' | 'RED';

export type LocationSubFactor = {
  label: string;
  value: string;
  score: number;
  weight: number;
};

export type LocationCategoryScore = {
  label: string;
  weight: number;
  score: number;
  light: TrafficLight;
  summary: string;
  factors: LocationSubFactor[];
};

export type SpecialLocationScore = {
  label: string;
  score: number;
  light: TrafficLight;
  summary: string;
};

export type LocationScoreResult = {
  city: string;
  postalCode: string;
  address: string;
  macroScore: number;
  microScore: number;
  totalScore: number;
  totalLight: TrafficLight;
  macroCategories: LocationCategoryScore[];
  microCategories: LocationCategoryScore[];
  specialScores: SpecialLocationScore[];
  summary: string;
  dataQuality: string;
};

const CITY_BASE: Record<string, { macro: number; micro: number; rentability: number; appreciation: number; senior: number; vacation: number }> = {
  berlin: { macro: 78, micro: 74, rentability: 82, appreciation: 72, senior: 78, vacation: 66 },
  hamburg: { macro: 80, micro: 76, rentability: 82, appreciation: 74, senior: 79, vacation: 72 },
  münchen: { macro: 84, micro: 78, rentability: 86, appreciation: 76, senior: 80, vacation: 70 },
  muenchen: { macro: 84, micro: 78, rentability: 86, appreciation: 76, senior: 80, vacation: 70 },
  köln: { macro: 77, micro: 75, rentability: 80, appreciation: 70, senior: 76, vacation: 66 },
  koeln: { macro: 77, micro: 75, rentability: 80, appreciation: 70, senior: 76, vacation: 66 },
  'frankfurt am main': { macro: 79, micro: 73, rentability: 81, appreciation: 71, senior: 74, vacation: 64 },
  stuttgart: { macro: 78, micro: 74, rentability: 79, appreciation: 70, senior: 76, vacation: 62 },
  leipzig: { macro: 73, micro: 71, rentability: 76, appreciation: 72, senior: 74, vacation: 65 },
  dresden: { macro: 72, micro: 72, rentability: 75, appreciation: 69, senior: 76, vacation: 67 },
  düsseldorf: { macro: 77, micro: 74, rentability: 79, appreciation: 70, senior: 76, vacation: 65 },
  duesseldorf: { macro: 77, micro: 74, rentability: 79, appreciation: 70, senior: 76, vacation: 65 },
};

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function lightFor(score: number): TrafficLight {
  if (score >= 70) return 'GREEN';
  if (score >= 50) return 'YELLOW';
  return 'RED';
}

export function labelForLight(light: TrafficLight): string {
  if (light === 'GREEN') return 'Grün';
  if (light === 'YELLOW') return 'Gelb';
  return 'Rot';
}

function weightedScore(factors: LocationSubFactor[]) {
  return clampScore(factors.reduce((sum, factor) => sum + factor.score * factor.weight, 0));
}

function factor(label: string, value: string, score: number, weight: number): LocationSubFactor {
  return { label, value, score: clampScore(score), weight };
}

function category(label: string, weight: number, summary: string, factors: LocationSubFactor[]): LocationCategoryScore {
  const score = weightedScore(factors);
  return {
    label,
    weight,
    score,
    light: lightFor(score),
    summary,
    factors,
  };
}

function profileFor(city: string) {
  return CITY_BASE[city.trim().toLowerCase()] ?? { macro: 66, micro: 64, rentability: 68, appreciation: 62, senior: 66, vacation: 55 };
}

export function computeLocationScore(args: {
  city?: string | null;
  postalCode?: string | null;
  streetHouseNumber?: string | null;
}) : LocationScoreResult {
  const city = (args.city ?? '').trim();
  const postalCode = (args.postalCode ?? '').trim();
  const profile = profileFor(city);
  const macroBase = profile.macro;
  const microBase = profile.micro;
  const address = [args.streetHouseNumber, postalCode, city].filter(Boolean).join(', ');

  const macroCategories = [
    category('Demografie & Bevölkerung', 0.25, 'Regionale Nachfragebasis und Haushaltsstruktur werden indikativ eingeordnet.', [
      factor('Bevölkerungsentwicklung 5 Jahre', city ? 'leicht positiv / stabil' : 'nicht ermittelt', macroBase - 6, 0.5),
      factor('Altersstruktur 25-65 Jahre', 'stabile Erwerbsbevölkerung', macroBase + 5, 0.3),
      factor('Wanderungssaldo', 'neutral bis leicht positiv', macroBase - 2, 0.2),
    ]),
    category('Wirtschaft & Arbeitsmarkt', 0.25, 'Arbeitsmarkt und Einkommensbasis wirken als Nachfrageanker.', [
      factor('Arbeitslosenquote', 'indikativ solide', macroBase + 2, 0.55),
      factor('Einkommensniveau', 'mittleres bis gutes Niveau', macroBase - 1, 0.25),
      factor('Pendler- und Beschäftigungsdichte', 'regionaler Arbeitsplatzbezug vorhanden', macroBase, 0.2),
    ]),
    category('Immobilienmarkt', 0.25, 'Mieten, Leerstand und Neubauaktivität werden als Marktdruck modelliert.', [
      factor('Mietentwicklung', 'moderates Wachstum', macroBase - 4, 0.35),
      factor('Leerstandsquote', 'kein erhöhter Leerstand im Modell', macroBase + 1, 0.35),
      factor('Neubautätigkeit', 'normal bis leicht erhöht', macroBase - 8, 0.3),
    ]),
    category('Infrastruktur & Standortqualität', 0.25, 'Versorgung, Verkehr und medizinische Infrastruktur stützen die Vermietbarkeit.', [
      factor('Verkehrsanbindung', 'gute regionale Anbindung', macroBase + 6, 0.35),
      factor('Schulen & Ärzte', 'grundsätzlich verfügbar', macroBase + 3, 0.35),
      factor('Breitband / digitale Versorgung', 'stadtüblich solide', macroBase - 1, 0.3),
    ]),
  ];

  const microCategories = [
    category('Erreichbarkeit & Mobilität', 0.2, 'Die Nähe zu ÖPNV und Straßen wird als alltagstauglich eingeschätzt.', [
      factor('ÖPNV-Erreichbarkeit', 'fußläufige Haltestellen angenommen', microBase + 8, 0.6),
      factor('Straßenanbindung', 'solide Erreichbarkeit', microBase + 2, 0.4),
    ]),
    category('Nahversorgung & Alltag', 0.2, 'Supermärkte, Apotheken und Schulen werden im MVP indikativ bewertet.', [
      factor('Supermärkte / Einzelhandel', 'fußläufig oder kurz erreichbar', microBase + 6, 0.4),
      factor('Apotheken / Ärzte', 'stadtüblich erreichbar', microBase + 3, 0.3),
      factor('Schulen / Kitas', 'regionstypisch verfügbar', microBase, 0.3),
    ]),
    category('Wohnqualität & Umfeld', 0.2, 'Ruhiges Umfeld, Grünflächen und Belastungen werden heuristisch eingeordnet.', [
      factor('Lärm', 'keine Detailmessung, leichte Belastung angenommen', microBase - 8, 0.45),
      factor('Grünflächen', 'ausreichendes Umfeld im Modell', microBase + 4, 0.35),
      factor('Bebauung / Quartier', 'stabile Wohnstruktur', microBase + 1, 0.2),
    ]),
    category('Sozial- & Mieterstruktur', 0.2, 'Stabilität und Zielgruppen-Fit werden aus Stadtprofil und Objektkontext abgeleitet.', [
      factor('Nachbarschaftsstabilität', 'stabile Mieterstruktur angenommen', microBase + 5, 0.5),
      factor('Fluktuation', 'normal', microBase - 2, 0.25),
      factor('Einkommensbandbreite', 'breit genug für Vermietung', microBase + 1, 0.25),
    ]),
    category('Vergleichsmiete & Marktposition', 0.2, 'Die Marktposition wird als Potential gegenüber der Vergleichsmiete bewertet.', [
      factor('Mietniveau', 'leicht unter bis im Marktdurchschnitt', microBase, 0.55),
      factor('Aufwertungspotenzial', 'moderat vorhanden', microBase - 3, 0.45),
    ]),
  ];

  const macroScore = clampScore(macroCategories.reduce((sum, item) => sum + item.score * item.weight, 0));
  const microScore = clampScore(microCategories.reduce((sum, item) => sum + item.score * item.weight, 0));
  const totalScore = clampScore(roundCurrency(macroScore * 0.4 + microScore * 0.6));
  const totalLight = lightFor(totalScore);

  return {
    city,
    postalCode,
    address,
    macroScore,
    microScore,
    totalScore,
    totalLight,
    macroCategories,
    microCategories,
    specialScores: [
      { label: 'Vermietbarkeit', score: clampScore(profile.rentability), light: lightFor(profile.rentability), summary: 'Gute Nachfrage für langfristige Vermietung im aktuellen Modell.' },
      { label: 'Wertsteigerung', score: clampScore(profile.appreciation), light: lightFor(profile.appreciation), summary: 'Moderates Potenzial; Neubau und Marktphase bleiben zu prüfen.' },
      { label: 'Senioren-Eignung', score: clampScore(profile.senior), light: lightFor(profile.senior), summary: 'Versorgung und Erreichbarkeit sprechen grundsätzlich für Senioren-Eignung.' },
      { label: 'Ferien-Eignung', score: clampScore(profile.vacation), light: lightFor(profile.vacation), summary: 'Touristische Nutzung nur indikativ und standortabhängig attraktiv.' },
    ],
    summary: totalScore >= 70
      ? 'Die Lage wirkt im aktuellen Modell stabil und gut vermietbar. Mikro- und Makrolage liefern eine solide Investmentbasis; Detaildaten sollten vor Kaufentscheidung ergänzt werden.'
      : totalScore >= 50
        ? 'Die Lage ist grundsätzlich nutzbar, zeigt aber einzelne Einschränkungen. Vor allem echte Markt-, Leerstands- und Infrastrukturwerte sollten nachgeschärft werden.'
        : 'Die Lage zeigt im Modell erhöhte Risiken. Eine vertiefte Prüfung mit belastbaren Standortdaten ist vor einer Investitionsentscheidung empfehlenswert.',
    dataQuality: city ? 'MVP-Fallback auf Basis Stadtprofil und Objektadresse. Externe Live-Daten sind noch nicht angebunden.' : 'Ort fehlt; Score basiert auf neutralem Fallback.',
  };
}
