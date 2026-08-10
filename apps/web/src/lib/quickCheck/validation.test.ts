import { describe, expect, it } from 'vitest';
import { isValidConstructionYear, MIN_CONSTRUCTION_YEAR } from './validation';

describe('isValidConstructionYear', () => {
  it('accepts a plausible year within range', () => {
    expect(isValidConstructionYear(1990, 2026)).toBe(true);
  });

  it('accepts the lower bound (1850) and rejects the year before it', () => {
    expect(isValidConstructionYear(MIN_CONSTRUCTION_YEAR, 2026)).toBe(true);
    expect(isValidConstructionYear(MIN_CONSTRUCTION_YEAR - 1, 2026)).toBe(false);
  });

  it('accepts the current year but rejects anything in the future', () => {
    expect(isValidConstructionYear(2026, 2026)).toBe(true);
    expect(isValidConstructionYear(2027, 2026)).toBe(false);
  });

  it('rejects NaN', () => {
    expect(isValidConstructionYear(NaN, 2026)).toBe(false);
  });

  it('defaults currentYear to the real current year when omitted', () => {
    const currentYear = new Date().getFullYear();
    expect(isValidConstructionYear(currentYear)).toBe(true);
    expect(isValidConstructionYear(currentYear + 1)).toBe(false);
  });
});
