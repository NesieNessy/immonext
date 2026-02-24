import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
