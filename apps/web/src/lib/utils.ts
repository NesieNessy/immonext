import { clsx, type ClassValue } from "clsx";
import { format } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Plain number, German locale (e.g. "50" or "2,5"). */
export const deNumberFormatter = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

/** Whole-euro amount, German locale (e.g. "1.200") — pair with a trailing "€". */
export const deCurrencyFormatter = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

/** "dd.MM.yyyy", falling back to "–" for null/undefined. */
export function formatDeDate(value: string | null | undefined): string {
  if (!value) return '–';
  return format(new Date(value), 'dd.MM.yyyy');
}

/**
 * Converts a raw base64 image string (as stored in `image_base64` DB column)
 * to a usable `data:` URI for <img src>.
 * Returns null if the input is falsy.
 */
export function base64ToDataUri(base64: string | null | undefined): string | null {
  if (!base64) return null;
  // Already a data URI (e.g. "data:image/jpeg;base64,...")
  if (base64.startsWith('data:')) return base64;
  // Detect image type from the base64 prefix bytes
  let mime = 'image/jpeg';
  if (base64.startsWith('/9j/'))       mime = 'image/jpeg';
  else if (base64.startsWith('iVBOR')) mime = 'image/png';
  else if (base64.startsWith('R0lGO')) mime = 'image/gif';
  else if (base64.startsWith('UklGR')) mime = 'image/webp';
  return `data:${mime};base64,${base64}`;
}
