// ---------------------------------------------------------------------------
// Shared display-layer helpers for QuickCheckOverview rows — used by both the
// Ersteinschätzungen overview (detailCheck = false) and the Detailbewertungen
// overview (detailCheck = true), which render the same underlying data with
// the same cells (KPF badge, condition tag, portal-ID link, ...).
// ---------------------------------------------------------------------------

import type { TagVariant } from '@/components/ui';
import type { QuickCheckOverview } from '@/lib/supabase/quick_check.supabase';
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

// ── KPF badge — coloured pill ───────────────────────────────────────────────

export function KpfBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground">—</span>;

  const color =
    value <= 20
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      : value <= 30
      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';

  return (
    <span className={`inline-flex items-center justify-center font-semibold rounded-lg px-2.5 py-1 text-sm min-w-[3rem] ${color}`}>
      {value.toFixed(1).replace(/\.0$/, '')}
    </span>
  );
}

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

// Portal import isn't implemented yet — quick_check.portal_id is just an
// opaque reference, not a real URL. Until the import flow exists, link
// each portal-sourced row to a placeholder expose page (deterministic per
// row, so the link doesn't change on re-render) instead of leaving the
// Portal-ID cell unclickable.
const PLACEHOLDER_PORTAL_DOMAINS = [
  'https://www.immobilienscout24.de/expose',
  'https://www.immowelt.de/expose',
  'https://www.immonet.de/expose',
];

export function getPlaceholderPortalUrl(row: QuickCheckEntry): string | null {
  if (row.portalId === MANUAL_ENTRY_LABEL || row.status === 'inaktiv') return null;
  const domain = PLACEHOLDER_PORTAL_DOMAINS[row.id % PLACEHOLDER_PORTAL_DOMAINS.length];
  return `${domain}/${encodeURIComponent(row.portalId)}`;
}
