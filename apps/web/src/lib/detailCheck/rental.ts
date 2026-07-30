import { roundCurrency } from './acquisitionCosts';

export type RentalField = 'allocable' | 'nonAllocable' | 'total';

export function currentMonthDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

export function normalizeMonthInput(value: string): string {
  return value ? `${value}-01` : currentMonthDate();
}

export function monthFromDate(value: string): string {
  return value.slice(0, 7);
}

export function serviceChargesMismatch(
  allocable: number,
  nonAllocable: number,
  total: number,
): boolean {
  return Math.abs(roundCurrency(allocable + nonAllocable) - roundCurrency(total)) > 0.01;
}

export function applyServiceChargeSuggestion(
  values: { allocable: string; nonAllocable: string; total: string },
  changed: RentalField,
  parse: (value: string) => number,
): { allocable: string; nonAllocable: string; total: string } {
  const next = { ...values };
  const allocable = parse(next.allocable);
  const nonAllocable = parse(next.nonAllocable);
  const total = parse(next.total);

  if (changed !== 'total') {
    const sum = roundCurrency(allocable + nonAllocable);
    next.total = !next.allocable && !next.nonAllocable
      ? ''
      : String(sum).replace('.', ',');
    return next;
  }

  if (changed === 'total' && next.total && !next.allocable && !next.nonAllocable) {
    next.allocable = String(roundCurrency(total * 0.6)).replace('.', ',');
    next.nonAllocable = String(roundCurrency(total * 0.4)).replace('.', ',');
    return next;
  }

  return next;
}
