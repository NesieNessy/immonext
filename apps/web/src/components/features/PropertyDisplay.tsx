// ---------------------------------------------------------------------------
// Shared display-layer helpers for the Bestandsobjekte overview — property
// category labels/tag colors/filter options (sourced from
// detail_check_property_data's propertyCategory, itself defined in the
// detail-check property-data form), rental-status filter options, and a
// rotating card accent-color palette.
// ---------------------------------------------------------------------------

import type { TagVariant } from '@/components/ui';

/** Mirrors propertyCategoryOptions in detail-check/property-data/page.tsx —
 *  property_category is free TEXT, not a DB enum, so this is just the known
 *  set of values that form can write. An unrecognized value still displays
 *  (falls back to the raw value) rather than being hidden. */
export const PROPERTY_CATEGORY_LABEL: Record<string, string> = {
  EIGENTUMSWOHNUNG: 'Eigentumswohnung',
  EINFAMILIENHAUS: 'Einfamilienhaus',
  MEHRFAMILIENHAUS: 'Mehrfamilienhaus',
  HOLZBAUWEISE: 'Holzbauweise',
  DENKMALGESCHUETZT: 'Denkmalgeschützt',
};

export const PROPERTY_CATEGORY_VARIANT: Record<string, TagVariant> = {
  EIGENTUMSWOHNUNG: 'info',
  EINFAMILIENHAUS: 'success',
  MEHRFAMILIENHAUS: 'purple',
  HOLZBAUWEISE: 'orange',
  DENKMALGESCHUETZT: 'violet',
};

export const PROPERTY_CATEGORY_FILTER_OPTIONS = Object.entries(PROPERTY_CATEGORY_LABEL).map(
  ([value, label]) => ({ value, label })
);

export const RENTAL_STATUS_FILTER_OPTIONS = [
  { value: 'vermietet', label: 'Vermietet' },
  { value: 'unvermietet', label: 'Unvermietet' },
];

// Rotates by card position — not tied to category (properties of the same
// category shouldn't all look visually identical in the grid).
const CARD_COLOR_PALETTE = [
  'bg-blue-500',
  'bg-orange-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-red-500',
  'bg-teal-500',
];

export function getPropertyCardColor(index: number): string {
  return CARD_COLOR_PALETTE[index % CARD_COLOR_PALETTE.length];
}
