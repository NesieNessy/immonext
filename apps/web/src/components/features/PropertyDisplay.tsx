// ---------------------------------------------------------------------------
// Shared display-layer helpers for the Bestandsobjekte overview — property
// category labels/tag colors/filter options (sourced from
// detail_check_property_data's propertyCategory, itself defined in the
// detail-check property-data form), rental-status filter options, and a
// rotating card accent-color palette.
// ---------------------------------------------------------------------------

import type { BreadcrumbItem, TagVariant } from '@/components/ui';

// ---------------------------------------------------------------------------
// Breadcrumb — every property sub-page starts with "Bestandsobjekte" › the
// property's address (linking back to its hub page) › the current use case.
// Shared here so the address-href fix doesn't have to be copy-pasted again.
// ---------------------------------------------------------------------------

export const BESTANDSOBJEKTE_BREADCRUMB_ROOT: BreadcrumbItem = {
  label: 'Bestandsobjekte',
  href: '/existing-properties',
};

export function buildPropertyUseCaseBreadcrumb(
  property: { street: string; houseNumber: string },
  propertyId: string,
  currentLabel: string,
): BreadcrumbItem[] {
  return [
    BESTANDSOBJEKTE_BREADCRUMB_ROOT,
    { label: `${property.street} ${property.houseNumber}`, href: `/existing-properties/${propertyId}` },
    { label: currentLabel },
  ];
}

/** Shared "property not found" fallback for the use-case sub-pages. */
export function PropertyNotFoundPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Objekt nicht gefunden</p>
      </main>
    </div>
  );
}

/** Shared "still loading" fallback, matching PropertyNotFoundPage's usage. */
export function PropertyLoadingPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-sm text-muted-foreground">Wird geladen…</p>
    </div>
  );
}

/** property_category is free TEXT, not a DB enum — this is the known set of
 *  values written across the app (detail-check/property-data's form plus
 *  the wider set offered on the property-creation form). An unrecognized
 *  value still displays (falls back to the raw value) rather than being
 *  hidden. */
export const PROPERTY_CATEGORY_LABEL: Record<string, string> = {
  EIGENTUMSWOHNUNG: 'Eigentumswohnung',
  EINFAMILIENHAUS: 'Einfamilienhaus',
  MEHRFAMILIENHAUS: 'Mehrfamilienhaus',
  DOPPELHAUS: 'Doppelhaus',
  GEWERBE: 'Gewerbe',
  GRUNDSTUECK: 'Grundstück',
  HOLZBAUWEISE: 'Holzbauweise',
  DENKMALGESCHUETZT: 'Denkmalgeschützt',
};

export const PROPERTY_CATEGORY_VARIANT: Record<string, TagVariant> = {
  EIGENTUMSWOHNUNG: 'info',
  EINFAMILIENHAUS: 'success',
  MEHRFAMILIENHAUS: 'purple',
  DOPPELHAUS: 'teal',
  GEWERBE: 'warning',
  GRUNDSTUECK: 'muted',
  HOLZBAUWEISE: 'orange',
  DENKMALGESCHUETZT: 'violet',
};

export const PROPERTY_CATEGORY_FILTER_OPTIONS = Object.entries(PROPERTY_CATEGORY_LABEL).map(
  ([value, label]) => ({ value, label })
);

/** The options offered on the property-creation and property-data-edit
 *  forms — every value in PROPERTY_CATEGORY_LABEL, so a previously saved
 *  category always has a matching pill to show as selected. */
export const PROPERTY_CATEGORY_CREATE_OPTIONS = [
  'EIGENTUMSWOHNUNG',
  'EINFAMILIENHAUS',
  'MEHRFAMILIENHAUS',
  'DOPPELHAUS',
  'GEWERBE',
  'GRUNDSTUECK',
  'HOLZBAUWEISE',
  'DENKMALGESCHUETZT',
].map((value) => ({ value, label: PROPERTY_CATEGORY_LABEL[value] }));

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
