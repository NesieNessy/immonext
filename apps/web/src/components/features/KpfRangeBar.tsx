import type { KpfRangeResult } from '@/lib/supabase/kpf_ranges.supabase';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Props {
  kpf:         number | null;
  range:       KpfRangeResult | null;
  positionPct: number | null;
  isLoading:   boolean;
  noData:      boolean;
  className?:  string;
}

export function KpfRangeBar({ kpf, range, positionPct, isLoading, noData, className }: Props) {

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-foreground">Kaufpreisfaktor (KPF)</span>
          <span className="text-sm font-semibold text-foreground animate-pulse">…</span>
        </div>
        <div className="h-8 rounded-full bg-muted animate-pulse" />
        <div className="flex justify-between mt-1">
          <span className="text-xs text-muted-foreground">—</span>
          <span className="text-xs text-muted-foreground">—</span>
        </div>
      </div>
    );
  }

  // ── No range data (DB miss) ───────────────────────────────────────────────
  if (noData) {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        {kpf !== null && (
          <div className="flex items-center justify-between">
            <span
              className="text-xs font-medium text-foreground underline decoration-dotted underline-offset-2 cursor-help"
              title="Kaufpreis ÷ Jahreskaltmiete. Je niedriger, desto günstiger im Verhältnis zur Miete."
            >
              Kaufpreisfaktor (KPF)
            </span>
            <span className="text-sm font-semibold text-foreground">{kpf.toFixed(1)}</span>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Keine Vergleichsdaten gefunden.{' '}
          <Link href="/property-valuation/detail-check" className="text-primary underline underline-offset-2">
            Detailbewertung starten
          </Link>
        </p>
      </div>
    );
  }

  // ── Nothing to show yet ───────────────────────────────────────────────────
  if (kpf === null || range === null || positionPct === null) {
    return null;
  }

  const clampedPct = Math.min(100, Math.max(0, positionPct));

  // ── Full bar — same structure as RatingScale ──────────────────────────────
  return (
    <div className={cn('w-full', className)}>

      {/* Header: label (with tooltip) + KPF value */}
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-xs font-medium text-foreground underline decoration-dotted underline-offset-2 cursor-help"
          title="Kaufpreis ÷ Jahreskaltmiete. Je niedriger, desto günstiger im Verhältnis zur Miete."
        >
          Kaufpreisfaktor (KPF)
        </span>
        <span className="text-sm font-semibold text-foreground">{kpf.toFixed(1)}</span>
      </div>

      {/* Scale bar */}
      <div className="relative h-8 w-full rounded-full overflow-visible">

        {/* Corridor track */}
        <div
          className="absolute inset-0 rounded-full bg-muted"
        />
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'linear-gradient(to right, #22c55e, #84cc16, #eab308, #f97316, #ef4444)',
          }}
          title="Zeigt den üblichen Bereich für ähnliche Objekte (PLZ, Zustand, Baujahr)."
        />

        {/* Marker + tooltip — identical pattern to RatingScale */}
        <div
          className="absolute top-0 -translate-x-1/2"
          style={{ left: `${clampedPct}%` }}
        >
          {/* Popover tooltip */}
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <div className="bg-popover text-popover-foreground text-xs font-medium px-2 py-1 rounded border border-border shadow-md">
              Dein KPF: {kpf.toFixed(1)}
            </div>
            {/* Arrow */}
            <div className="w-2 h-2 bg-popover border-b border-r border-border rotate-45 mx-auto -mt-[5px]" />
          </div>
          {/* Marker line */}
          <div className="w-0.5 h-8 bg-white shadow-md" />
        </div>

      </div>

      {/* Min / Max labels */}
      <div className="flex justify-between mt-1">
        <span
          className="text-xs text-muted-foreground cursor-help"
          title="Untere Grenze des Vergleichskorridors"
        >
          {range.minValue.toFixed(1)}
        </span>
        <span
          className="text-xs text-muted-foreground underline decoration-dotted underline-offset-2 cursor-help"
          title="Zeigt den üblichen Bereich für ähnliche Objekte (PLZ, Zustand, Baujahr)."
        >
          Vergleichskorridor
        </span>
        <span
          className="text-xs text-muted-foreground cursor-help"
          title="Obere Grenze des Vergleichskorridors"
        >
          {range.maxValue.toFixed(1)}
        </span>
      </div>

      {/* Legend + fallback hint */}
      <p className="text-xs text-muted-foreground text-center mt-1">
        <span
          className="font-medium text-foreground cursor-help"
          title="Links = günstiger, rechts = teurer innerhalb der Range."
        >
          Dein Marker
        </span>
        {' – '}Links = günstiger, rechts = teurer.
        {range.fallbackHint && (
          <span className="block mt-0.5 italic">{range.fallbackHint}</span>
        )}
      </p>

    </div>
  );
}
