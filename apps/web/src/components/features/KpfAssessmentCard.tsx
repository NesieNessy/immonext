import { Icons } from '@/components/common/Icons';
import { Tile } from '@/components/ui/Tile';
import { FieldLabels } from '@/constants/FieldLabels';
import type { KpfRangeResult } from '@/lib/supabase/kpf_ranges.supabase';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Props {
  street:             string;
  postalCode:         string;
  city:               string;
  purchasePrice:      number;
  coldRent:           number;
  condition:          string;
  yearOfConstruction: string | number;
  kpf:                number | null;
  range:              KpfRangeResult | null;
  positionPct:        number | null;
  isLoading:          boolean;
  noData:             boolean;
  className?:         string;
}

/** Plain-language verdict for where the KPF sits within the comparison corridor. */
function getEinschaetzung(kpf: number, clampedPct: number): string {
  if (clampedPct <= 15) {
    return `Der Faktor von ${kpf.toFixed(1)} liegt am unteren Rand des Marktbereichs. ` +
      `Möglicherweise ein günstiger Kauf – Zustand, Lage und Mietpotenzial sollten dennoch genau geprüft werden.`;
  }
  if (clampedPct >= 85) {
    return `Der Faktor von ${kpf.toFixed(1)} liegt am oberen Rand des Marktbereichs. ` +
      `Der Kaufpreis ist im Vergleich eher hoch – Rendite und Wertsteigerungspotenzial sollten besonders sorgfältig geprüft werden.`;
  }
  return `Der Faktor von ${kpf.toFixed(1)} liegt im typischen Marktbereich. ` +
    `Lage, Mietpotenzial und Nebenkosten sollten vor einer Entscheidung geprüft werden.`;
}

export function KpfAssessmentCard({
  street, postalCode, city, purchasePrice, coldRent, condition, yearOfConstruction,
  kpf, range, positionPct, isLoading, noData, className,
}: Props) {
  const rendite = purchasePrice > 0 ? (coldRent * 12 / purchasePrice) * 100 : null;
  const clampedPct = positionPct === null ? null : Math.min(100, Math.max(0, positionPct));
  const hasRange = !noData && !!range && clampedPct !== null;

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Address line */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Icons.MapPin className="w-4 h-4 shrink-0" />
        <span>{`${street}, ${postalCode} ${city}`}</span>
      </div>

      {isLoading && (
        <div className="h-32 rounded-lg bg-muted animate-pulse" />
      )}

      {!isLoading && kpf !== null && (
        <>
          {/* Amber assessment banner */}
          <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
            <Icons.AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Marktüblicher Kaufpreisfaktor</p>
              <p className="text-sm text-amber-800 mt-0.5">
                Faktor {kpf.toFixed(1)}
                {rendite !== null && ` · Rendite ${rendite.toFixed(2)} % p.a.`}
              </p>
            </div>
          </div>

          {/* Stat grid */}
          <Tile title="">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {FieldLabels.AcquisitionCosts.PurchasePrice.de}
                </p>
                <p className="text-sm font-semibold text-foreground">{purchasePrice.toLocaleString('de-DE')} €</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {FieldLabels.Tenancy.ColdRent.de} / Monat
                </p>
                <p className="text-sm font-semibold text-foreground">{coldRent.toLocaleString('de-DE')} €</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Zustand</p>
                <p className="text-sm font-semibold text-foreground">{condition || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {FieldLabels.Property.YearOfConstruction.de}
                </p>
                <p className="text-sm font-semibold text-foreground">{yearOfConstruction || '—'}</p>
              </div>
            </div>
          </Tile>

          {/* Factor value + simplified corridor bar */}
          {hasRange && range && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Kaufpreisfaktor
                </span>
                <span className="text-2xl font-semibold text-foreground">{kpf.toFixed(1)}</span>
              </div>

              <div className="relative h-3 w-full rounded-full overflow-visible">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{ background: 'linear-gradient(to right, #22c55e, #84cc16, #eab308, #f97316, #ef4444)' }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white
                             border-2 border-foreground shadow-md"
                  style={{ left: `${clampedPct}%` }}
                  title={`Dein KPF: ${kpf.toFixed(1)}`}
                />
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">{range.minValue.toFixed(0)}</span>
                <span className="text-xs text-muted-foreground">{range.maxValue.toFixed(0)}</span>
              </div>
            </div>
          )}

          {/* Recommendation */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1">Einschätzung</h3>
            {!hasRange || clampedPct === null ? (
              <p className="text-sm text-muted-foreground">
                Keine Vergleichsdaten gefunden.{' '}
                <Link href="/property-valuation/detail-check" className="text-primary underline underline-offset-2">
                  Detailbewertung starten
                </Link>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">{getEinschaetzung(kpf, clampedPct)}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
