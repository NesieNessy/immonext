// ---------------------------------------------------------------------------
// Quick Check display/validation logic — row→entry mapping, condition/status
// maps, and the create/edit form's validation rules. Re-exported from
// components/features/QuickCheckDisplay.tsx (which adds the one JSX piece,
// KpfBadge) so existing imports of that module keep working. Kept as plain
// .ts (no JSX) so it's importable from .test.ts files — the app's vitest
// config runs in a JSX-free node environment on purpose (see
// vitest.config.mts).
// ---------------------------------------------------------------------------

import type { TagVariant } from '@/components/ui';
import type { QuickCheckOverview } from '@/lib/supabase/quick_check.supabase';
import { isValidConstructionYear } from './validation';
import { PropertyCondition } from '@immonext/types';

export interface QuickCheckEntry extends Record<string, unknown> {
  id: number;
  /** Raw ISO timestamp — not displayed, only used as the default sort key
   *  (ISO 8601 strings sort correctly lexicographically; a reformatted
   *  dd.MM.yy string would not, across month/year boundaries). */
  ingestDate: string;
  portalId: string;
  kpfMultiplier: number | null;
  purchasePrice: number;
  postalCode: string;
  constructionYear: number;
  condition: PropertyCondition;
  detailCheck: boolean;
  status: 'aktiv' | 'inaktiv';
  recommendationScore: number | null;
  recommendationLevel: string | null;
}

export const MANUAL_ENTRY_LABEL = 'Manuelle Erfassung';

export function toEntry(row: QuickCheckOverview): QuickCheckEntry {
  return {
    id:               row.quickCheckId,
    ingestDate:       row.ingestDate,
    portalId:         row.portalId ?? MANUAL_ENTRY_LABEL,
    kpfMultiplier:    row.kpfMultiplier,
    purchasePrice:    row.purchasePrice,
    postalCode:       row.postalCode,
    constructionYear: row.yearOfConstruction,
    condition:        row.condition,
    detailCheck:      row.detailCheck,
    status:           row.status === 'ACTIVE' ? 'aktiv' : 'inaktiv',
    recommendationScore: row.recommendationScore,
    recommendationLevel: row.recommendationLevel,
  };
}

// ── Condition → Tag variant ─────────────────────────────────────────────────

export const conditionVariant: Record<PropertyCondition, TagVariant> = {
  [PropertyCondition.Upscale]:            'purple',
  [PropertyCondition.Standard]:           'teal',
  [PropertyCondition.Luxury]:             'violet',
  [PropertyCondition.InNeedOfRenovation]: 'orange',
};

/** Dropdown options for the create/edit forms — includes a placeholder. */
export const CONDITION_OPTIONS = [
  { value: '', label: 'Bitte auswählen' },
  ...Object.values(PropertyCondition).map((v) => ({ value: v, label: v })),
];

export const CONDITION_FILTER_OPTIONS = Object.values(PropertyCondition).map((v) => ({ value: v, label: v }));
export const STATUS_FILTER_OPTIONS = [
  { value: 'aktiv', label: 'Aktiv' },
  { value: 'inaktiv', label: 'Inaktiv' },
];

/** Shorter labels for the mobile condition-filter pills (limited width). */
export const CONDITION_PILL_LABEL: Record<PropertyCondition, string> = {
  [PropertyCondition.InNeedOfRenovation]: 'Sanierung',
  [PropertyCondition.Standard]:           'Standard',
  [PropertyCondition.Upscale]:            'Gehoben',
  [PropertyCondition.Luxury]:             'Luxus',
};

// Portal import isn't implemented yet — quick_check.portal_id is usually
// just an opaque reference (e.g. "IS24-12345"), not a real URL. This used to
// fabricate a link by cycling through three hardcoded portal domains keyed
// off row.id % 3 — which meant the link's destination had nothing to do
// with what was actually entered, and (for a given id range) could always
// land on the same domain regardless of the real portal. Only link when
// portalId is itself a real, absolute URL the user actually entered/pasted;
// otherwise leave the cell as plain, non-clickable text like manual entries.
export function getPlaceholderPortalUrl(row: QuickCheckEntry): string | null {
  if (row.portalId === MANUAL_ENTRY_LABEL || row.status === 'inaktiv') return null;
  return /^https?:\/\//i.test(row.portalId) ? row.portalId : null;
}

// ── Create/edit form validation — shared by quick-check/new and
//    QuickCheckResultView, whose forms have identical fields and rules. ────

export interface QuickCheckFormFields {
  street: string;
  postalCode: string;
  city: string;
  purchasePrice: string;
  coldRent: string;
  yearOfConstruction: string;
}

/**
 * Per-field validation messages — only populated once a field has been
 * touched (non-empty), so a fresh form doesn't show errors immediately.
 * `purchasePrice`/`coldRent` are passed pre-parsed since callers already
 * need the numeric values for the KPF calculation.
 */
export function getQuickCheckFieldErrors(
  fields: QuickCheckFormFields,
  purchasePrice: number,
  coldRent: number,
  currentYear: number
) {
  return {
    street:
      fields.street.length > 0 && fields.street.trim().length > 120
        ? 'Maximal 120 Zeichen'
        : '',
    postalCode:
      fields.postalCode.length > 0 && !/^\d{5}$/.test(fields.postalCode)
        ? 'Genau 5 Ziffern erforderlich'
        : '',
    city:
      fields.city.length > 0 && fields.city.trim().length > 120
        ? 'Maximal 120 Zeichen'
        : '',
    purchasePrice:
      fields.purchasePrice !== '' && purchasePrice <= 0
        ? 'Muss größer als 0 sein'
        : '',
    coldRent:
      fields.coldRent !== '' && coldRent <= 0
        ? 'Muss größer als 0 sein'
        : '',
    yearOfConstruction:
      fields.yearOfConstruction !== '' && !isValidConstructionYear(parseInt(fields.yearOfConstruction, 10), currentYear)
        ? `Zwischen 1850 und ${currentYear}`
        : '',
  };
}
