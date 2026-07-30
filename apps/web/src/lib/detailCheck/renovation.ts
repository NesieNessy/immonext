import { roundCurrency } from './acquisitionCosts';

export type RenovationCategory =
  | 'ENERGETISCH'
  | 'SANITAER'
  | 'WOHNWERT'
  | 'BARRIEREFREIHEIT'
  | 'TECHNIK_SICHERHEIT'
  | 'AUSSEN'
  | 'SONSTIGES';

export type RenovationTiming = 'SOFORT' | 'FLEXIBEL';
export type RenovationFinancingMode = 'FREMD' | 'EIGEN' | 'TEILWEISE';

export type RenovationCase = {
  id: string;
  kategorie: RenovationCategory;
  massnahme: string;
  beschreibung?: string;
  uploads?: string[];
  ai?: {
    summary: string;
    price_min: number;
    price_max: number;
    confidence: number;
    source: 'AI' | 'FALLBACK';
  };
  selected: boolean;
  zeitpunkt: RenovationTiming;
  cost_selected?: number;
  calculator_effective_yyyymm?: string;
  publish_order: boolean;
};

export const RENOVATION_CATEGORIES: { value: RenovationCategory; label: string }[] = [
  { value: 'ENERGETISCH', label: 'Energetisch' },
  { value: 'SANITAER', label: 'Sanitär' },
  { value: 'WOHNWERT', label: 'Wohnwert' },
  { value: 'BARRIEREFREIHEIT', label: 'Barrierefreiheit' },
  { value: 'TECHNIK_SICHERHEIT', label: 'Technik / Sicherheit' },
  { value: 'AUSSEN', label: 'Außen' },
  { value: 'SONSTIGES', label: 'Sonstiges' },
];

export const RENOVATION_MEASURES: Record<RenovationCategory, string[]> = {
  ENERGETISCH: [
    'Fassadendämmung',
    'Dachdämmung',
    'Fenster erneuern (3-fach-Verglasung)',
    'Türen abdichten / Austausch Eingangstür',
    'Heizungsmodernisierung / Wärmepumpe',
    'Solar- / PV-Anlage',
    'Dämmung Kellerdecke',
    'Thermostatventile / Smart Heating',
    'Dämmung Heizkörpernischen',
  ],
  SANITAER: [
    'Neue Wasserleitungen (Verbundrohr)',
    'Zentrale Warmwasserversorgung',
    'Austausch Durchlauferhitzer',
    'Wassersparende Armaturen',
    'Badsanierung komplett',
  ],
  WOHNWERT: [
    'Küchensanierung (Installationen, Fliesen, Anschlüsse)',
    'Neue Bodenbeläge (Parkett/Vinyl)',
    'Neue Innentüren',
    'Abgehängte Decke + Spots',
    'Neue Elektroverteilung / FI-Schalter',
    'Mehr Steckdosen / Stromkreise',
    'LAN / Glasfaser / Medienanschluss',
    'Video-Gegensprechanlage',
    'Smart-Home-Systeme',
    'Wohnungseingangstür (Sicherheitsklasse)',
    'Fußbodenheizung einbauen',
  ],
  BARRIEREFREIHEIT: [
    'Ebenerdige Dusche statt Wanne',
    'Türverbreiterung',
    'Schwellenfreie Übergänge',
    'Halte- und Stützgriffe',
    'Treppenlift / Aufzug',
  ],
  TECHNIK_SICHERHEIT: [
    'Rauchmelder / CO-Melder',
    'Alarmanlage / Einbruchschutz',
    'Sicherheitsbeschläge / Panzerriegel',
  ],
  AUSSEN: [
    'Balkonsanierung',
    'Neuer Balkon / Anbau',
    'Fassadenanstrich',
    'Dachsanierung',
    'Treppenhausmodernisierung',
    'Kellerabdichtung',
    'Garten- / Hofgestaltung',
    'Neuer Müllplatz / Fahrradraum',
  ],
  SONSTIGES: [
    'Schallschutzfenster',
    'Wintergarten / Loggiaausbau',
    'Kellerdämmung / Abdichtung',
    'Neue Dachfenster / Belichtung',
    'Hausanschluss Glasfaser / Breitband',
  ],
};

const BASE_PRICES: Record<string, { min: number; max: number }> = {
  'Fassadendämmung': { min: 18000, max: 42000 },
  'Dachdämmung': { min: 9000, max: 26000 },
  'Fenster erneuern (3-fach-Verglasung)': { min: 8000, max: 18000 },
  'Türen abdichten / Austausch Eingangstür': { min: 1500, max: 6500 },
  'Heizungsmodernisierung / Wärmepumpe': { min: 18000, max: 42000 },
  'Solar- / PV-Anlage': { min: 12000, max: 28000 },
  'Dämmung Kellerdecke': { min: 3500, max: 9500 },
  'Thermostatventile / Smart Heating': { min: 600, max: 2200 },
  'Dämmung Heizkörpernischen': { min: 800, max: 2800 },
  'Neue Wasserleitungen (Verbundrohr)': { min: 4500, max: 12000 },
  'Zentrale Warmwasserversorgung': { min: 3500, max: 11000 },
  'Austausch Durchlauferhitzer': { min: 700, max: 2500 },
  'Wassersparende Armaturen': { min: 300, max: 1500 },
  'Badsanierung komplett': { min: 12000, max: 28000 },
  'Küchensanierung (Installationen, Fliesen, Anschlüsse)': { min: 5000, max: 18000 },
  'Neue Bodenbeläge (Parkett/Vinyl)': { min: 4500, max: 14500 },
  'Neue Innentüren': { min: 1800, max: 7000 },
  'Abgehängte Decke + Spots': { min: 2500, max: 9000 },
  'Neue Elektroverteilung / FI-Schalter': { min: 3500, max: 12000 },
  'Mehr Steckdosen / Stromkreise': { min: 1200, max: 5000 },
  'LAN / Glasfaser / Medienanschluss': { min: 900, max: 4500 },
  'Video-Gegensprechanlage': { min: 600, max: 2800 },
  'Smart-Home-Systeme': { min: 1500, max: 8500 },
  'Wohnungseingangstür (Sicherheitsklasse)': { min: 1800, max: 6000 },
  'Fußbodenheizung einbauen': { min: 9000, max: 25000 },
  'Ebenerdige Dusche statt Wanne': { min: 4500, max: 13000 },
  'Türverbreiterung': { min: 1200, max: 6000 },
  'Schwellenfreie Übergänge': { min: 900, max: 4500 },
  'Halte- und Stützgriffe': { min: 250, max: 1200 },
  'Treppenlift / Aufzug': { min: 7000, max: 35000 },
  'Rauchmelder / CO-Melder': { min: 150, max: 900 },
  'Alarmanlage / Einbruchschutz': { min: 1200, max: 7000 },
  'Sicherheitsbeschläge / Panzerriegel': { min: 500, max: 2800 },
  'Balkonsanierung': { min: 6000, max: 22000 },
  'Neuer Balkon / Anbau': { min: 18000, max: 55000 },
  'Fassadenanstrich': { min: 6000, max: 20000 },
  'Dachsanierung': { min: 18000, max: 60000 },
  'Treppenhausmodernisierung': { min: 6000, max: 24000 },
  'Kellerabdichtung': { min: 8000, max: 28000 },
  'Garten- / Hofgestaltung': { min: 2500, max: 18000 },
  'Neuer Müllplatz / Fahrradraum': { min: 2500, max: 12000 },
  'Schallschutzfenster': { min: 9000, max: 22000 },
  'Wintergarten / Loggiaausbau': { min: 18000, max: 50000 },
  'Kellerdämmung / Abdichtung': { min: 6000, max: 24000 },
  'Neue Dachfenster / Belichtung': { min: 3000, max: 12000 },
  'Hausanschluss Glasfaser / Breitband': { min: 800, max: 4500 },
};

export function categoryLabel(category: RenovationCategory): string {
  return RENOVATION_CATEGORIES.find((item) => item.value === category)?.label ?? category;
}

export function regionFactorFromPostalCode(postalCode?: string | null): number {
  const plz = (postalCode ?? '').trim();
  if (!/^\d{5}$/.test(plz)) return 1;
  const prefix = Number(plz.slice(0, 2));
  if ([10, 11, 20, 22, 80, 81, 82, 85, 60, 61, 65].includes(prefix)) return 1.12;
  if ([70, 71, 72, 50, 51, 40, 41, 42, 43, 44, 45].includes(prefix)) return 1.06;
  if ([1, 2, 3, 4, 5, 6, 7, 8, 9].includes(prefix)) return 1.03;
  return 1;
}

export function evaluateRenovationCases(args: {
  cases: RenovationCase[];
  postalCode?: string | null;
  livingAreaM2?: number | null;
}) {
  const factor = regionFactorFromPostalCode(args.postalCode);
  const areaFactor = args.livingAreaM2 && args.livingAreaM2 > 0
    ? Math.max(0.8, Math.min(1.45, args.livingAreaM2 / 80))
    : 1;

  return args.cases.map((item) => {
    const base = BASE_PRICES[item.massnahme] ?? { min: 2500, max: 12000 };
    const scale = item.kategorie === 'ENERGETISCH' || item.kategorie === 'AUSSEN' || item.kategorie === 'WOHNWERT'
      ? areaFactor
      : 1;
    const priceMin = roundCurrency(base.min * factor * scale);
    const priceMax = roundCurrency(base.max * factor * scale);

    return {
      ...item,
      selected: item.selected ?? true,
      zeitpunkt: item.zeitpunkt ?? 'SOFORT',
      publish_order: item.publish_order ?? false,
      ai: {
        summary: `${item.massnahme}: erste Kostenspanne auf Basis von Kategorie, Wohnfläche und PLZ-Regionalfaktor.`,
        price_min: priceMin,
        price_max: Math.max(priceMin, priceMax),
        confidence: 0.62,
        source: 'FALLBACK' as const,
      },
    };
  });
}

export function aggregateRenovationPricing(cases: RenovationCase[]) {
  const selected = cases.filter((item) => item.selected && item.ai);
  const sumMin = roundCurrency(selected.reduce((sum, item) => sum + (item.ai?.price_min ?? 0), 0));
  const sumMax = roundCurrency(selected.reduce((sum, item) => sum + (item.ai?.price_max ?? 0), 0));
  return {
    sum_min: sumMin,
    sum_max: sumMax,
    sum_mid: roundCurrency((sumMin + sumMax) / 2),
  };
}

export function costForCase(item: RenovationCase): number {
  if (typeof item.cost_selected === 'number') return roundCurrency(item.cost_selected);
  if (!item.ai) return 0;
  return roundCurrency((item.ai.price_min + item.ai.price_max) / 2);
}
