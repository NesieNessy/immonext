// ---------------------------------------------------------------------------
// Shared display-layer helpers for QuickCheckOverview rows — used by both the
// quick-check overview (detailCheck = false) and the detail-check
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
      ? 'bg-destructive/15 text-destructive'
      : label === 'Hochpreisig'
      ? 'bg-warning/15 text-warning'
      : 'bg-success/15 text-success';

  return (
    <span className={`inline-flex items-center justify-center font-semibold rounded-lg px-2.5 py-1 text-sm min-w-[3rem] ${color}`}>
      {value.toFixed(1).replace(/\.0$/, '')}
    </span>
  );
}
