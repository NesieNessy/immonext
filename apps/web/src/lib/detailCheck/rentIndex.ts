import { roundCurrency } from './acquisitionCosts';

type RentIndexBand = {
  minYear: number;
  maxYear: number;
  perArea: [number, number, number, number];
};

const RENT_INDEX_BANDS: RentIndexBand[] = [
  { minYear: 0, maxYear: 1948, perArea: [12, 13.5, 15, 16.5] },
  { minYear: 1949, maxYear: 1978, perArea: [14, 15.5, 17, 18.5] },
  { minYear: 1979, maxYear: 1999, perArea: [16, 17.5, 19, 20.5] },
  { minYear: 2000, maxYear: 2015, perArea: [18, 19.5, 21, 22.5] },
  { minYear: 2016, maxYear: 9999, perArea: [20, 21.5, 23, 24.5] },
];

function areaIndex(livingAreaM2: number): number {
  if (livingAreaM2 < 30) return 0;
  if (livingAreaM2 < 60) return 1;
  if (livingAreaM2 < 90) return 2;
  return 3;
}

/** Excel's automatic fallback based on the year/area rent-index table. */
export function estimateRentIndexPerM2(yearOfConstruction: number, livingAreaM2: number): number | null {
  if (!Number.isFinite(yearOfConstruction) || livingAreaM2 <= 0) return null;
  const band = RENT_INDEX_BANDS.find((item) => yearOfConstruction >= item.minYear && yearOfConstruction <= item.maxYear);
  return band ? roundCurrency(band.perArea[areaIndex(livingAreaM2)]) : null;
}
