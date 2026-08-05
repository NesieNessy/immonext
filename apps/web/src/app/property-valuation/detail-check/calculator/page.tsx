"use client";

import { Button, CalculatedPanel, Dropdown, MetricCard, MonthField, ReadOnlyField, StickyActionBar, TextField } from '@/components/ui';
import { BUTTON_DETAILS } from '@/constants/ButtonLabels';
import { authFetch } from '@/lib/api/authFetch';
import { parseDecimalInput } from '@/lib/detailCheck/acquisitionCosts';
import { addMonths, CALCULATION_HORIZON_MONTHS, CALCULATION_HORIZON_YEARS, type CalculatorMode, type ModernizationPlanRow, type PlacementMode, type RentIndexSource, type RentIncrease558Row, type RentTimelineRow } from '@/lib/detailCheck/rentCalculator';
import { costForCase, type RenovationCase, type RenovationTiming } from '@/lib/detailCheck/renovation';
import { ChevronDown, ChevronUp, LineChart, Sparkles } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { memo, Suspense, useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { PropertyValuationLayout } from '../PropertyValuationLayout';

type CalculatorResponse = {
  params: {
    startYyyymm: string;
    rentStartYyyymm: string;
    monthlyRentStart: number;
    livingAreaM2: number;
    city: string;
    postalCode: string;
    last558Date: string | null;
    last559Date: string | null;
    last559MonthlyDelta: number;
    rentIncreaseIntervalMonths: number;
    rentIncreaseUtilizationPercent: number;
    rentIndexPerM2: number | null;
    rentIndexSource: RentIndexSource;
    monthlyDebtService: number;
    interestRate: number;
    taxRate: number;
    taxableLossesOffsettable?: boolean;
    financingInterestRateOverride?: number | null;
    interestRateOverride?: number | null;
    refinancingInterestRate?: number | null;
    interestPeriodYears?: number;
    equityAmount: number;
    equityIncluded?: boolean;
    modernizationPlacements?: Record<string, string>;
    rentIncreaseOverrides?: Record<string, { effectiveYyyymm?: string; monthlyDelta?: number }>;
    modernizationCostOverrides?: Record<string, number>;
    renovationTimingOverrides?: Record<string, RenovationTiming>;
    mode: CalculatorMode;
    placementMode: PlacementMode;
  };
  selectedFinancingVariant: 'OFFER' | 'INDIVIDUAL';
  denseMarket: boolean;
  capPercent: number;
  capPerM2: number;
  capAbs: number;
  previous559Used: number;
  remaining559Room: number;
  timeline: RentTimelineRow[];
  modernizationPlan: ModernizationPlanRow[];
  renovationCases: RenovationCase[];
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
const CURRENT_YEAR = new Date().getFullYear();
const LAST_558_YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1];
const LAST_559_YEARS = Array.from({ length: 6 }, (_, index) => CURRENT_YEAR - index);

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

function formatMonth(value: string | null): string {
  if (!value) return 'nicht erreicht';
  const [year, month] = value.split('-');
  return `${month} / ${year}`;
}

type ChartRow = RentTimelineRow & { afterTaxCumulative: number };

function roundChartValue(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function buildChartRows(rows: RentTimelineRow[]): ChartRow[] {
  return rows.map((row) => ({ ...row, afterTaxCumulative: row.cumulativeCashflow }));
}

function chartExpenses(row: RentTimelineRow): number {
  return roundChartValue(row.expenses + row.taxes);
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

function chartBandPath(
  first: number[],
  second: number[],
  min: number,
  max: number,
  left: number,
  top: number,
  width: number,
  height: number,
): string {
  const range = max - min || 1;
  const point = (value: number, index: number, count: number) => {
    const x = left + (count <= 1 ? 0 : (index / (count - 1)) * width);
    const y = top + height - ((value - min) / range) * height;
    return `${x.toFixed(2)} ${y.toFixed(2)}`;
  };
  const forward = first.map((value, index) => point(value, index, first.length));
  const backward = second.map((value, index) => point(value, index, second.length)).reverse();
  return forward.length === 0 ? '' : `M ${forward.join(' L ')} L ${backward.join(' L ')} Z`;
}

function formatAxisCurrency(value: number): string {
  const absolute = Math.abs(value);
  if (absolute >= 1000) return `${numberFormatter.format(value / 1000)}k €`;
  return `${numberFormatter.format(value)} €`;
}

type TimelineViewport = { start: number; span: number };

function viewportLabel(startYyyymm: string, viewport: TimelineViewport): string {
  return `${addMonths(startYyyymm, viewport.start)} bis ${addMonths(startYyyymm, viewport.start + viewport.span - 1)}`;
}

function TimelineRangeBar({
  startYyyymm,
  viewport,
  onChange,
}: {
  startYyyymm: string;
  viewport: TimelineViewport;
  onChange: (next: TimelineViewport) => void;
}) {
  const dragRef = useRef<{
    mode: 'start' | 'end' | 'window';
    clientX: number;
    viewport: TimelineViewport;
  } | null>(null);
  const minimumSpan = 24;
  const end = viewport.start + viewport.span;
  const startPercent = (viewport.start / CALCULATION_HORIZON_MONTHS) * 100;
  const spanPercent = (viewport.span / CALCULATION_HORIZON_MONTHS) * 100;

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>, mode: 'start' | 'end' | 'window') => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { mode, clientX: event.clientX, viewport };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const track = event.currentTarget.closest('[data-timeline-range]') as HTMLDivElement | null;
    if (!track) return;
    const delta = Math.round(((event.clientX - drag.clientX) / track.getBoundingClientRect().width) * CALCULATION_HORIZON_MONTHS);
    const initialEnd = drag.viewport.start + drag.viewport.span;

    if (drag.mode === 'start') {
      const nextStart = Math.max(0, Math.min(initialEnd - minimumSpan, drag.viewport.start + delta));
      onChange({ start: nextStart, span: initialEnd - nextStart });
      return;
    }
    if (drag.mode === 'end') {
      const nextEnd = Math.max(drag.viewport.start + minimumSpan, Math.min(CALCULATION_HORIZON_MONTHS, initialEnd + delta));
      onChange({ start: drag.viewport.start, span: nextEnd - drag.viewport.start });
      return;
    }
    const nextStart = Math.max(0, Math.min(CALCULATION_HORIZON_MONTHS - drag.viewport.span, drag.viewport.start + delta));
    onChange({ start: nextStart, span: drag.viewport.span });
  };

  const finishDrag = () => {
    dragRef.current = null;
  };

  return (
    <div className="grid grid-cols-[15%_85%] border-t border-border pt-2">
      <div />
      <div>
        <div className="relative h-10 touch-none select-none" data-timeline-range>
          <div className="absolute inset-x-0 top-4 h-2 rounded-full bg-[#dce7f2]" />
          <div
            className="absolute top-3 h-4 cursor-grab rounded border-2 border-[#3b92e8] bg-[#d9ebff] active:cursor-grabbing"
            style={{ left: `${startPercent}%`, width: `${spanPercent}%` }}
            onPointerDown={(event) => handlePointerDown(event, 'window')}
            onPointerMove={handlePointerMove}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
            title={`Gemeinsame Ansicht: ${viewportLabel(startYyyymm, viewport)}`}
          />
          <div
            className="absolute top-2 h-6 w-3 -translate-x-1/2 cursor-ew-resize rounded bg-[#3b92e8]"
            style={{ left: `${startPercent}%` }}
            onPointerDown={(event) => handlePointerDown(event, 'start')}
            onPointerMove={handlePointerMove}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
            role="slider"
            aria-label="Beginn des sichtbaren Zeitraums"
            aria-valuemin={0}
            aria-valuemax={end - minimumSpan}
            aria-valuenow={viewport.start}
          />
          <div
            className="absolute top-2 h-6 w-3 -translate-x-1/2 cursor-ew-resize rounded bg-[#3b92e8]"
            style={{ left: `${startPercent + spanPercent}%` }}
            onPointerDown={(event) => handlePointerDown(event, 'end')}
            onPointerMove={handlePointerMove}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
            role="slider"
            aria-label="Ende des sichtbaren Zeitraums"
            aria-valuemin={viewport.start + minimumSpan}
            aria-valuemax={CALCULATION_HORIZON_MONTHS}
            aria-valuenow={end}
          />
        </div>
        <div className="text-center text-xs text-muted-foreground">Gemeinsame Ansicht: {viewportLabel(startYyyymm, viewport)}</div>
      </div>
    </div>
  );
}

function CalculatorChart({ rows, showRentIndex, viewport }: { rows: ChartRow[]; showRentIndex: boolean; viewport: TimelineViewport }) {
  const [chartMode, setChartMode] = useState<'monthly' | 'cumulative'>('monthly');
  const [hoveredEvent, setHoveredEvent] = useState<{ x: number; title: string; detail: string } | null>(null);
  const width = 1000;
  const left = 150;
  const right = 25;
  const top = 42;
  const height = 278;
  const plotWidth = width - left - right;
  const visibleRows = rows.slice(viewport.start, viewport.start + viewport.span);
  const monthlyAfterTax = visibleRows.map(chartExpenses);
  const monthlyWithoutTax = visibleRows.map((row) => row.expenses);
  const monthlyValues = visibleRows.flatMap((row) => [
    row.income,
    chartExpenses(row),
    row.expenses,
    ...(showRentIndex ? [row.rentTotalWithRentIndex] : []),
  ]);
  const monthlyMin = Math.min(0, ...monthlyValues);
  const monthlyMaxValue = Math.max(1, ...monthlyValues);
  const monthlyPadding = Math.max(1, (monthlyMaxValue - monthlyMin) * 0.08);
  const monthlyDomain = { min: monthlyMin - (monthlyMin < 0 ? monthlyPadding : 0), max: monthlyMaxValue + monthlyPadding };
  const cumulativeAfterTax = visibleRows.map((row) => row.afterTaxCumulative);
  const cumulativeWithoutTax = visibleRows.map((row) => row.cumulativeCashflowBeforeTax);
  const cumulativeValues = [...cumulativeAfterTax, ...cumulativeWithoutTax];
  const cumulativeMin = Math.min(0, ...cumulativeValues);
  const cumulativeMax = Math.max(0, ...cumulativeValues);
  const cumulativePadding = Math.max(1, (cumulativeMax - cumulativeMin) * 0.08);
  const cumulativeDomain = { min: cumulativeMin - cumulativePadding, max: cumulativeMax + cumulativePadding };
  const domain = chartMode === 'monthly' ? monthlyDomain : cumulativeDomain;
  const primaryValues = chartMode === 'monthly' ? monthlyAfterTax : cumulativeAfterTax;
  const comparisonValues = chartMode === 'monthly' ? monthlyWithoutTax : cumulativeWithoutTax;
  const xAt = (index: number) => left + (visibleRows.length <= 1 ? 0 : (index / (visibleRows.length - 1)) * plotWidth);
  const yAt = (value: number) => top + height - ((value - domain.min) / (domain.max - domain.min || 1)) * height;
  const breakEvenGlobalIndex = rows.findIndex((row) => row.afterTaxCumulative >= 0);
  const breakEvenIndex = breakEvenGlobalIndex >= viewport.start && breakEvenGlobalIndex < viewport.start + viewport.span ? breakEvenGlobalIndex - viewport.start : -1;
  const eventRows = visibleRows.filter((row) => row.renovationPayment > 0 || row.delta558 > 0 || row.delta559 > 0);
  const zeroY = yAt(0);

  if (visibleRows.length === 0) return <p className="rounded-lg border border-border px-4 py-6 text-sm text-muted-foreground">Noch keine Zeitreihe verfügbar.</p>;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div><div className="text-lg font-medium text-foreground">Cashflow-Entwicklung</div><div className="text-sm text-muted-foreground">{chartMode === 'monthly' ? 'Monatliche Einnahmen und Ausgaben mit Steuerwirkung' : 'Kumulierter Cashflow nach Steuern'}</div></div>
        <div className="flex flex-wrap items-center justify-end gap-x-5 gap-y-2">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {chartMode === 'monthly' && <span className="inline-flex items-center gap-2"><span className="h-0.5 w-5 bg-[#2c9b7b]" />Einnahmen</span>}
            <span className="inline-flex items-center gap-2"><span className="h-0.5 w-5 bg-[#d65b58]" />{chartMode === 'monthly' ? 'Ausgaben inkl. Steuern' : 'Cashflow nach Steuern'}</span>
            <span className="inline-flex items-center gap-2"><span className="h-0.5 w-5 bg-[#d9a441]" />{chartMode === 'monthly' ? 'Ausgaben ohne Steuerwirkung' : 'Cashflow ohne Steuerwirkung'}</span>
            {showRentIndex && chartMode === 'monthly' && <span className="inline-flex items-center gap-2"><span className="h-0.5 w-5 border-t-2 border-dotted border-[#8069bd]" />Mietspiegel</span>}
          </div>
          <div className="inline-flex rounded-md border border-border bg-muted p-1"><button className={`rounded px-3 py-1.5 text-sm ${chartMode === 'monthly' ? 'bg-card font-semibold text-foreground shadow-sm' : 'text-muted-foreground'}`} onClick={() => setChartMode('monthly')}>Monatlich</button><button className={`rounded px-3 py-1.5 text-sm ${chartMode === 'cumulative' ? 'bg-card font-semibold text-foreground shadow-sm' : 'text-muted-foreground'}`} onClick={() => setChartMode('cumulative')}>Kumuliert</button></div>
        </div>
      </div>
      <div className="relative overflow-hidden bg-[#fbfcfe]">
        <svg className="h-auto w-full" viewBox={`0 0 ${width} 342`} role="img" aria-labelledby="calculator-chart-title calculator-chart-description">
          <title id="calculator-chart-title">Cashflow-Entwicklung über {CALCULATION_HORIZON_YEARS} Jahre</title>
          <desc id="calculator-chart-description">Interaktive Darstellung der monatlichen oder kumulierten Einnahmen und Ausgaben.</desc>
          <defs>
            <linearGradient id="calculator-tax-band" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#e2b85d" stopOpacity=".34" />
              <stop offset="1" stopColor="#f3dca4" stopOpacity=".16" />
            </linearGradient>
          </defs>
          <text x="20" y="24" className="fill-foreground text-sm font-medium">{chartMode === 'monthly' ? 'Betrag / Monat' : 'Kumulierter Cashflow'}</text>
          {[0, .25, .5, .75, 1].map((ratio) => <line key={ratio} x1={left} x2={left + plotWidth} y1={top + ratio * height} y2={top + ratio * height} className="stroke-border" strokeWidth="1" />)}
          <text x="20" y={top + 4} className="fill-muted-foreground text-xs">{formatAxisCurrency(domain.max)}</text><text x="20" y={top + height + 4} className="fill-muted-foreground text-xs">{formatAxisCurrency(domain.min)}</text>
          {chartMode === 'cumulative' && <line x1={left} x2={left + plotWidth} y1={zeroY} y2={zeroY} stroke="#d99432" strokeWidth="1.5" strokeDasharray="5 4" />}
          <line x1={left} x2={left} y1={top} y2={top + height} className="stroke-muted-foreground" strokeWidth="1" />
          <path d={chartBandPath(primaryValues, comparisonValues, domain.min, domain.max, left, top, plotWidth, height)} fill="url(#calculator-tax-band)" />
          {chartMode === 'monthly' && <path d={chartPath(visibleRows.map((row) => row.income), domain.min, domain.max, left, top, plotWidth, height)} fill="none" stroke="#2c9b7b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
          <path d={chartPath(comparisonValues, domain.min, domain.max, left, top, plotWidth, height)} fill="none" stroke="#d9a441" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d={chartPath(primaryValues, domain.min, domain.max, left, top, plotWidth, height)} fill="none" stroke="#d65b58" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {showRentIndex && chartMode === 'monthly' && <path d={chartPath(visibleRows.map((row) => row.rentTotalWithRentIndex), domain.min, domain.max, left, top, plotWidth, height)} fill="none" stroke="#8069bd" strokeWidth="2" strokeDasharray="3 4" />}
          {eventRows.map((row) => { const index = visibleRows.indexOf(row); const x = xAt(index); const title = row.renovationPayment > 0 ? 'Sanierungszahlung' : row.delta559 > 0 ? 'Mieterhöhung aufgrund Sanierung' : 'Mieterhöhung aufgrund Mietspiegel'; const detail = row.renovationPayment > 0 ? `${row.yyyymm}: ${formatCurrency(row.renovationPayment)} Zahlung` : `${row.yyyymm}: +${formatCurrency(row.delta559 > 0 ? row.delta559 : row.delta558)} monatlich`; const isRent = row.renovationPayment === 0; const eventValue = isRent ? row.income : chartExpenses(row); return <g key={`event-${row.yyyymm}`} onMouseEnter={() => setHoveredEvent({ x: (x / width) * 100, title, detail })} onMouseLeave={() => setHoveredEvent(null)}><circle cx={x} cy={chartMode === 'monthly' ? yAt(eventValue) : yAt(row.afterTaxCumulative)} r="6" fill={isRent ? '#2c9b7b' : '#d65b58'} stroke="var(--card)" strokeWidth="2" /></g>; })}
          {breakEvenIndex >= 0 && chartMode === 'cumulative' && <><line x1={xAt(breakEvenIndex)} x2={xAt(breakEvenIndex)} y1={top} y2={top + height} stroke="#d99432" strokeWidth="1.5" strokeDasharray="5 4" /><circle cx={xAt(breakEvenIndex)} cy={zeroY} r="6" fill="#d99432" stroke="var(--card)" strokeWidth="2" /></>}
        </svg>
        {hoveredEvent && <div className="pointer-events-none absolute top-4 z-30 w-56 rounded-md bg-[#172434] px-3 py-2 text-xs text-white shadow-lg" style={{ left: `clamp(8px, ${hoveredEvent.x}%, calc(100% - 232px))` }}><strong className="block">{hoveredEvent.title}</strong><span className="text-[#cfdae7]">{hoveredEvent.detail}</span></div>}
      </div>
    </div>
  );
}

function TimelineEventConnectors({ rows, viewport }: { rows: ChartRow[]; viewport: TimelineViewport }) {
  const visibleRows = rows.slice(viewport.start, viewport.start + viewport.span);
  if (visibleRows.length === 0) return null;
  const events = visibleRows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => row.renovationPayment > 0 || row.delta558 > 0 || row.delta559 > 0);
  const breakEvenIndex = visibleRows.findIndex((row) => row.afterTaxCumulative >= 0);
  const leftForIndex = (index: number) => 15 + (index / Math.max(1, visibleRows.length - 1)) * 85;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-20 top-36 z-10 overflow-hidden" aria-hidden="true">
      {events.map(({ row, index }) => (
        <div
          key={`connector-${row.yyyymm}-${row.renovationPayment}-${row.delta558}-${row.delta559}`}
          className="absolute inset-y-0 border-l border-dashed opacity-55"
          style={{
            left: `${leftForIndex(index)}%`,
            borderColor: row.renovationPayment > 0 ? '#d65b58' : '#2c9b7b',
          }}
        />
      ))}
      {breakEvenIndex >= 0 && (
        <div
          className="absolute inset-y-0 border-l-2 opacity-60"
          style={{ left: `${leftForIndex(breakEvenIndex)}%`, borderColor: '#d99432' }}
        />
      )}
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

type CalculatorOverrides = {
  modernizationPlacements: Record<string, string>;
  modernizationCostOverrides: Record<string, number>;
  renovationTimingOverrides: Record<string, RenovationTiming>;
  rentIncreaseOverrides: Record<string, { effectiveYyyymm?: string; monthlyDelta?: number }>;
  financingInterestRateOverride: number | null;
  interestRateOverride: number | null;
  equityIncluded: boolean;
  taxRate?: number;
  taxableLossesOffsettable?: boolean;
};

function monthOffset(start: string, value: string): number {
  const [sy, sm] = start.split('-').map(Number);
  const [vy, vm] = value.split('-').map(Number);
  return (vy - sy) * 12 + (vm - sm);
}

function monthFromOffset(start: string, offset: number): string {
  return addMonths(start, Math.max(0, Math.min(CALCULATION_HORIZON_MONTHS - 1, Math.round(offset))));
}

type PlanDragState = {
  id: string;
  kind: 'modernization' | 'rent' | 'finance' | 'tax';
  /** Left offset (%) and clientY at drag start — fixed for the whole gesture.
   *  Every move computes against these, not against the previous move's
   *  result, so slow small movements accumulate correctly instead of being
   *  rounded away frame by frame (see VERTICAL_PIXELS_PER_STEP below). */
  originLeft: number;
  originAmount: number;
  originY: number;
  grabOffset: number;
  currentLeft: number;
  currentAmount: number;
  minAmount: number;
  maxAmount: number;
  step: number;
  /** Smallest value increment the drag resolves to — a tenth of `step`, so
   *  the pointer moves the value on nearly every pixel instead of jumping a
   *  whole `step` every 8px. */
  precision: number;
  dateEditable: boolean;
};

/** Vertical pixels of pointer movement per one `step` change in value. */
const VERTICAL_PIXELS_PER_STEP = 8;

/** Pointer travel absorbed before a drag starts changing the value, so a
 *  click or a slightly shaky grab doesn't nudge the number. */
const DRAG_DEAD_ZONE_PX = 3;

/** Sensitivity multiplier while Shift is held, for precise targeting. */
const FINE_DRAG_FACTOR = 0.25;

/**
 * Rounds .5 away from zero in both directions.
 *
 * `Math.round` rounds halves toward +Infinity — `Math.round(0.5)` is 1 but
 * `Math.round(-0.5)` is -0, and `Math.round(-1.5)` is -1 while
 * `Math.round(1.5)` is 2. Applied to a drag delta that makes downward
 * movement need consistently more travel than upward movement for the same
 * change: 4px up registered a step, 4px down registered nothing. That
 * directional bias is what made dragging down feel unresponsive.
 */
function roundHalfAwayFromZero(value: number): number {
  return Math.sign(value) * Math.round(Math.abs(value));
}

/** Snaps to the nearest multiple of `precision`, then trims binary-float
 *  drift (0.1-sized steps otherwise produce values like 3.5000000000000004). */
function quantize(value: number, precision: number): number {
  const snapped = roundHalfAwayFromZero(value / precision) * precision;
  return Math.round(snapped * 1000) / 1000;
}

// Valid outputs are the continuous 0-42% range, or exactly 45% (the German
// "Reichensteuer" top bracket) — nothing in between is a real tax rate.
// `requested` is now computed fresh from the drag origin on every move (see
// the fix in handlePointerMove below), so once snapped to 45 it keeps landing
// on nearby values like 43-44, not just exactly 45. The old `requested < 45`
// retreat check treated any of those as "moved back down" and immediately
// un-snapped to 42 — flickering 45/42 on alternating pointer events. The
// correct retreat signal is crossing back below the *lower* boundary (42),
// not merely being below the upper one (45).
function snapTaxPercent(previous: number, requested: number): number {
  if (previous === 45) return requested < 42 ? Math.max(0, requested) : 45;
  if (requested > 42) return 45;
  return Math.max(0, Math.min(42, requested));
}

type BarKind = 'modernization' | 'rent';

/** Bar geometry, in the same percentage units the gantt tracks are laid out in. */
const BAR_WIDTH_PERCENT = 15;
const BAR_HEIGHT_PX = 32;
const LANE_GAP_PX = 4;
const TRACK_PADDING_PX = 8;
const LANE_STEP_PX = BAR_HEIGHT_PX + LANE_GAP_PX;

function trackHeightPx(laneCount: number): number {
  return Math.max(56, TRACK_PADDING_PX * 2 + laneCount * BAR_HEIGHT_PX + (laneCount - 1) * LANE_GAP_PX);
}

/**
 * Assigns each bar the topmost row in which it does not overlap an earlier one,
 * so measures that fall in the same or adjacent months stack instead of hiding
 * each other. Bars are a fixed 15 % wide, so two of them collide whenever their
 * left edges are closer together than that — previously the later one simply
 * covered the earlier one and only a z-index told them apart.
 */
function assignLanes(lefts: number[]): number[] {
  const laneEnds: number[] = [];
  const lanes = new Array<number>(lefts.length).fill(0);
  const order = lefts
    .map((left, index) => ({ left, index }))
    .sort((a, b) => a.left - b.left || a.index - b.index);

  for (const { left, index } of order) {
    // 0.01 absorbs floating-point noise in the percentage arithmetic.
    let lane = laneEnds.findIndex((end) => left >= end - 0.01);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(0);
    }
    laneEnds[lane] = left + BAR_WIDTH_PERCENT;
    lanes[index] = lane;
  }

  return lanes;
}

interface BarLayout {
  left: number;
  reason: string;
}

/** Pure position/visibility calc, kept out of the memoized Bar component so
 *  it can run every render (cheap) without defeating the memoization below. */
function computeBarLayout(
  startYyyymm: string,
  viewport: TimelineViewport,
  kind: BarKind,
  label: string,
  date: string,
): BarLayout | null {
  const offset = monthOffset(startYyyymm, date);
  if (offset < viewport.start - 18 || offset > viewport.start + viewport.span) return null;
  const left = Math.max(0, Math.min(96, ((offset - viewport.start) / viewport.span) * 100));
  const reason = kind === 'modernization'
    ? `Sanierung ${label}: Zahlung und spätere §559-Mietanpassung werden neu berechnet.`
    : label.startsWith('§558')
      ? `Mieterhöhung nach §558 aufgrund Mietspiegel und Kappungsgrenze.`
      : `Mieterhöhung aufgrund der Sanierung ${label}. Wirksamkeit folgt der gesetzlichen Frist.`;
  return { left, reason };
}

interface BarProps {
  id: string;
  kind: BarKind;
  label: string;
  date: string;
  reason: string;
  left: number;
  amount: number;
  maxAmount: number;
  /** Stacking row within the track; 0 is the topmost. */
  lane: number;
  editable: boolean;
  isDragging: boolean;
  onBeginDrag: (event: PointerEvent<HTMLDivElement>, id: string, kind: BarKind, baseLeft: number, amount: number, maxAmount: number, dateEditable: boolean) => void;
  onMove: (event: PointerEvent<HTMLDivElement>) => void;
  onUp: (event: PointerEvent<HTMLDivElement>) => void;
  onCancel: () => void;
}

/**
 * Memoized so that dragging one bar doesn't re-render every other bar in the
 * gantt (modernizations, §559s, §558s can total a few dozen). Only the props
 * of the actively dragged bar change during a gesture (left/amount/isDragging);
 * everything else keeps the same primitive prop values render to render, so
 * React.memo's shallow comparison correctly skips them. The onBeginDrag/onMove/
 * onUp/onCancel callbacks must stay referentially stable (see the useCallback
 * wrappers in PlanEditor) or this memoization would be defeated immediately.
 */
const Bar = memo(function Bar({
  id, kind, label, date, reason, left, amount, maxAmount, lane, editable, isDragging,
  onBeginDrag, onMove, onUp, onCancel,
}: BarProps) {
  return (
    <div
      className={`absolute flex h-8 min-w-[94px] touch-none cursor-grab items-center gap-1 rounded-md border-2 px-2 text-[11px] font-semibold text-white shadow-sm active:cursor-grabbing ${kind === 'rent' ? 'border-[#9fd7c5] bg-[#2c9b7b]' : 'border-[#efb1ae] bg-[#d65b58]'} ${isDragging ? 'ring-2 ring-[#d99432] ring-offset-2' : ''}`}
      style={{
        left: `${left}%`,
        top: `${TRACK_PADDING_PX + lane * LANE_STEP_PX}px`,
        width: `${BAR_WIDTH_PERCENT}%`,
        // The dragged bar rises above the rest; otherwise later lanes sit on top.
        zIndex: isDragging ? 40 : 20 + lane,
      }}
      onPointerDown={editable ? (event) => onBeginDrag(event, id, kind, left, amount, maxAmount, true) : undefined}
      onPointerMove={editable ? onMove : undefined}
      onPointerUp={editable ? onUp : undefined}
      onPointerCancel={editable ? onCancel : undefined}
      title={`${reason} Wirksam ab ${date}. Nach oben oder unten ziehen, um den Wert zu ändern — mit gedrückter Umschalttaste feiner.`}
    >
      {kind === 'rent' ? (
        <>
          <span className="whitespace-nowrap">+ {formatCurrency(amount)}</span>
          <span className="min-w-0 truncate opacity-90">· {label}</span>
        </>
      ) : (
        <>
          <span className="truncate">{label}</span>
          <span className="ml-auto whitespace-nowrap">{formatCurrency(amount)}</span>
        </>
      )}
    </div>
  );
});

function PlanEditor({
  data,
  startYyyymm,
  equityIncluded,
  viewport,
  isSaving,
  onViewportChange,
  onChange,
  onApply,
}: {
  data: CalculatorResponse;
  startYyyymm: string;
  equityIncluded: boolean;
  viewport: TimelineViewport;
  isSaving: boolean;
  onViewportChange: (next: TimelineViewport) => void;
  onChange: (overrides: CalculatorOverrides) => Promise<void>;
  onApply: (overrides: CalculatorOverrides) => Promise<void>;
}) {
  const [dragging, setDragging] = useState<PlanDragState | null>(null);
  const draggingRef = useRef<PlanDragState | null>(null);
  const [draftFinancingRate, setDraftFinancingRate] = useState(data.params.interestRate);
  const [draftRefinancingRate, setDraftRefinancingRate] = useState(data.params.refinancingInterestRate ?? data.params.interestRate);
  const [draftEquity, setDraftEquity] = useState(equityIncluded);
  const [draftTaxRate, setDraftTaxRate] = useState(data.params.taxRate * 100);
  const [draftLossesOffsettable, setDraftLossesOffsettable] = useState(data.params.taxableLossesOffsettable === true);
  const [draftTimingOverrides, setDraftTimingOverrides] = useState<Record<string, RenovationTiming>>(data.params.renovationTimingOverrides ?? {});
  const [immediateMoveWarning, setImmediateMoveWarning] = useState<RenovationCase | null>(null);
  const [showApply, setShowApply] = useState(false);
  const [message, setMessage] = useState('');
  /** Date the user last dropped a §558 bar on, pending the server's verdict. */
  const pendingMoveRef = useRef<{ id: string; requested: string } | null>(null);
  const initialValuesRef = useRef({
    financingRate: data.params.interestRate,
    refinancingRate: data.params.refinancingInterestRate ?? data.params.interestRate,
    equityIncluded,
    taxRate: data.params.taxRate * 100,
    taxableLossesOffsettable: data.params.taxableLossesOffsettable === true,
  });

  useEffect(() => setDraftFinancingRate(data.params.interestRate), [data.params.interestRate]);
  useEffect(() => setDraftRefinancingRate(data.params.refinancingInterestRate ?? data.params.interestRate), [data.params.interestRate, data.params.refinancingInterestRate]);
  useEffect(() => setDraftEquity(equityIncluded), [equityIncluded]);
  useEffect(() => setDraftTaxRate(data.params.taxRate * 100), [data.params.taxRate]);
  useEffect(() => setDraftLossesOffsettable(data.params.taxableLossesOffsettable === true), [data.params.taxableLossesOffsettable]);
  useEffect(() => setDraftTimingOverrides(data.params.renovationTimingOverrides ?? {}), [data.params.renovationTimingOverrides]);

  // The recalculation may push an increase later than requested when there is
  // no legal head-room in the chosen month — the Kappungsgrenze is exhausted,
  // the ortsübliche Vergleichsmiete is already reached, or a §559 modernization
  // occupies that month. That constraint varies month by month and is only
  // known after the server has recalculated, so instead of guessing client-side
  // the actual result is compared against what was asked for.
  useEffect(() => {
    const pending = pendingMoveRef.current;
    if (!pending) return;
    pendingMoveRef.current = null;
    const landed = data.increases558.find((item, index) => (item.id ?? `558-${index + 1}`) === pending.id);
    if (!landed || landed.effectiveYyyymm === pending.requested) return;
    if (landed.effectiveYyyymm > pending.requested) {
      setMessage(`Verschiebung auf ${pending.requested} nicht möglich — zu diesem Zeitpunkt besteht kein rechtlicher Spielraum (Kappungsgrenze bzw. ortsübliche Vergleichsmiete noch nicht erreicht). Wirksam ab ${landed.effectiveYyyymm}.`);
    }
  }, [data.increases558]);

  const planPlacement = (item: ModernizationPlanRow) => data.params.modernizationPlacements?.[item.id] ?? item.effectiveYyyymm;

  const submit = async (next: CalculatorOverrides) => {
    setMessage('Berechnung wird aktualisiert...');
    try {
      await onChange(next);
      setMessage('Chart, Folgeereignisse und Break-even wurden aktualisiert.');
    } catch {
      setMessage('Die Änderung konnte nicht übernommen werden. Der Zeitpunkt bleibt unverändert.');
    }
  };

  // Pending rAF for the throttled drag-state commit below. A pointer fires
  // 120-240 events/s; committing to React state on every one of them forces
  // a re-render far more often than the screen can paint (60/s), which is
  // itself a source of the janky/dropped-input feel. Coalescing to one
  // commit per animation frame caps that at the display's actual rate.
  const dragFrameRef = useRef<number | null>(null);

  const cancelPendingDragFrame = useCallback(() => {
    if (dragFrameRef.current != null) {
      cancelAnimationFrame(dragFrameRef.current);
      dragFrameRef.current = null;
    }
  }, []);

  const scheduleDragUpdate = useCallback((next: PlanDragState) => {
    draggingRef.current = next;
    if (dragFrameRef.current != null) return;
    dragFrameRef.current = window.requestAnimationFrame(() => {
      dragFrameRef.current = null;
      setDragging(draggingRef.current);
    });
  }, []);

  const handlePointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const activeDrag = draggingRef.current;
    if (!activeDrag) return;
    const element = event.currentTarget as HTMLDivElement;
    const track = element.dataset.ganttTrack === 'true' ? element : element.parentElement;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const pointerLeft = ((event.clientX - rect.left) / rect.width) * 100;
    const nextLeft = activeDrag.dateEditable
      ? Math.max(0, Math.min(98, pointerLeft - activeDrag.grabOffset))
      : activeDrag.currentLeft;
    const renovationCase = activeDrag.kind === 'modernization'
      ? data.renovationCases.find((item) => item.id === activeDrag.id)
      : undefined;
    const timing = renovationCase ? (draftTimingOverrides[renovationCase.id] ?? renovationCase.zeitpunkt) : null;
    if (renovationCase && timing === 'SOFORT' && Math.abs(nextLeft - activeDrag.originLeft) >= 0.5) {
      cancelPendingDragFrame();
      draggingRef.current = null;
      setDragging(null);
      setImmediateMoveWarning(renovationCase);
      return;
    }
    // Computed from the fixed drag origin (originY/originAmount), not from
    // the previous move's result. Deriving it incrementally — as this used
    // to — discarded any sub-step remainder on every single event: moving
    // slowly in several small steps lost the fractional pixels each time,
    // while the same total distance covered in one fast motion (with equally
    // "lossy" per-event rounding, but fewer events) landed on a different,
    // larger value. That mismatch was the reported "sometimes it jumps,
    // sometimes nothing happens".
    const rawDeltaY = activeDrag.originY - event.clientY;
    // Absorb the dead zone without losing it: past the threshold the value
    // continues from where the dead zone ended, so there is no jump.
    const effectiveDeltaY = Math.abs(rawDeltaY) < DRAG_DEAD_ZONE_PX
      ? 0
      : rawDeltaY - Math.sign(rawDeltaY) * DRAG_DEAD_ZONE_PX;
    const sensitivity = event.shiftKey ? FINE_DRAG_FACTOR : 1;
    const unitsPerPixel = activeDrag.step / VERTICAL_PIXELS_PER_STEP;
    const requestedAmount = quantize(
      activeDrag.originAmount + effectiveDeltaY * unitsPerPixel * sensitivity,
      activeDrag.precision,
    );
    const nextAmount = activeDrag.kind === 'tax'
      ? snapTaxPercent(activeDrag.currentAmount, requestedAmount)
      : Math.max(activeDrag.minAmount, Math.min(activeDrag.maxAmount, requestedAmount));
    scheduleDragUpdate({ ...activeDrag, currentLeft: nextLeft, currentAmount: nextAmount });
  }, [data.renovationCases, draftTimingOverrides, cancelPendingDragFrame, scheduleDragUpdate]);

  const finishDrag = async () => {
    cancelPendingDragFrame();
    const completedDrag = draggingRef.current;
    if (!completedDrag) return;
    const placements = { ...(data.params.modernizationPlacements ?? {}) };
    const rentOverrides = { ...(data.params.rentIncreaseOverrides ?? {}) };
    const modernizationCostOverrides = { ...(data.params.modernizationCostOverrides ?? {}) };

    if (completedDrag.dateEditable) {
      const offset = Math.round(viewport.start + (completedDrag.currentLeft / 100) * viewport.span);
      if (offset < 3) {
        draggingRef.current = null;
        setDragging(null);
        setMessage('Zeitpunkt nicht übernommen: Eine Erhöhung oder Modernisierung kann frühestens ab dem 3. Monat wirksam werden.');
        return;
      }
      // Covers the global §558 lock-out period and the waiting period between
      // two increases. The recalculation would clamp the date back silently,
      // leaving the bar to snap into place with no explanation.
      //
      // Identified by kind + dateEditable, NOT by an id prefix: once an
      // increase has been persisted its id is the database key ("1", "2", …),
      // so the previous `id.startsWith('558-')` test only ever matched
      // increases that had never been saved — which is to say, almost none.
      // §559 bars are the other 'rent' bars but are not date-editable.
      if (completedDrag.kind === 'rent') {
        const limit = earliest558For(completedDrag.id);
        if (offset < limit.offset) {
          draggingRef.current = null;
          setDragging(null);
          setMessage(`Zeitpunkt nicht übernommen. ${limit.reason}`);
          return;
        }
      }
      // The server has the final say — legal head-room varies month by month
      // and is only known after recalculation. Remember what was asked for so
      // the result can be compared against it (see the effect below).
      pendingMoveRef.current = completedDrag.kind === 'rent'
        ? { id: completedDrag.id, requested: monthFromOffset(startYyyymm, offset) }
        : null;
      const date = monthFromOffset(startYyyymm, offset);
      if (completedDrag.kind === 'modernization') placements[completedDrag.id] = date;
      if (completedDrag.kind === 'rent') rentOverrides[completedDrag.id] = { ...rentOverrides[completedDrag.id], effectiveYyyymm: date };
    }

    if (completedDrag.kind === 'modernization') modernizationCostOverrides[completedDrag.id] = completedDrag.currentAmount;
    if (completedDrag.kind === 'rent') rentOverrides[completedDrag.id] = { ...rentOverrides[completedDrag.id], monthlyDelta: completedDrag.currentAmount };
    if (completedDrag.id === 'financing-rate') setDraftFinancingRate(completedDrag.currentAmount);
    if (completedDrag.id === 'refinancing-rate') setDraftRefinancingRate(completedDrag.currentAmount);
    if (completedDrag.id === 'tax-rate') setDraftTaxRate(completedDrag.currentAmount);

    draggingRef.current = null;
    setDragging(null);
    await submit({
      modernizationPlacements: placements,
      modernizationCostOverrides,
      renovationTimingOverrides: draftTimingOverrides,
      rentIncreaseOverrides: rentOverrides,
      financingInterestRateOverride: completedDrag.id === 'financing-rate' ? completedDrag.currentAmount : draftFinancingRate,
      interestRateOverride: completedDrag.id === 'refinancing-rate' ? completedDrag.currentAmount : draftRefinancingRate,
      equityIncluded: draftEquity,
      taxRate: (completedDrag.id === 'tax-rate' ? completedDrag.currentAmount : draftTaxRate) / 100,
      taxableLossesOffsettable: draftLossesOffsettable,
    });
  };

  // Stable (empty deps): reads/writes only refs and the setState setter, both
  // of which keep their identity across renders, so this never needs to be
  // recreated. Passed straight through to the memoized Bar component — if it
  // were redefined every render, that would defeat the memoization below.
  const beginDrag = useCallback((
    event: PointerEvent<HTMLDivElement>,
    id: string,
    kind: 'modernization' | 'rent' | 'finance' | 'tax',
    baseLeft: number,
    amount: number,
    maxAmount: number,
    dateEditable: boolean,
  ) => {
    event.preventDefault();
    const track = event.currentTarget.parentElement;
    const rect = track?.getBoundingClientRect();
    const pointerLeft = rect ? ((event.clientX - rect.left) / rect.width) * 100 : baseLeft;
    event.currentTarget.setPointerCapture(event.pointerId);
    const step = kind === 'modernization' ? 250 : kind === 'rent' || kind === 'tax' ? 1 : 0.1;
    const nextDrag: PlanDragState = {
      id,
      kind,
      originLeft: baseLeft,
      currentLeft: baseLeft,
      grabOffset: pointerLeft - baseLeft,
      originY: event.clientY,
      originAmount: amount,
      currentAmount: amount,
      minAmount: 0,
      maxAmount,
      step,
      precision: step / 10,
      dateEditable,
    };
    draggingRef.current = nextDrag;
    setDragging(nextDrag);
  }, []);

  // Stable trampolines for the memoized Bar component: they read the latest
  // finishDrag/cancel logic via refs instead of closing over it directly, so
  // their own identity never changes and Bar's memoization isn't defeated.
  const finishDragRef = useRef(finishDrag);
  finishDragRef.current = finishDrag;

  const handleDragCancel = useCallback(() => {
    cancelPendingDragFrame();
    draggingRef.current = null;
    setDragging(null);
  }, [cancelPendingDragFrame]);

  const handleBarPointerUp = useCallback((event: PointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
    void finishDragRef.current();
  }, []);

  // Safety net alongside setPointerCapture (used in beginDrag): if capture
  // ever fails to deliver pointerup/pointercancel to the dragged element —
  // e.g. the element unmounts mid-drag because a recalc replaced `data` —
  // this still ends the drag instead of leaving it stuck. Registered once
  // for the component's lifetime, not per drag or per move event.
  useEffect(() => {
    const onWindowPointerUp = () => { void finishDragRef.current(); };
    window.addEventListener('pointerup', onWindowPointerUp);
    window.addEventListener('pointercancel', handleDragCancel);
    return () => {
      window.removeEventListener('pointerup', onWindowPointerUp);
      window.removeEventListener('pointercancel', handleDragCancel);
    };
  }, [handleDragCancel]);

  type BarSpec = {
    id: string;
    kind: BarKind;
    label: string;
    date: string;
    amount: number;
    maxAmount: number;
    editable?: boolean;
  };

  /**
   * Lays out one gantt row: drops bars outside the viewport, stacks whatever
   * still overlaps into separate lanes, and reports how tall the row has to be
   * so nothing is clipped.
   */
  const buildTrack = (specs: BarSpec[]) => {
    const visible = specs.flatMap((spec) => {
      const layout = computeBarLayout(startYyyymm, viewport, spec.kind, spec.label, spec.date);
      return layout ? [{ spec, layout }] : [];
    });
    const lefts = visible.map(({ spec, layout }) => (
      dragging?.id === spec.id ? dragging.currentLeft : layout.left
    ));
    const lanes = assignLanes(lefts);
    const laneCount = lanes.length ? Math.max(...lanes) + 1 : 1;

    return {
      heightPx: trackHeightPx(laneCount),
      nodes: visible.map(({ spec, layout }, index) => {
        const isDragging = dragging?.id === spec.id;
        return (
          <Bar
            key={`${spec.kind}-${spec.id}`}
            id={spec.id}
            kind={spec.kind}
            label={spec.label}
            date={spec.date}
            reason={layout.reason}
            left={lefts[index]}
            amount={isDragging ? dragging.currentAmount : spec.amount}
            maxAmount={spec.maxAmount}
            lane={lanes[index]}
            editable={spec.editable !== false}
            isDragging={isDragging}
            onBeginDrag={beginDrag}
            onMove={handlePointerMove}
            onUp={handleBarPointerUp}
            onCancel={handleDragCancel}
          />
        );
      }),
    };
  };

  const fixedInterestMonths = (data.params.interestPeriodYears ?? 10) * 12;
  const fixedInterestLeft = Math.max(0, ((0 - viewport.start) / viewport.span) * 100);
  const fixedInterestWidth = Math.max(0, Math.min(100, ((fixedInterestMonths - viewport.start) / viewport.span) * 100));
  const refinancingLeft = Math.max(0, ((fixedInterestMonths - viewport.start) / viewport.span) * 100);
  const refinancingWidth = Math.max(0, Math.min(100, ((CALCULATION_HORIZON_MONTHS - Math.max(viewport.start, fixedInterestMonths)) / viewport.span) * 100));
  const displayedFinancingRate = dragging?.id === 'financing-rate' ? dragging.currentAmount : draftFinancingRate;
  const displayedRefinancingRate = dragging?.id === 'refinancing-rate' ? dragging.currentAmount : draftRefinancingRate;
  const displayedTaxRate = dragging?.id === 'tax-rate' ? dragging.currentAmount : draftTaxRate;
  const earliest558Month = data.params.last558Date
    ? addMonths(data.params.last558Date, data.params.rentIncreaseIntervalMonths)
    : addMonths(data.params.rentStartYyyymm, data.params.rentIncreaseIntervalMonths);
  const earliest558Offset = Math.max(0, monthOffset(startYyyymm, earliest558Month));

  /**
   * Earliest month a given §558 increase may take effect, plus why.
   *
   * Three separate rules can bind, and the strictest wins. The sequence rule is
   * the one users hit without any explanation: an increase may not move in
   * front of its predecessor plus the 15-month waiting period, and the
   * recalculation used to silently snap it back with no message at all.
   */
  const earliest558For = (id: string): { offset: number; reason: string } => {
    const intervalMonths = data.params.rentIncreaseIntervalMonths;
    const candidates = [
      { offset: 3, reason: 'Eine Erhöhung kann frühestens ab dem 3. Monat wirksam werden.' },
      {
        offset: earliest558Offset,
        reason: `§558-Sperrfrist: frühestens ${earliest558Month} — ${intervalMonths} Monate nach der letzten Mieterhöhung.`,
      },
    ];

    const index = data.increases558.findIndex((item, position) => (item.id ?? `558-${position + 1}`) === id);
    const previous = index > 0 ? data.increases558[index - 1] : null;
    if (previous) {
      const previousMonth = previous.effectiveYyyymm;
      const earliestMonth = addMonths(previousMonth, intervalMonths);
      candidates.push({
        offset: monthOffset(startYyyymm, earliestMonth),
        reason: `Zwischen zwei Mieterhöhungen müssen ${intervalMonths} Monate liegen. Die vorherige Erhöhung wirkt ab ${previousMonth}, diese daher frühestens ab ${earliestMonth}.`,
      });
    }

    return candidates.reduce((strictest, candidate) => (
      candidate.offset > strictest.offset ? candidate : strictest
    ));
  };

  /** Blocked zone shown while a §558 bar is being dragged. */
  const draggedBlock = dragging?.kind === 'rent' && dragging.dateEditable
    ? earliest558For(dragging.id)
    : null;

  const baselineDateForCase = (item: RenovationCase) => {
    if (item.calculator_effective_yyyymm) return item.calculator_effective_yyyymm;
    const index = data.renovationCases.findIndex((candidate) => candidate.id === item.id);
    const offset = item.zeitpunkt === 'SOFORT' ? 3 : 6 + Math.max(0, index) * 3;
    return addMonths(startYyyymm, Math.max(3, offset));
  };
  const renovationChanges = data.modernizationPlan.flatMap((planItem) => {
    const source = data.renovationCases.find((item) => item.id === planItem.id);
    if (!source) return [];
    const originalDate = baselineDateForCase(source);
    const currentDate = planPlacement(planItem);
    const originalCost = costForCase(source);
    const currentCost = data.params.modernizationCostOverrides?.[planItem.id] ?? planItem.allocableCosts;
    const currentTiming = draftTimingOverrides[planItem.id] ?? source.zeitpunkt;
    if (originalDate === currentDate && originalCost === currentCost && source.zeitpunkt === currentTiming) return [];
    return [{ planItem, source, originalDate, currentDate, originalCost, currentCost, currentTiming }];
  });
  const rentChanges = Object.entries(data.params.rentIncreaseOverrides ?? {});
  const effectiveModernizationPlacements = Object.fromEntries(
    data.modernizationPlan.map((item) => [item.id, planPlacement(item)]),
  );
  const financingChanged = Math.abs(draftFinancingRate - initialValuesRef.current.financingRate) > 0.001;
  const refinancingChanged = Math.abs(draftRefinancingRate - initialValuesRef.current.refinancingRate) > 0.001;
  const equityChanged = draftEquity !== initialValuesRef.current.equityIncluded;
  const taxRateChanged = Math.abs(draftTaxRate - initialValuesRef.current.taxRate) > 0.001;
  const lossesOffsettableChanged = draftLossesOffsettable !== initialValuesRef.current.taxableLossesOffsettable;
  const changeCount = renovationChanges.length
    + rentChanges.length
    + Number(financingChanged)
    + Number(refinancingChanged)
    + Number(equityChanged)
    + Number(taxRateChanged)
    + Number(lossesOffsettableChanged);
  const blockedWidth = (endOffset: number) => {
    const visibleEnd = Math.min(viewport.start + viewport.span, endOffset);
    if (visibleEnd <= viewport.start) return 0;
    return Math.max(0, Math.min(100, ((visibleEnd - viewport.start) / viewport.span) * 100));
  };
  const blocked559Width = blockedWidth(3);
  const blocked558Width = blockedWidth(earliest558Offset);
  const draggedBlockWidth = draggedBlock ? blockedWidth(draggedBlock.offset) : 0;

  const modernizationTrack = buildTrack(data.modernizationPlan.map((item) => {
    const amount = data.params.modernizationCostOverrides?.[item.id] ?? item.allocableCosts;
    return {
      id: item.id,
      kind: 'modernization' as const,
      label: item.title,
      date: planPlacement(item),
      amount,
      maxAmount: Math.max(1000, amount * 3, item.allocableCosts * 3),
    };
  }));

  const effect559Track = buildTrack(data.modernizationPlan.map((item) => ({
    id: `${item.id}-559`,
    kind: 'rent' as const,
    label: item.title,
    date: planPlacement(item),
    amount: item.monthlyDelta,
    maxAmount: item.monthlyDelta,
    editable: false,
  })));

  const increases558Track = buildTrack(data.increases558.map((item, index) => ({
    id: item.id ?? `558-${index + 1}`,
    kind: 'rent' as const,
    label: item.sourceType === 'MANUAL' ? '§558 · Manuell' : '§558 · Mietspiegel',
    date: item.effectiveYyyymm,
    amount: item.monthlyDelta,
    maxAmount: item.legalMaximum,
  })));
  const blockedPattern = 'bg-[repeating-linear-gradient(135deg,rgba(100,116,139,.16),rgba(100,116,139,.16)_5px,transparent_5px,transparent_10px)]';

  return (
    <div className="relative border-t border-border pt-5">
      <div className="mb-4"><h2 className="text-lg font-medium text-foreground">Interaktive Planung</h2></div>
      <div className="overflow-hidden">
        <div className="w-full min-w-0">
          <div className="grid grid-cols-[15%_85%] border-t border-border">
            <div className="py-4 pr-3 font-medium">Sanierungen</div>
            <div
              data-gantt-track="true"
              className="relative bg-[repeating-linear-gradient(90deg,transparent,transparent_calc(20%-1px),theme(colors.border)_calc(20%-1px),theme(colors.border)_20%)]"
              style={{ height: `${modernizationTrack.heightPx}px` }}
              onPointerMove={handlePointerMove}
              onPointerUp={() => void finishDrag()}
            >
              {viewport.start === 0 && (
                <div
                  className="absolute inset-y-0 left-0 w-[2.5%] bg-[repeating-linear-gradient(135deg,rgba(100,116,139,.12),rgba(100,116,139,.12)_5px,transparent_5px,transparent_10px)]"
                  title="Vor dem Startmonat gesperrt"
                />
              )}
              {modernizationTrack.nodes}
            </div>
          </div>
          <div className="grid grid-cols-[15%_85%] border-t border-border">
            <div className="py-4 pr-3 font-medium">§559 Wirksamkeit</div>
            <div
              data-gantt-track="true"
              className="relative bg-[repeating-linear-gradient(90deg,transparent,transparent_calc(20%-1px),theme(colors.border)_calc(20%-1px),theme(colors.border)_20%)]"
              style={{ height: `${effect559Track.heightPx}px` }}
              onPointerMove={handlePointerMove}
              onPointerUp={() => void finishDrag()}
            >
              {blocked559Width > 0 && (
                <div
                  className={`absolute inset-y-0 left-0 z-10 ${blockedPattern}`}
                  style={{ width: `${blocked559Width}%` }}
                  title="§559-Wirksamkeitsfrist: Die erhöhte Miete wird frühestens ab dem dritten Monat nach Zugang der Erhöhungserklärung geschuldet."
                />
              )}
              {effect559Track.nodes}
            </div>
          </div>
          <div className="grid grid-cols-[15%_85%] border-t border-border">
            <div className="py-4 pr-3 font-medium">§558 Mieterhöhungen</div>
            <div
              data-gantt-track="true"
              className="relative bg-[repeating-linear-gradient(90deg,transparent,transparent_calc(20%-1px),theme(colors.border)_calc(20%-1px),theme(colors.border)_20%)]"
              style={{ height: `${increases558Track.heightPx}px` }}
              onPointerMove={handlePointerMove}
              onPointerUp={() => void finishDrag()}
            >
              {blocked558Width > 0 && (
                <div
                  className={`absolute inset-y-0 left-0 z-10 ${blockedPattern}`}
                  style={{ width: `${blocked558Width}%` }}
                  title={`§558-Sperrfrist: Früheste Wirksamkeit ${earliest558Month}; gewählter Abstand ${data.params.rentIncreaseIntervalMonths} Monate.`}
                />
              )}
              {/* Only while a §558 bar is being dragged: greys out everything it
                  cannot be moved into and names the rule responsible. */}
              {draggedBlock && draggedBlockWidth > 0 && (
                <div
                  className="absolute inset-y-0 left-0 z-30 flex items-center justify-end overflow-hidden border-r-2 border-[#d65b58] bg-[rgba(100,116,139,.22)] pr-2"
                  style={{ width: `${draggedBlockWidth}%` }}
                  title={draggedBlock.reason}
                >
                  <span className="truncate text-[10px] font-medium text-[#4b5563]">Nicht möglich</span>
                </div>
              )}
              {increases558Track.nodes}
            </div>
          </div>
          <div className="grid grid-cols-[15%_85%] border-t border-border">
            <div className="py-4 pr-3 font-medium">Finanzierung</div>
            <div
              data-gantt-track="true"
              className="relative h-14 bg-[repeating-linear-gradient(90deg,transparent,transparent_calc(20%-1px),theme(colors.border)_calc(20%-1px),theme(colors.border)_20%)]"
              onPointerMove={handlePointerMove}
              onPointerUp={handleBarPointerUp}
            >
              <div
                className={`absolute top-2 z-10 h-8 touch-none cursor-ns-resize overflow-hidden rounded-md border-2 border-[#9bbbd3] bg-[#245b88] px-2 py-2 text-[11px] font-semibold text-white shadow-sm ${dragging?.id === 'financing-rate' ? 'ring-2 ring-[#d99432] ring-offset-2' : ''}`}
                style={{ left: `${fixedInterestLeft}%`, width: `${fixedInterestWidth}%` }}
                onPointerDown={(event) => beginDrag(event, 'financing-rate', 'finance', fixedInterestLeft, draftFinancingRate, 25, false)}
                onPointerMove={handlePointerMove}
                onPointerUp={handleBarPointerUp}
                onPointerCancel={handleDragCancel}
                title="Finanzierungszins: Nach oben ziehen zum Erhöhen, nach unten zum Senken — mit gedrückter Umschalttaste feiner."
              >
                Zinsbindung {numberFormatter.format(displayedFinancingRate)} %
              </div>
              {refinancingWidth > 0 && refinancingLeft < 100 && (
                <div
                  className={`absolute top-2 z-20 h-8 touch-none cursor-ns-resize overflow-hidden rounded-md border-2 border-[#c2b8df] bg-[#8069bd] px-2 py-2 text-[11px] font-semibold text-white shadow-sm ${dragging?.id === 'refinancing-rate' ? 'ring-2 ring-[#d99432] ring-offset-2' : ''}`}
                  style={{ left: `${refinancingLeft}%`, width: `${refinancingWidth}%` }}
                  onPointerDown={(event) => beginDrag(event, 'refinancing-rate', 'finance', refinancingLeft, draftRefinancingRate, 25, false)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handleBarPointerUp}
                  onPointerCancel={handleDragCancel}
                  title="Anschlussfinanzierung: Nach oben ziehen zum Erhöhen, nach unten zum Senken — mit gedrückter Umschalttaste feiner."
                >
                  Anschlussfinanzierung {numberFormatter.format(displayedRefinancingRate)} %
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-[15%_85%] border-t border-border">
            <div className="py-4 pr-3 font-medium">Steuern</div>
            <div data-gantt-track="true" className="relative h-14 bg-[repeating-linear-gradient(90deg,transparent,transparent_calc(20%-1px),theme(colors.border)_calc(20%-1px),theme(colors.border)_20%)]" onPointerMove={handlePointerMove} onPointerUp={() => void finishDrag()}>
              <div
                className={`absolute inset-x-0 top-2 z-20 flex h-8 touch-none cursor-ns-resize items-center rounded-md border-2 border-[#f2d799] bg-[#d9a441] px-3 text-[11px] font-semibold text-[#34260b] shadow-sm ${dragging?.id === 'tax-rate' ? 'ring-2 ring-[#d65b58] ring-offset-2' : ''}`}
                onPointerDown={(event) => beginDrag(event, 'tax-rate', 'tax', 0, draftTaxRate, 45, false)}
                onPointerMove={handlePointerMove}
                onPointerUp={handleBarPointerUp}
                onPointerCancel={handleDragCancel}
                role="slider"
                tabIndex={0}
                aria-label="Grenzsteuersatz"
                aria-valuemin={0}
                aria-valuemax={45}
                aria-valuenow={displayedTaxRate}
                onKeyDown={(event) => {
                  if (!['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
                  event.preventDefault();
                  const requested = event.key === 'Home'
                    ? 0
                    : event.key === 'End'
                      ? 45
                      : draftTaxRate + (event.key === 'ArrowUp' || event.key === 'ArrowRight' ? 1 : -1);
                  const nextRate = event.key === 'Home' || event.key === 'End'
                    ? requested
                    : snapTaxPercent(draftTaxRate, requested);
                  setDraftTaxRate(nextRate);
                  void submit({
                    modernizationPlacements: data.params.modernizationPlacements ?? {},
                    modernizationCostOverrides: data.params.modernizationCostOverrides ?? {},
                    renovationTimingOverrides: draftTimingOverrides,
                    rentIncreaseOverrides: data.params.rentIncreaseOverrides ?? {},
                    financingInterestRateOverride: draftFinancingRate,
                    interestRateOverride: draftRefinancingRate,
                    equityIncluded: draftEquity,
                    taxRate: nextRate / 100,
                    taxableLossesOffsettable: draftLossesOffsettable,
                  });
                }}
                title="Grenzsteuersatz für die gesamte Laufzeit. Nach oben ziehen zum Erhöhen, nach unten zum Senken — mit gedrückter Umschalttaste feiner. Zulässig sind 0 bis 42 Prozent sowie 45 Prozent."
              >
                Grenzsteuersatz {numberFormatter.format(displayedTaxRate)} %
              </div>
            </div>
          </div>
          <div className="grid grid-cols-[15%_85%] border-t border-border">
            <div />
            <div className="flex min-h-12 flex-wrap items-center justify-between gap-3 py-2">
              <div className="flex items-center gap-3 text-sm text-foreground">
                <button
                  type="button"
                  role="switch"
                  aria-checked={draftLossesOffsettable}
                  aria-label="Steuerliche Verluste verrechenbar"
                  className={`relative h-6 w-11 rounded-full transition-colors ${draftLossesOffsettable ? 'bg-[#d9a441]' : 'bg-muted-foreground/35'}`}
                  onClick={() => {
                    const nextValue = !draftLossesOffsettable;
                    setDraftLossesOffsettable(nextValue);
                    void submit({
                      modernizationPlacements: data.params.modernizationPlacements ?? {},
                      modernizationCostOverrides: data.params.modernizationCostOverrides ?? {},
                      renovationTimingOverrides: draftTimingOverrides,
                      rentIncreaseOverrides: data.params.rentIncreaseOverrides ?? {},
                      financingInterestRateOverride: draftFinancingRate,
                      interestRateOverride: draftRefinancingRate,
                      equityIncluded: draftEquity,
                      taxRate: draftTaxRate / 100,
                      taxableLossesOffsettable: nextValue,
                    });
                  }}
                >
                  <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${draftLossesOffsettable ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span>Steuerliche Verluste verrechenbar: {draftLossesOffsettable ? 'An' : 'Aus'}</span>
              </div>
              <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={draftEquity} onChange={(event) => { setDraftEquity(event.target.checked); void submit({ modernizationPlacements: data.params.modernizationPlacements ?? {}, modernizationCostOverrides: data.params.modernizationCostOverrides ?? {}, renovationTimingOverrides: draftTimingOverrides, rentIncreaseOverrides: data.params.rentIncreaseOverrides ?? {}, financingInterestRateOverride: draftFinancingRate, interestRateOverride: draftRefinancingRate, equityIncluded: event.target.checked, taxRate: draftTaxRate / 100, taxableLossesOffsettable: draftLossesOffsettable }); }} /> Eigenkapital berücksichtigen</label>
            </div>
          </div>
          <div className="grid grid-cols-[15%_repeat(6,minmax(0,1fr))] text-xs text-muted-foreground"><div />{[0, .2, .4, .6, .8, 1].map((ratio) => { const offset = Math.min(CALCULATION_HORIZON_MONTHS - 1, Math.round(viewport.start + viewport.span * ratio)); return <div key={ratio} className="border-l border-border px-2 py-2 text-center">{addMonths(startYyyymm, offset)}</div>; })}</div>
          <TimelineRangeBar startYyyymm={startYyyymm} viewport={viewport} onChange={onViewportChange} />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><span className="text-sm text-muted-foreground">{message || 'Noch keine Änderung vorgemerkt.'}</span><button className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground" onClick={() => setShowApply(true)} disabled={isSaving}>Änderungen prüfen und übernehmen</button></div>
      {immediateMoveWarning && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="immediate-warning-title">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl">
            <h2 id="immediate-warning-title" className="text-lg font-medium">Sofort-Sanierung verschieben?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              „{immediateMoveWarning.massnahme}“ ist im Sanierungsreiter als „Sofort“ festgelegt. Zum Verschieben muss die Planung auf „Flexibel“ geändert werden.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button className="rounded-md border border-border px-3 py-2" onClick={() => setImmediateMoveWarning(null)}>Nicht verschieben</button>
              <button
                className="rounded-md bg-primary px-3 py-2 font-medium text-primary-foreground"
                onClick={async () => {
                  const nextTiming = { ...draftTimingOverrides, [immediateMoveWarning.id]: 'FLEXIBEL' as const };
                  const currentPlan = data.modernizationPlan.find((item) => item.id === immediateMoveWarning.id);
                  const nextPlacements = {
                    ...(data.params.modernizationPlacements ?? {}),
                    ...(currentPlan ? { [immediateMoveWarning.id]: planPlacement(currentPlan) } : {}),
                  };
                  setDraftTimingOverrides(nextTiming);
                  setImmediateMoveWarning(null);
                  await submit({
                    modernizationPlacements: nextPlacements,
                    modernizationCostOverrides: data.params.modernizationCostOverrides ?? {},
                    renovationTimingOverrides: nextTiming,
                    rentIncreaseOverrides: data.params.rentIncreaseOverrides ?? {},
                    financingInterestRateOverride: draftFinancingRate,
                    interestRateOverride: draftRefinancingRate,
                    equityIncluded: draftEquity,
                    taxRate: draftTaxRate / 100,
                    taxableLossesOffsettable: draftLossesOffsettable,
                  });
                  setMessage('Sanierung auf „Flexibel“ umgestellt. Sie kann jetzt verschoben werden.');
                }}
              >
                Auf Flexibel umstellen
              </button>
            </div>
          </div>
        </div>
      )}
      {showApply && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-lg border border-border bg-card p-6 shadow-xl">
            <h2 className="text-lg font-medium">Änderungen übernehmen?</h2>
            <p className="mt-1 text-sm text-muted-foreground">{changeCount} Änderung{changeCount === 1 ? '' : 'en'} {changeCount === 1 ? 'wird' : 'werden'} in die Detailseiten geschrieben.</p>
            <div className="my-5 space-y-3 overflow-y-auto pr-1 text-sm">
              {changeCount === 0 && <div className="rounded-md border border-border p-4 text-muted-foreground">Es wurden keine Werte verändert.</div>}
              {renovationChanges.length > 0 && (
                <details className="rounded-md border border-border" open>
                  <summary className="cursor-pointer px-4 py-3 font-medium">Sanierungen ({renovationChanges.length})</summary>
                  <div className="divide-y divide-border border-t border-border">
                    {renovationChanges.map((change) => (
                      <div key={change.planItem.id} className="space-y-2 px-4 py-3">
                        <div className="font-medium">{change.planItem.title}</div>
                        {change.originalDate !== change.currentDate && <div className="flex justify-between gap-4"><span>Wirksamkeit: {change.originalDate}</span><strong className="rounded bg-red-50 px-2 py-0.5 text-red-700">{change.currentDate}</strong></div>}
                        {change.originalCost !== change.currentCost && <div className="flex justify-between gap-4"><span>Betrag: {formatCurrency(change.originalCost)}</span><strong className="rounded bg-red-50 px-2 py-0.5 text-red-700">{formatCurrency(change.currentCost)}</strong></div>}
                        {change.source.zeitpunkt !== change.currentTiming && <div className="flex justify-between gap-4"><span>Planung: {change.source.zeitpunkt === 'SOFORT' ? 'Sofort' : 'Flexibel'}</span><strong className="rounded bg-red-50 px-2 py-0.5 text-red-700">{change.currentTiming === 'SOFORT' ? 'Sofort' : 'Flexibel'}</strong></div>}
                      </div>
                    ))}
                  </div>
                </details>
              )}
              {rentChanges.length > 0 && (
                <details className="rounded-md border border-border">
                  <summary className="cursor-pointer px-4 py-3 font-medium">§558-Mieterhöhungen ({rentChanges.length})</summary>
                  <div className="divide-y divide-border border-t border-border">
                    {rentChanges.map(([id, change]) => <div key={id} className="flex flex-wrap justify-between gap-3 px-4 py-3"><span>{id}</span><span className="space-x-2">{change.effectiveYyyymm && <strong className="rounded bg-red-50 px-2 py-0.5 text-red-700">{change.effectiveYyyymm}</strong>}{change.monthlyDelta != null && <strong className="rounded bg-red-50 px-2 py-0.5 text-red-700">+{formatCurrency(change.monthlyDelta)} / Monat</strong>}</span></div>)}
                  </div>
                </details>
              )}
              {(financingChanged || refinancingChanged || equityChanged) && (
                <details className="rounded-md border border-border" open>
                  <summary className="cursor-pointer px-4 py-3 font-medium">Finanzierung</summary>
                  <div className="space-y-2 border-t border-border px-4 py-3">
                    {financingChanged && <div className="flex justify-between gap-4"><span>Zins: {numberFormatter.format(initialValuesRef.current.financingRate)} %</span><strong className="rounded bg-red-50 px-2 py-0.5 text-red-700">{numberFormatter.format(draftFinancingRate)} %</strong></div>}
                    {refinancingChanged && <div className="flex justify-between gap-4"><span>Anschlusszins: {numberFormatter.format(initialValuesRef.current.refinancingRate)} %</span><strong className="rounded bg-red-50 px-2 py-0.5 text-red-700">{numberFormatter.format(draftRefinancingRate)} %</strong></div>}
                    {equityChanged && <div className="flex justify-between gap-4"><span>Eigenkapital: {initialValuesRef.current.equityIncluded ? 'berücksichtigt' : 'nicht berücksichtigt'}</span><strong className="rounded bg-red-50 px-2 py-0.5 text-red-700">{draftEquity ? 'berücksichtigt' : 'nicht berücksichtigt'}</strong></div>}
                  </div>
                </details>
              )}
              {(taxRateChanged || lossesOffsettableChanged) && (
                <details className="rounded-md border border-border" open>
                  <summary className="cursor-pointer px-4 py-3 font-medium">Steuern</summary>
                  <div className="space-y-2 border-t border-border px-4 py-3">
                    {taxRateChanged && <div className="flex justify-between gap-4"><span>Grenzsteuersatz: {numberFormatter.format(initialValuesRef.current.taxRate)} %</span><strong className="rounded bg-red-50 px-2 py-0.5 text-red-700">{numberFormatter.format(draftTaxRate)} %</strong></div>}
                    {lossesOffsettableChanged && <div className="flex justify-between gap-4"><span>Verlustverrechnung: {initialValuesRef.current.taxableLossesOffsettable ? 'An' : 'Aus'}</span><strong className="rounded bg-red-50 px-2 py-0.5 text-red-700">{draftLossesOffsettable ? 'An' : 'Aus'}</strong></div>}
                  </div>
                </details>
              )}
              <div className="flex justify-between gap-4 rounded-md border border-border px-4 py-3"><span>Break-even nach Änderung</span><strong>{data.breakEven ?? 'nicht erreicht'}</strong></div>
            </div>
            <div className="flex justify-end gap-2">
              <button className="rounded-md border border-border px-3 py-2" onClick={() => setShowApply(false)}>Abbrechen</button>
              <button
                className="rounded-md bg-primary px-3 py-2 font-medium text-primary-foreground disabled:opacity-50"
                disabled={changeCount === 0}
                onClick={async () => {
                  await onApply({
                    modernizationPlacements: effectiveModernizationPlacements,
                    modernizationCostOverrides: data.params.modernizationCostOverrides ?? {},
                    renovationTimingOverrides: draftTimingOverrides,
                    rentIncreaseOverrides: data.params.rentIncreaseOverrides ?? {},
                    financingInterestRateOverride: draftFinancingRate,
                    interestRateOverride: draftRefinancingRate,
                    equityIncluded: draftEquity,
                    taxRate: draftTaxRate / 100,
                    taxableLossesOffsettable: draftLossesOffsettable,
                  });
                  setShowApply(false);
                  setMessage('Änderungen übernommen. Detailseiten sind synchronisiert.');
                }}
              >
                Übernehmen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
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
  const [last559MonthlyDelta, setLast559MonthlyDelta] = useState('');
  const [rentIncreaseIntervalMonths, setRentIncreaseIntervalMonths] = useState(15);
  const [rentIncreaseUtilizationPercent, setRentIncreaseUtilizationPercent] = useState(100);
  const [mode, setMode] = useState<CalculatorMode>('KNOWN');
  const [placementMode, setPlacementMode] = useState<PlacementMode>('DEFAULT');
  const [interestRate, setInterestRate] = useState(0);
  const [equityIncluded, setEquityIncluded] = useState(false);
  const [timelineViewport, setTimelineViewport] = useState<TimelineViewport>({ start: 0, span: 120 });
  const [showRentIndexComparison, setShowRentIndexComparison] = useState(false);
  const [showImportedDetails, setShowImportedDetails] = useState(false);
  const [openTables, setOpenTables] = useState({
    timeline: false,
    modernization: false,
    increases: false,
    cashflow: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const lastLiveCalculationRef = useRef('');
  const resetRentPlanRef = useRef(false);
  const recalcRef = useRef<(nextMode?: CalculatorMode) => Promise<void>>(async () => undefined);

  const visibleTimeline = useMemo(() => data?.timeline ?? [], [data]);
  const chartRows = useMemo(() => buildChartRows(visibleTimeline), [visibleTimeline]);
  const startMonthError = startYyyymm && !/^\d{4}-(0[1-9]|1[0-2])$/.test(startYyyymm)
    ? 'Bitte einen gültigen Monat wählen.'
    : undefined;
  const last558Error = last558Date && !/^\d{4}-(0[1-9]|1[0-2])$/.test(last558Date)
    ? 'Bitte einen gültigen Monat wählen.'
    : undefined;
  const last559Error = last559Date && !/^\d{4}-(0[1-9]|1[0-2])$/.test(last559Date)
    ? 'Bitte einen gültigen Monat wählen.'
    : undefined;

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
        setLast559MonthlyDelta(valueString(loaded.params.last559MonthlyDelta));
        setRentIncreaseIntervalMonths(loaded.params.rentIncreaseIntervalMonths ?? 15);
        setRentIncreaseUtilizationPercent(loaded.params.rentIncreaseUtilizationPercent ?? 100);
        setMode(loaded.params.mode);
        setPlacementMode(loaded.placementMode ?? loaded.params.placementMode ?? 'DEFAULT');
        setInterestRate(loaded.params.refinancingInterestRate ?? loaded.params.interestRate ?? 0);
        setEquityIncluded(loaded.params.equityIncluded === true);
        lastLiveCalculationRef.current = JSON.stringify({
          startYyyymm: loaded.params.startYyyymm,
          monthlyRentStart: valueString(loaded.params.monthlyRentStart),
          rentIndexPerM2: valueString(loaded.params.rentIndexPerM2),
          rentIndexSource: loaded.params.rentIndexSource ?? loaded.rentIndexSource ?? 'AUTOMATIC',
          last558Date: loaded.params.last558Date ?? '',
          last559Date: loaded.params.last559Date ?? '',
          last559MonthlyDelta: valueString(loaded.params.last559MonthlyDelta),
          rentIncreaseIntervalMonths: loaded.params.rentIncreaseIntervalMonths ?? 15,
          rentIncreaseUtilizationPercent: loaded.params.rentIncreaseUtilizationPercent ?? 100,
        });
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

  const recalc = async (nextMode = mode, navigate = false, optimize = false, overrides?: Partial<CalculatorOverrides>, apply = false) => {
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
          last559MonthlyDelta: parseDecimalInput(last559MonthlyDelta),
          rentIncreaseIntervalMonths,
          rentIncreaseUtilizationPercent,
          mode: nextMode,
          optimize,
          financingInterestRateOverride: overrides?.financingInterestRateOverride ?? data?.params.financingInterestRateOverride ?? null,
          interestRateOverride: overrides?.interestRateOverride ?? (interestRate || null),
          equityIncluded: overrides?.equityIncluded ?? equityIncluded,
          taxRate: overrides?.taxRate ?? data?.params.taxRate ?? 0.42,
          taxableLossesOffsettable: overrides?.taxableLossesOffsettable ?? data?.params.taxableLossesOffsettable ?? false,
          modernizationPlacements: overrides?.modernizationPlacements ?? data?.params.modernizationPlacements,
          modernizationCostOverrides: overrides?.modernizationCostOverrides ?? data?.params.modernizationCostOverrides,
          renovationTimingOverrides: overrides?.renovationTimingOverrides ?? data?.params.renovationTimingOverrides,
          resetRentIncreasePlan: optimize || resetRentPlanRef.current,
          rentIncreaseOverrides: optimize || resetRentPlanRef.current ? {} : (overrides?.rentIncreaseOverrides ?? data?.params.rentIncreaseOverrides),
          apply,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = await res.json() as CalculatorResponse;
      setData(updated);
      setMode(updated.params.mode);
      setPlacementMode(updated.placementMode ?? 'DEFAULT');
      setInterestRate(updated.params.refinancingInterestRate ?? updated.params.interestRate ?? 0);
      setEquityIncluded(updated.params.equityIncluded === true);
      resetRentPlanRef.current = false;
      setHasPendingChanges(!apply);
      if (navigate) router.push(`/property-valuation/detail-check/macro-location${suffix}`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Kalkulation konnte nicht gespeichert werden.');
    } finally {
      setIsSaving(false);
    }
  };
  recalcRef.current = recalc;

  useEffect(() => {
    if (isLoading || isSaving || !data || startMonthError || last558Error || last559Error || !startYyyymm || monthlyRentStart === '') return;

    const signature = JSON.stringify({ startYyyymm, monthlyRentStart, rentIndexPerM2, rentIndexSource, last558Date, last559Date, last559MonthlyDelta, rentIncreaseIntervalMonths, rentIncreaseUtilizationPercent });
    if (signature === lastLiveCalculationRef.current) return;

    const timer = window.setTimeout(() => {
      lastLiveCalculationRef.current = signature;
      void recalcRef.current(mode);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [data, isLoading, isSaving, last558Date, last558Error, last559Date, last559Error, last559MonthlyDelta, mode, monthlyRentStart, rentIndexPerM2, rentIndexSource, rentIncreaseIntervalMonths, rentIncreaseUtilizationPercent, startMonthError, startYyyymm]);

  const handleModeChange = (value: string) => {
    const nextMode = value === 'POTENTIAL' ? 'POTENTIAL' : 'KNOWN';
    setMode(nextMode);
    void recalc(nextMode);
  };

  const navigateWithConfirmation = (path: string) => {
    if (hasPendingChanges) setPendingNavigation(path);
    else router.push(path);
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
          onClick={() => navigateWithConfirmation(`/property-valuation/detail-check/macro-location${suffix}`)}
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
          <div className="flex flex-col gap-8">
            <section className="order-1">
              <div className="mb-4 flex flex-wrap items-center gap-4">
                <div>
                  <h2 className="text-lg font-medium text-foreground">Cashflow und Planung</h2>
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
              <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-6">
                <div className="relative overflow-hidden">
                  <TimelineEventConnectors rows={chartRows} viewport={timelineViewport} />
                  <CalculatorChart rows={chartRows} showRentIndex={showRentIndexComparison} viewport={timelineViewport} />
                  <PlanEditor
                    data={data}
                    startYyyymm={startYyyymm}
                    equityIncluded={equityIncluded}
                    viewport={timelineViewport}
                    isSaving={isSaving}
                    onViewportChange={setTimelineViewport}
                    onChange={(overrides) => recalc(mode, false, false, overrides)}
                    onApply={(overrides) => recalc(mode, false, false, overrides, true)}
                  />
                </div>
              </div>
            </section>

            <section className="order-2 flex flex-col">
              <div className="order-1 mb-4 flex items-center gap-4">
                <h2 className="rounded-lg border border-border bg-card px-4 py-2 text-lg font-medium text-foreground">
                  Parameter
                </h2>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="order-2 grid gap-4 lg:grid-cols-4 md:grid-cols-2">
                <MonthField label="Start in Jahr/Monat" value={startYyyymm} error={startMonthError} onChange={setStartYyyymm} />
                <MonthField label="Letzte Mieterhöhung §558" value={last558Date} error={last558Error} optional years={LAST_558_YEARS} onChange={setLast558Date} />
                <MonthField label="Letzte §559-Erhöhung" value={last559Date} error={last559Error} optional years={LAST_559_YEARS} onChange={setLast559Date} />
                <TextField label="Betrag der letzten §559-Erhöhung" value={last559MonthlyDelta} suffix="€/Monat" inputMode="decimal" disabled={!last559Date} onChange={(event) => setLast559MonthlyDelta(event.target.value)} helperText="Wird auf den gesetzlichen Sechsjahres-Deckel angerechnet." />
                <TextField label="Mietspiegel Vergleichswert" value={rentIndexPerM2} suffix="€/m²" inputMode="decimal" onChange={(e) => { setRentIndexPerM2(e.target.value); setRentIndexSource('MANUAL'); }} helperText="Automatisch aus Baujahr/Fläche, solange nicht überschrieben." />
              </div>

              <div className="order-3 mt-5 border-y border-border py-3">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 text-left font-medium text-foreground"
                  aria-expanded={showImportedDetails}
                  onClick={() => setShowImportedDetails((current) => !current)}
                >
                  <span>Übernommene Angaben aus den vorherigen Schritten</span>
                  {showImportedDetails ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {showImportedDetails && (
                  <div className="mt-4 grid gap-4 border-t border-border pt-4 md:grid-cols-2 lg:grid-cols-3">
                    <ReadOnlyField label="Größe · Objektdaten" value={`${numberFormatter.format(data.params.livingAreaM2)} m²`} />
                    <ReadOnlyField label="Ort / PLZ · Objektdaten" value={`${data.params.city || '-'} ${data.params.postalCode || ''}`.trim()} />
                    <ReadOnlyField label="Finanzierungsvariante · Finanzierung" value={data.selectedFinancingVariant === 'INDIVIDUAL' ? 'Individuell' : 'Angebot'} />
                    <ReadOnlyField label="Kapitaldienst Monat · Finanzierung" value={formatCurrency(data.params.monthlyDebtService)} />
                    <ReadOnlyField label="AfA pro Monat · Abschreibung" value={formatCurrency(data.timeline[0]?.afa ?? 0)} />
                    <ReadOnlyField label="Nicht umlagefähige Kosten · Vermietung" value={formatCurrency(data.timeline[0]?.nonAllocableCosts ?? 0)} />
                    <ReadOnlyField label="Erste Vermietung ab Kauf · Vermietung" value={formatMonth(data.params.rentStartYyyymm)} />
                  </div>
                )}
              </div>

              <div className="order-4 mt-5 grid gap-4 border-y border-border py-5 lg:grid-cols-2">
                <label className="block min-w-0">
                  <span className="mb-2 flex items-center justify-between gap-3 text-sm font-medium text-foreground">
                    <span>Abstand der §558-Mieterhöhungen</span>
                    <output className="shrink-0 text-primary">{rentIncreaseIntervalMonths === 15 ? 'Gesetzliches Minimum · 15 Monate' : `${rentIncreaseIntervalMonths} Monate`}</output>
                  </span>
                  <input type="range" min={15} max={60} step={1} value={rentIncreaseIntervalMonths} onChange={(event) => { resetRentPlanRef.current = true; setRentIncreaseIntervalMonths(Number(event.target.value)); }} className="w-full accent-primary" />
                  <span className="mt-1 flex justify-between text-xs text-muted-foreground"><span>15 Monate</span><span>60 Monate</span></span>
                </label>
                <label className="block min-w-0">
                  <span className="mb-2 flex items-center justify-between gap-3 text-sm font-medium text-foreground">
                    <span>Nutzung des zulässigen Erhöhungsspielraums</span>
                    <output className="shrink-0 text-primary">{numberFormatter.format(rentIncreaseUtilizationPercent)} %</output>
                  </span>
                  <input type="range" min={0} max={100} step={0.1} value={rentIncreaseUtilizationPercent} onChange={(event) => { resetRentPlanRef.current = true; setRentIncreaseUtilizationPercent(Number(event.target.value)); }} className="w-full accent-primary" />
                  <span className="mt-1 flex justify-between text-xs text-muted-foreground"><span>0 %</span><span>Gesetzliches Maximum · 100 %</span></span>
                </label>
              </div>

              <div className="order-7 mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Kaltmiete heute"
                  value={formatCurrency(data.params.monthlyRentStart)}
                  detail="Aus der Vermietung übernommen"
                />
                <MetricCard
                  label="Break-even nach Steuern"
                  value={formatMonth(data.breakEven)}
                  detail="Wird live aus der Planung berechnet"
                  tone={data.breakEven ? 'positive' : 'warning'}
                />
                <MetricCard
                  label={`Miete in ${CALCULATION_HORIZON_YEARS} Jahren`}
                  value={formatCurrency(data.metrics.rentAtHorizon)}
                  detail="Basisszenario der aktuellen Planung"
                />
                <MetricCard
                  label="Planstatus"
                  value="regelkonform"
                  detail={`${data.modernizationPlan.length} Sanierungen · ${data.increases558.length} §558-Erhöhungen`}
                  tone="positive"
                />
              </div>

              <div className="order-8 mt-5">
                <CalculatedPanel
                  title="Berechnete Kennzahlen"
                  description="Automatisch aus Parametern, Finanzierung, Steuern und Zeitplanung ermittelt"
                >
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <ReadOnlyField label="Kappungsgrenze" value={`${data.denseMarket ? 'Ballungsgebiet' : 'Regelfall'} · ${formatPercent(data.capPercent)}`} />
                    <ReadOnlyField label="§559-Deckel" value={`${formatCurrency(data.capAbs)} / Monat`} />
                    <ReadOnlyField label="Verfügbarer §559-Spielraum" value={`${formatCurrency(data.remaining559Room)} / Monat`} helperText={data.previous559Used > 0 ? `${formatCurrency(data.previous559Used)} aus früherer Erhöhung berücksichtigt` : 'Keine frühere §559-Erhöhung im Sechsjahresfenster'} />
                    <ReadOnlyField label="Break-even mit Mietspiegel" value={formatMonth(data.breakEvenWithRentIndex)} />
                    <ReadOnlyField label="Mietspiegelquelle" value={data.rentIndexSource === 'MANUAL' ? 'Manuelle Eingabe' : 'Automatisch aus Baujahr/Fläche'} />
                    <ReadOnlyField label="Cashflow heute" value={formatCurrency(data.metrics.cashflowToday)} />
                    <ReadOnlyField label="Nettomietrendite heute" value={formatPercentValue(data.metrics.netYieldToday)} />
                    <ReadOnlyField label={`Miete nach ${CALCULATION_HORIZON_YEARS} Jahren mit Mietspiegel`} value={formatCurrency(data.metrics.rentAtHorizonWithRentIndex)} />
                    <ReadOnlyField label={`Kumulierter Cashflow nach ${CALCULATION_HORIZON_YEARS} Jahren`} value={formatCurrency(data.metrics.endingCashflow)} />
                  </div>
                </CalculatedPanel>
                </div>

              <div className="order-5 mt-6 grid gap-4 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)] md:items-end">
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

              <div className="order-6 mt-4 flex flex-wrap gap-3">
                <Button
                  label="Neu berechnen"
                  onClick={() => { resetRentPlanRef.current = true; void recalc(mode); }}
                  disabled={isSaving}
                />
                <Button
                  label="Sanierungen und Mieterhöhungen optimieren"
                  variant="outline"
                  icon={<Sparkles />}
                  onClick={() => recalc(mode, false, true)}
                  disabled={isSaving || mode === 'POTENTIAL'}
                />
              </div>
              {placementMode === 'OPTIMIZED' && (
                <p className="order-6 mt-3 text-sm text-muted-foreground">
                  Sanierungen und daraus folgende §558-Mieterhöhungen sind anhand der Regler auf den frühestmöglichen Break-even optimiert.
                </p>
              )}
            </section>

            <section className="order-3 space-y-4">
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
                          <th className="px-4 py-3 text-right font-medium">Ausgaben vor Steuer</th>
                          <th className="px-4 py-3 text-right font-medium">Steuern</th>
                          <th className="px-4 py-3 text-right font-medium">Cashflow nach Steuer</th>
                          <th className="px-4 py-3 text-right font-medium">Cum Einnahmen</th>
                          <th className="px-4 py-3 text-right font-medium">Cum Ausgaben inkl. Steuer</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleTimeline.map((row) => (
                          <tr key={`cash-${row.yyyymm}`} className="border-t border-border even:bg-muted/30">
                            <td className="px-4 py-3">{row.yyyymm}</td>
                            <td className="px-4 py-3 text-right">{formatCurrency(row.income)}</td>
                            <td className="px-4 py-3 text-right">{formatCurrency(row.expenses)}</td>
                            <td className="px-4 py-3 text-right">{formatCurrency(row.taxes)}</td>
                            <td className="px-4 py-3 text-right">{formatCurrency(row.afterTaxCashflow)}</td>
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
        onGhost={() => navigateWithConfirmation(`/property-valuation/detail-check/renovation${suffix}`)}
        primaryLabel="Weiter"
        primaryIcon={<BUTTON_DETAILS.Next.icon />}
        primaryDisabled={isLoading || isSaving}
        onPrimary={() => hasPendingChanges ? setPendingNavigation(`/property-valuation/detail-check/macro-location${suffix}`) : recalc(mode, true, false, undefined, true)}
      />
      {pendingNavigation && <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-xl"><h2 className="text-lg font-medium">Änderungen übernehmen?</h2><p className="mt-1 text-sm text-muted-foreground">Du verlässt den Kalkulator. Diese Werte wurden geändert:</p><ul className="my-4 list-disc space-y-1 pl-5 text-sm"><li>Sanierungs- und Mietzeitpunkte</li><li>Mietanpassungen</li><li>Finanzierungszinssatz und Break-even</li></ul><div className="flex justify-end gap-2"><button className="rounded-md border border-border px-3 py-2" onClick={() => { setPendingNavigation(null); setHasPendingChanges(false); }}>Hier bleiben</button><button className="rounded-md bg-primary px-3 py-2 font-medium text-primary-foreground" onClick={async () => { const nextPath = pendingNavigation; await recalc(mode, false, false, undefined, true); setPendingNavigation(null); setHasPendingChanges(false); if (nextPath) router.push(nextPath); }}>Übernehmen und weiter</button></div></div></div>}
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
