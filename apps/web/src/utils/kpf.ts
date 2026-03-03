import type { KpfConstructionYearBucket } from '@immonext/types';

/**
 * Kaufpreisfaktor = Kaufpreis / (Kaltmiete × 12), rounded to 1 decimal place.
 * Returns null when either input is ≤ 0.
 */
export function calcKpf(purchasePrice: number, coldRent: number): number | null {
  if (purchasePrice <= 0 || coldRent <= 0) return null;
  return Math.round((purchasePrice / (coldRent * 12)) * 10) / 10;
}

/**
 * Where does `kpf` sit within [minValue, maxValue] as a percentage 0–100?
 * Clamped so it never goes below 0 or above 100.
 */
export function calcPositionPct(
  kpf: number,
  minValue: number,
  maxValue: number
): number {
  if (maxValue <= minValue) return 50;
  const pct = ((kpf - minValue) / (maxValue - minValue)) * 100;
  return Math.min(100, Math.max(0, pct));
}

/**
 * Maps a construction year to the corresponding KPF range bucket string.
 */
export function yearToBucket(year: number): KpfConstructionYearBucket {
  if (year < 1918) return '<1918';
  if (year <= 1949) return '1918-1949';
  if (year <= 1959) return '1950-1959';
  if (year <= 1969) return '1960-1969';
  if (year <= 1979) return '1970-1979';
  if (year <= 1989) return '1980-1989';
  if (year <= 1999) return '1990-1999';
  if (year <= 2009) return '2000-2009';
  if (year <= 2014) return '2010-2014';
  return '2015+';
}
