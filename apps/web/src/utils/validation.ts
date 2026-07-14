export const MIN_CONSTRUCTION_YEAR = 1850;

/** Whether a construction year is a plausible, non-future year. */
export function isValidConstructionYear(year: number, currentYear = new Date().getFullYear()): boolean {
  return !isNaN(year) && year >= MIN_CONSTRUCTION_YEAR && year <= currentYear;
}
