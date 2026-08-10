// ---------------------------------------------------------------------------
// Shared display-layer helpers for QuickCheckOverview rows — used by both the
// Ersteinschätzungen overview (detailCheck = false) and the Detailbewertungen
// overview (detailCheck = true), which render the same underlying data with
// the same cells (KPF badge, condition tag, portal-ID link, ...).
//
// The non-JSX pieces (entry mapping, condition/status maps, form validation)
// live in @/lib/quickCheck/display and are re-exported below so every
// existing import of this module keeps working — they're split out only so
// that logic is importable from plain .test.ts files (see
// lib/quickCheck/display.ts) and lives alongside the rest of the Quick
// Check business logic (kpf.ts, validation.ts) instead of under components/.
// ---------------------------------------------------------------------------

import { classifyKpf } from '@/lib/quickCheck/kpf';

export * from '@/lib/quickCheck/display';

// ── KPF badge — coloured pill ───────────────────────────────────────────────
// Colour is driven by classifyKpf() (lib/quickCheck/kpf.ts) — the same classification
// KpfAssessmentCard's description text uses — so the badge and the prose
// description of a given KPF value can never disagree with each other.

export function KpfBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground">—</span>;

  const { label } = classifyKpf(value);
  const color =
    label === 'Sehr teuer'
      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      : label === 'Hochpreisig'
      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';

  return (
    <span className={`inline-flex items-center justify-center font-semibold rounded-lg px-2.5 py-1 text-sm min-w-[3rem] ${color}`}>
      {value.toFixed(1).replace(/\.0$/, '')}
    </span>
  );
}
