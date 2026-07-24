"use client";

import { Button, Dropdown, StickyActionBar, TextField } from '@/components/ui';
import { BUTTON_DETAILS } from '@/constants/ButtonLabels';
import { authFetch } from '@/lib/api/authFetch';
import { parseDecimalInput } from '@/lib/detailCheck/acquisitionCosts';
import { CALCULATION_HORIZON_YEARS, type CalculatorMode, type ModernizationPlanRow, type PlacementMode, type RentIndexSource, type RentIncrease558Row, type RentTimelineRow } from '@/lib/detailCheck/rentCalculator';
import { ChevronDown, ChevronUp, LineChart, Sparkles } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { PropertyValuationLayout } from '../PropertyValuationLayout';

type CalculatorResponse = {
  params: {
    startYyyymm: string;
    monthlyRentStart: number;
    livingAreaM2: number;
    city: string;
    postalCode: string;
    last558Date: string | null;
    last559Date: string | null;
    rentIndexPerM2: number | null;
    rentIndexSource: RentIndexSource;
    monthlyDebtService: number;
    mode: CalculatorMode;
    placementMode: PlacementMode;
  };
  selectedFinancingVariant: 'OFFER' | 'INDIVIDUAL';
  denseMarket: boolean;
  capPercent: number;
  capPerM2: number;
  capAbs: number;
  timeline: RentTimelineRow[];
  modernizationPlan: ModernizationPlanRow[];
  increases558: RentIncrease558Row[];
  breakEven: string | null;
  breakEvenWithRentIndex: string | null;
  placementMode: PlacementMode;
  rentIndexSource: 'MANUAL' | 'AUTOMATIC';
  metrics: {
    grossYieldToday: number;
    netYieldToday: number;
    cashflowToday: number;
    afterTaxCashflowToday: number;
    rentAtHorizon: number;
    rentAtHorizonWithRentIndex: number;
    endingCashflow: number;
    endingCashflowWithRentIndex: number;
  };
};

const currencyFormatter = new Intl.NumberFormat('de-DE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const numberFormatter = new Intl.NumberFormat('de-DE', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function formatCurrency(value: number): string {
  return `${currencyFormatter.format(value)} €`;
}

function formatPercent(value: number): string {
  return `${numberFormatter.format(value * 100)} %`;
}

function formatPercentValue(value: number): string {
  return `${numberFormatter.format(value)} %`;
}

function valueString(value: number | null | undefined): string {
  if (value == null) return '';
  return String(value).replace('.', ',');
}

function ReadOnlyValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-1 text-xs text-muted-foreground">{label}</div>
      <div className="rounded-lg border border-border bg-muted px-4 py-2 font-medium text-foreground">{value}</div>
    </div>
  );
}

type ChartRow = RentTimelineRow & { afterTaxCumulative: number };

function roundChartValue(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function buildChartRows(rows: RentTimelineRow[]): ChartRow[] {
  let afterTaxCumulative = 0;
  return rows.map((row) => {
    afterTaxCumulative = roundChartValue(afterTaxCumulative + row.afterTaxCashflow);
    return { ...row, afterTaxCumulative };
  });
}

function chartPath(
  values: number[],
  min: number,
  max: number,
  left: number,
  top: number,
  width: number,
  height: number,
): string {
  const range = max - min || 1;
  return values.map((value, index) => {
    const x = left + (values.length <= 1 ? 0 : (index / (values.length - 1)) * width);
    const y = top + height - ((value - min) / range) * height;
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(' ');
}

function formatAxisCurrency(value: number): string {
  const absolute = Math.abs(value);
  if (absolute >= 1000) return `${numberFormatter.format(value / 1000)}k €`;
  return `${numberFormatter.format(value)} €`;
}

function CalculatorChart({ rows, showRentIndex }: { rows: ChartRow[]; showRentIndex: boolean }) {
  const width = 980;
  const left = 76;
  const right = 24;
  const plotWidth = width - left - right;
  const top = { y: 56, height: 170 };
  const bottom = { y: 316, height: 170 };
  const monthlyValues = rows.flatMap((row) => [row.income, row.expenses, ...(showRentIndex ? [row.rentTotalWithRentIndex] : [])]);
  const monthlyMax = Math.max(1, ...monthlyValues) * 1.08;
  const afterTaxValues = rows.map((row) => row.afterTaxCumulative);
  const afterTaxMin = Math.min(0, ...afterTaxValues);
  const afterTaxMax = Math.max(0, ...afterTaxValues);
  const afterTaxPadding = Math.max(1, (afterTaxMax - afterTaxMin) * 0.08);
  const afterTaxDomain = { min: afterTaxMin - afterTaxPadding, max: afterTaxMax + afterTaxPadding };
  const xAt = (index: number) => left + (rows.length <= 1 ? 0 : (index / (rows.length - 1)) * plotWidth);
  const yMonthly = (value: number) => top.y + top.height - (value / monthlyMax) * top.height;
  const yAfterTax = (value: number) => bottom.y + bottom.height - ((value - afterTaxDomain.min) / (afterTaxDomain.max - afterTaxDomain.min)) * bottom.height;
  const zeroY = yAfterTax(0);
  const breakEvenIndex = rows.findIndex((row) => row.afterTaxCumulative >= 0);
  const eventRows = rows.filter((row) => row.renovationPayment > 0);
  const axisIndexes = [0, 0.25, 0.5, 0.75, 1].map((ratio) => Math.min(rows.length - 1, Math.round(ratio * Math.max(0, rows.length - 1))));

  if (rows.length === 0) {
    return <p className="rounded-lg border border-border px-4 py-6 text-sm text-muted-foreground">Noch keine Zeitreihe verfügbar.</p>;
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-lg font-medium text-foreground">Entwicklung über {CALCULATION_HORIZON_YEARS} Jahre</div>
          <div className="text-sm text-muted-foreground">Monatliche Werte und kumulierter Cashflow nach Steuern</div>
        </div>
        {breakEvenIndex >= 0 ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-foreground">
            Break-even nach Steuern: <strong>{rows[breakEvenIndex].yyyymm}</strong>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">Break-even im Zeitraum nicht erreicht</div>
        )}
      </div>

      <div>
        <svg className="h-auto w-full" viewBox={`0 0 ${width} 535`} role="img" aria-labelledby="calculator-chart-title calculator-chart-description">
          <title id="calculator-chart-title">Mieteinnahmen, Ausgaben und Cashflow über {CALCULATION_HORIZON_YEARS} Jahre</title>
          <desc id="calculator-chart-description">Oben werden Mieteinnahmen und Ausgaben je Monat gezeigt. Unten wird der kumulierte Cashflow nach Steuern angezeigt. Sanierungszahlungen sind als Markierungen im oberen Diagramm sichtbar.</desc>

          <text x={left} y="25" className="fill-foreground text-sm font-medium">Monatliche Entwicklung</text>
          <text x="10" y={top.y + 5} className="fill-muted-foreground text-xs">{formatAxisCurrency(monthlyMax)}</text>
          <text x="28" y={top.y + top.height + 4} className="fill-muted-foreground text-xs">0 €</text>
          {[0, 0.5, 1].map((ratio) => (
            <line key={`monthly-grid-${ratio}`} x1={left} x2={left + plotWidth} y1={top.y + ratio * top.height} y2={top.y + ratio * top.height} className="stroke-border" strokeWidth="1" />
          ))}
          <line x1={left} x2={left} y1={top.y} y2={top.y + top.height} className="stroke-muted-foreground" strokeWidth="1" />
          <line x1={left} x2={left + plotWidth} y1={top.y + top.height} y2={top.y + top.height} className="stroke-muted-foreground" strokeWidth="1" />
          <path d={chartPath(rows.map((row) => row.income), 0, monthlyMax, left, top.y, plotWidth, top.height)} fill="none" className="stroke-primary" strokeWidth="3" />
          <path d={chartPath(rows.map((row) => row.expenses), 0, monthlyMax, left, top.y, plotWidth, top.height)} fill="none" className="stroke-destructive" strokeWidth="3" strokeDasharray="8 5" />
          {showRentIndex && <path d={chartPath(rows.map((row) => row.rentTotalWithRentIndex), 0, monthlyMax, left, top.y, plotWidth, top.height)} fill="none" className="stroke-accent-foreground" strokeWidth="2" strokeDasharray="3 4" />}
          {eventRows.map((row) => {
            const index = rows.indexOf(row);
            const x = xAt(index);
            return (
              <g key={`event-${row.yyyymm}`}>
                <line x1={x} x2={x} y1={top.y + 12} y2={top.y + top.height} className="stroke-destructive/40" strokeWidth="1" strokeDasharray="3 4" />
                <circle cx={x} cy={yMonthly(row.expenses)} r="4" className="fill-destructive" stroke="var(--card)" strokeWidth="2">
                  <title>{`Sanierungszahlung ${row.yyyymm}: ${formatCurrency(row.renovationPayment)}`}</title>
                </circle>
              </g>
            );
          })}

          <text x={left} y="285" className="fill-foreground text-sm font-medium">Kumulierter Cashflow nach Steuern</text>
          <text x="2" y={bottom.y + 5} className="fill-muted-foreground text-xs">{formatAxisCurrency(afterTaxDomain.max)}</text>
          <text x="8" y={zeroY + 4} className="fill-destructive text-xs">0 €</text>
          <text x="2" y={bottom.y + bottom.height + 4} className="fill-muted-foreground text-xs">{formatAxisCurrency(afterTaxDomain.min)}</text>
          {[afterTaxDomain.max, 0, afterTaxDomain.min].map((value) => (
            <line key={`cash-grid-${value}`} x1={left} x2={left + plotWidth} y1={yAfterTax(value)} y2={yAfterTax(value)} className={value === 0 ? 'stroke-destructive' : 'stroke-border'} strokeWidth={value === 0 ? 1.5 : 1} strokeDasharray={value === 0 ? '5 4' : undefined} />
          ))}
          <line x1={left} x2={left} y1={bottom.y} y2={bottom.y + bottom.height} className="stroke-muted-foreground" strokeWidth="1" />
          <path d={chartPath(afterTaxValues, afterTaxDomain.min, afterTaxDomain.max, left, bottom.y, plotWidth, bottom.height)} fill="none" className="stroke-accent-foreground" strokeWidth="3" />
          {breakEvenIndex >= 0 && (
            <g>
              <line x1={xAt(breakEvenIndex)} x2={xAt(breakEvenIndex)} y1={bottom.y} y2={bottom.y + bottom.height} className="stroke-destructive" strokeWidth="1.5" strokeDasharray="5 4" />
              <circle cx={xAt(breakEvenIndex)} cy={zeroY} r="5" className="fill-destructive" stroke="var(--card)" strokeWidth="2">
                <title>{`Break-even nach Steuern: ${rows[breakEvenIndex].yyyymm}`}</title>
              </circle>
            </g>
          )}
          {axisIndexes.map((index) => (
            <text key={`axis-${index}`} x={xAt(index)} y="525" textAnchor={index === 0 ? 'start' : index === rows.length - 1 ? 'end' : 'middle'} className="fill-muted-foreground text-xs">{rows[index].yyyymm}</text>
          ))}
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2"><span className="h-0.5 w-6 bg-primary" />Mieteinnahmen</span>
        <span className="inline-flex items-center gap-2"><span className="h-0.5 w-6 border-t-2 border-dashed border-destructive" />Ausgaben</span>
        {showRentIndex && <span className="inline-flex items-center gap-2"><span className="h-0.5 w-6 border-t-2 border-dotted border-accent-foreground" />Mietspiegel-Szenario</span>}
        <span className="inline-flex items-center gap-2"><span className="h-0.5 w-6 bg-accent-foreground" />Cashflow nach Steuern</span>
        {eventRows.length > 0 && <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-destructive" />Sanierungszahlung</span>}
      </div>
    </div>
  );
}

function TableToggle({ label, open, onClick }: { label: string; open: boolean; onClick: () => void }) {
  return (
    <Button
      label={open ? `${label} ausblenden` : `${label} anzeigen`}
      variant="outline"
      size="sm"
      icon={open ? <ChevronUp /> : <ChevronDown />}
      aria-expanded={open}
      onClick={onClick}
    />
  );
}

function CalculatorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quickCheckId = searchParams.get('quickCheckId');
  const workflowId = searchParams.get('workflowId');
  const suffix = quickCheckId ? `?quickCheckId=${encodeURIComponent(quickCheckId)}` : workflowId ? `?workflowId=${encodeURIComponent(workflowId)}` : '';

  const [data, setData] = useState<CalculatorResponse | null>(null);
  const [startYyyymm, setStartYyyymm] = useState('');
  const [monthlyRentStart, setMonthlyRentStart] = useState('');
  const [rentIndexPerM2, setRentIndexPerM2] = useState('');
  const [rentIndexSource, setRentIndexSource] = useState<RentIndexSource>('AUTOMATIC');
  const [last558Date, setLast558Date] = useState('');
  const [last559Date, setLast559Date] = useState('');
  const [mode, setMode] = useState<CalculatorMode>('KNOWN');
  const [placementMode, setPlacementMode] = useState<PlacementMode>('DEFAULT');
  const [showRentIndexComparison, setShowRentIndexComparison] = useState(false);
  const [openTables, setOpenTables] = useState({
    timeline: false,
    modernization: false,
    increases: false,
    cashflow: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visibleTimeline = useMemo(() => data?.timeline ?? [], [data]);
  const chartRows = useMemo(() => buildChartRows(visibleTimeline), [visibleTimeline]);

  const toggleTable = (table: keyof typeof openTables) => {
    setOpenTables((current) => ({ ...current, [table]: !current[table] }));
  };

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await authFetch(`/api/detail-check/calculator${suffix}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(await res.text());
        const loaded = await res.json() as CalculatorResponse;
        if (cancelled) return;
        setData(loaded);
        setStartYyyymm(loaded.params.startYyyymm);
        setMonthlyRentStart(valueString(loaded.params.monthlyRentStart));
        setRentIndexPerM2(valueString(loaded.params.rentIndexPerM2));
        setRentIndexSource(loaded.params.rentIndexSource ?? loaded.rentIndexSource ?? 'AUTOMATIC');
        setLast558Date(loaded.params.last558Date ?? '');
        setLast559Date(loaded.params.last559Date ?? '');
        setMode(loaded.params.mode);
        setPlacementMode(loaded.placementMode ?? loaded.params.placementMode ?? 'DEFAULT');
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Kalkulator konnte nicht geladen werden.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [suffix]);

  const recalc = async (nextMode = mode, navigate = false, optimize = false) => {
    if (isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
      const res = await authFetch('/api/detail-check/calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quickCheckId,
          workflowId,
          startYyyymm,
          monthlyRentStart: parseDecimalInput(monthlyRentStart),
          rentIndexPerM2: rentIndexSource === 'AUTOMATIC' || rentIndexPerM2 === '' ? null : parseDecimalInput(rentIndexPerM2),
          rentIndexSource,
          last558Date: last558Date || null,
          last559Date: last559Date || null,
          mode: nextMode,
          optimize,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = await res.json() as CalculatorResponse;
      setData(updated);
      setMode(updated.params.mode);
      setPlacementMode(updated.placementMode ?? 'DEFAULT');
      if (navigate) router.push(`/property-valuation/detail-check/macro-location${suffix}`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Kalkulation konnte nicht gespeichert werden.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleModeChange = (value: string) => {
    const nextMode = value === 'POTENTIAL' ? 'POTENTIAL' : 'KNOWN';
    setMode(nextMode);
    void recalc(nextMode);
  };

  return (
    <PropertyValuationLayout
      currentStep={6}
      title="Mietkalkulator"
      actions={
        <Button
          label="Überspringen"
          variant="outline"
          hideLabelOnMobile
          onClick={() => router.push(`/property-valuation/detail-check/macro-location${suffix}`)}
        />
      }
    >
      <div className="pb-24">
        {error && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {isLoading || !data ? (
          <p className="text-sm text-muted-foreground">Kalkulator wird geladen...</p>
        ) : (
          <div className="space-y-8">
            <section>
              <div className="mb-4 flex items-center gap-4">
                <h2 className="rounded-lg border border-border bg-card px-4 py-2 text-lg font-medium text-foreground">
                  Parameter
                </h2>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="grid gap-4 lg:grid-cols-4 md:grid-cols-2">
                <TextField label="Start in Jahr/Monat" type="month" value={startYyyymm} onChange={(e) => setStartYyyymm(e.target.value)} />
                <TextField label="Ausgangsmiete bei Kauf" value={monthlyRentStart} suffix="€" inputMode="decimal" onChange={(e) => setMonthlyRentStart(e.target.value)} />
                <TextField label="Letzte Mieterhöhung §558" type="month" value={last558Date} onChange={(e) => setLast558Date(e.target.value)} />
                <TextField label="Letzte §559-Erhöhung" type="month" value={last559Date} onChange={(e) => setLast559Date(e.target.value)} />
                <TextField label="Mietspiegel Vergleichswert" value={rentIndexPerM2} suffix="€/m²" inputMode="decimal" onChange={(e) => { setRentIndexPerM2(e.target.value); setRentIndexSource('MANUAL'); }} helperText="Automatisch aus Baujahr/Fläche, solange nicht überschrieben." />
                <ReadOnlyValue label="Größe" value={`${numberFormatter.format(data.params.livingAreaM2)} m²`} />
                <ReadOnlyValue label="Ort / PLZ" value={`${data.params.city || '-'} ${data.params.postalCode || ''}`.trim()} />
                <ReadOnlyValue label="Kappungsgrenze" value={`${data.denseMarket ? 'Ballungsgebiet' : 'Regelfall'} · ${formatPercent(data.capPercent)}`} />
                <ReadOnlyValue label="Finanzierungsvariante" value={data.selectedFinancingVariant === 'INDIVIDUAL' ? 'Individuell' : 'Angebot'} />
                <ReadOnlyValue label="Kapitaldienst Monat" value={formatCurrency(data.params.monthlyDebtService)} />
                <ReadOnlyValue label="§559-Deckel" value={`${formatCurrency(data.capAbs)} / Monat`} />
                <ReadOnlyValue label="Break Even Point" value={data.breakEven ?? 'nicht erreicht'} />
                <ReadOnlyValue label="Break Even mit Mietspiegel" value={data.breakEvenWithRentIndex ?? 'nicht erreicht'} />
                <ReadOnlyValue label="Mietspiegelquelle" value={data.rentIndexSource === 'MANUAL' ? 'Manuelle Eingabe' : 'Automatisch aus Baujahr/Fläche'} />
                <ReadOnlyValue label="AfA pro Monat" value={formatCurrency(data.timeline[0]?.afa ?? 0)} />
                <ReadOnlyValue label="Nicht umlagefähige Kosten" value={formatCurrency(data.timeline[0]?.nonAllocableCosts ?? 0)} />
                <ReadOnlyValue label="Cashflow heute" value={formatCurrency(data.metrics.cashflowToday)} />
                <ReadOnlyValue label="Nettomietrendite heute" value={formatPercentValue(data.metrics.netYieldToday)} />
                <ReadOnlyValue label={`Miete nach ${CALCULATION_HORIZON_YEARS} Jahren`} value={formatCurrency(data.metrics.rentAtHorizon)} />
                <ReadOnlyValue label={`Miete nach ${CALCULATION_HORIZON_YEARS} Jahren mit Mietspiegel`} value={formatCurrency(data.metrics.rentAtHorizonWithRentIndex)} />
                <ReadOnlyValue label={`Kumulierter Cashflow nach ${CALCULATION_HORIZON_YEARS} Jahren`} value={formatCurrency(data.metrics.endingCashflow)} />
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)] md:items-end">
                <Dropdown
                  label="Szenario"
                  value={mode}
                  onChange={(e) => handleModeChange(e.target.value)}
                  options={[
                    { value: 'KNOWN', label: 'Bekannte Werte' },
                    { value: 'POTENTIAL', label: 'Potentielle Werte' },
                  ]}
                />
                <div>
                  <label className="mb-2 block text-sm text-foreground">Bekannte Werte ⇄ Potentielle Werte</label>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={1}
                    value={mode === 'POTENTIAL' ? 1 : 0}
                    onChange={(e) => handleModeChange(e.target.value === '1' ? 'POTENTIAL' : 'KNOWN')}
                    className="w-full"
                    aria-label="Szenario-Schieberegler"
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  label="Neu berechnen"
                  onClick={() => recalc(mode)}
                  disabled={isSaving}
                />
                <Button
                  label="Sanierungen optimal platzieren"
                  variant="outline"
                  icon={<Sparkles />}
                  onClick={() => recalc(mode, false, true)}
                  disabled={isSaving || mode === 'POTENTIAL'}
                />
              </div>
              {placementMode === 'OPTIMIZED' && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Die angezeigten Sanierungszeitpunkte sind auf den frühestmöglichen Break-even optimiert.
                </p>
              )}
            </section>

            <section>
              <div className="mb-4 flex flex-wrap items-center gap-4">
                <div>
                  <h2 className="text-lg font-medium text-foreground">Grafische Entwicklung</h2>
                  <p className="text-sm text-muted-foreground">Die Tabellen bleiben im Hintergrund vollständig berechnet.</p>
                </div>
                <div className="ml-auto">
                  <Button
                    label={showRentIndexComparison ? 'Mietspiegel ausblenden' : 'Mietspiegel vergleichen'}
                    variant="outline"
                    size="sm"
                    icon={<LineChart />}
                    aria-pressed={showRentIndexComparison}
                    onClick={() => setShowRentIndexComparison((current) => !current)}
                  />
                </div>
              </div>
              <CalculatorChart rows={chartRows} showRentIndex={showRentIndexComparison} />
            </section>

            <section className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-medium text-foreground">Detailtabellen</h2>
                <span className="text-sm text-muted-foreground">Standardmäßig eingeklappt</span>
              </div>

              <div className="border-b border-border pb-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-medium text-foreground">Mietentwicklung</h3>
                  <TableToggle label="Mietentwicklung" open={openTables.timeline} onClick={() => toggleTable('timeline')} />
                </div>
                {openTables.timeline && (
                  <div className="mt-4 max-h-[420px] overflow-auto rounded-lg border border-border">
                    <table className="w-full min-w-[820px] text-left text-sm">
                      <thead className="sticky top-0 bg-muted">
                        <tr>
                          <th className="px-4 py-3 font-medium">Monat</th>
                          <th className="px-4 py-3 text-right font-medium">Miete gesamt</th>
                          <th className="px-4 py-3 text-right font-medium">§558-Stufe</th>
                          <th className="px-4 py-3 text-right font-medium">§559-Stufe</th>
                          <th className="px-4 py-3 text-right font-medium">Sanierung Zahlung</th>
                          <th className="px-4 py-3 text-right font-medium">Δ Monat</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleTimeline.map((row) => (
                          <tr key={row.yyyymm} className="border-t border-border even:bg-muted/30">
                            <td className="px-4 py-3">{row.yyyymm}</td>
                            <td className="px-4 py-3 text-right">{formatCurrency(row.rentTotal)}</td>
                            <td className="px-4 py-3 text-right">{row.delta558 > 0 ? formatCurrency(row.delta558) : '-'}</td>
                            <td className="px-4 py-3 text-right">{row.delta559 > 0 ? formatCurrency(row.delta559) : '-'}</td>
                            <td className="px-4 py-3 text-right">{row.renovationPayment > 0 ? formatCurrency(row.renovationPayment) : '-'}</td>
                            <td className={`px-4 py-3 text-right ${row.monthlyDelta >= 0 ? 'text-emerald-700' : 'text-destructive'}`}>
                              {formatCurrency(row.monthlyDelta)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="border-b border-border pb-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-medium text-foreground">Modernisierungsmaßnahmen</h3>
                  <TableToggle label="Modernisierungsmaßnahmen" open={openTables.modernization} onClick={() => toggleTable('modernization')} />
                </div>
                {openTables.modernization && (
                  <div className="mt-4 overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-3 font-medium">Maßnahme</th>
                          <th className="px-4 py-3 font-medium">Zahlung</th>
                          <th className="px-4 py-3 font-medium">Wirksam</th>
                          <th className="px-4 py-3 text-right font-medium">Monat +</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.modernizationPlan.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-4 py-5 text-muted-foreground">Keine Modernisierungsmaßnahmen geplant.</td>
                          </tr>
                        ) : data.modernizationPlan.map((item) => (
                          <tr key={item.id} className="border-t border-border">
                            <td className="px-4 py-3">{item.title}</td>
                            <td className="px-4 py-3">{item.paymentYyyymm}</td>
                            <td className="px-4 py-3">{item.effectiveYyyymm}</td>
                            <td className="px-4 py-3 text-right">{formatCurrency(item.monthlyDelta)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="border-b border-border pb-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-medium text-foreground">§558-Erhöhungen</h3>
                  <TableToggle label="§558-Erhöhungen" open={openTables.increases} onClick={() => toggleTable('increases')} />
                </div>
                {openTables.increases && (
                  <div className="mt-4 overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-3 font-medium">Wirksam ab</th>
                          <th className="px-4 py-3 text-right font-medium">Monat +</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.increases558.length === 0 ? (
                          <tr>
                            <td colSpan={2} className="px-4 py-5 text-muted-foreground">Keine §558-Erhöhung im Zeitraum.</td>
                          </tr>
                        ) : data.increases558.map((item) => (
                          <tr key={`${item.effectiveYyyymm}-${item.monthlyDelta}`} className="border-t border-border">
                            <td className="px-4 py-3">{item.effectiveYyyymm}</td>
                            <td className="px-4 py-3 text-right">{formatCurrency(item.monthlyDelta)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-medium text-foreground">Einnahmen und Ausgaben</h3>
                  <TableToggle label="Einnahmen und Ausgaben" open={openTables.cashflow} onClick={() => toggleTable('cashflow')} />
                </div>
                {openTables.cashflow && (
                  <div className="mt-4 max-h-[360px] overflow-auto rounded-lg border border-border">
                    <table className="w-full min-w-[900px] text-left text-sm">
                      <thead className="sticky top-0 bg-muted">
                        <tr>
                          <th className="px-4 py-3 font-medium">Monat</th>
                          <th className="px-4 py-3 text-right font-medium">Einnahmen</th>
                          <th className="px-4 py-3 text-right font-medium">Ausgaben</th>
                          <th className="px-4 py-3 text-right font-medium">Cum Einnahmen</th>
                          <th className="px-4 py-3 text-right font-medium">Cum Ausgaben</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleTimeline.map((row) => (
                          <tr key={`cash-${row.yyyymm}`} className="border-t border-border even:bg-muted/30">
                            <td className="px-4 py-3">{row.yyyymm}</td>
                            <td className="px-4 py-3 text-right">{formatCurrency(row.income)}</td>
                            <td className="px-4 py-3 text-right">{formatCurrency(row.expenses)}</td>
                            <td className="px-4 py-3 text-right">{formatCurrency(row.cumulativeIncome)}</td>
                            <td className="px-4 py-3 text-right">{formatCurrency(row.cumulativeExpenses)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>

      <StickyActionBar
        show
        ghostLabel={BUTTON_DETAILS.Back.label}
        ghostIcon={<BUTTON_DETAILS.Back.icon />}
        onGhost={() => router.push(`/property-valuation/detail-check/renovation${suffix}`)}
        primaryLabel="Weiter"
        primaryIcon={<BUTTON_DETAILS.Next.icon />}
        primaryDisabled={isLoading || isSaving}
        onPrimary={() => recalc(mode, true)}
      />
    </PropertyValuationLayout>
  );
}

export default function CalculatorPage() {
  return (
    <Suspense fallback={null}>
      <CalculatorContent />
    </Suspense>
  );
}
