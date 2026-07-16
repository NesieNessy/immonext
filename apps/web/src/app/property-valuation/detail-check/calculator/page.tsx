"use client";

import { Button, Dropdown, StickyActionBar, TextField } from '@/components/ui';
import { BUTTON_DETAILS } from '@/constants/ButtonLabels';
import { parseDecimalInput } from '@/lib/detailCheck/acquisitionCosts';
import { type CalculatorMode, type ModernizationPlanRow, type RentIncrease558Row, type RentTimelineRow } from '@/lib/detailCheck/rentCalculator';
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
    monthlyDebtService: number;
    mode: CalculatorMode;
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

function CalculatorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quickCheckId = searchParams.get('quickCheckId');
  const suffix = quickCheckId ? `?quickCheckId=${quickCheckId}` : '';

  const [data, setData] = useState<CalculatorResponse | null>(null);
  const [startYyyymm, setStartYyyymm] = useState('');
  const [monthlyRentStart, setMonthlyRentStart] = useState('');
  const [rentIndexPerM2, setRentIndexPerM2] = useState('');
  const [last558Date, setLast558Date] = useState('');
  const [last559Date, setLast559Date] = useState('');
  const [mode, setMode] = useState<CalculatorMode>('KNOWN');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visibleTimeline = useMemo(() => data?.timeline ?? [], [data]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/detail-check/calculator${suffix}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(await res.text());
        const loaded = await res.json() as CalculatorResponse;
        if (cancelled) return;
        setData(loaded);
        setStartYyyymm(loaded.params.startYyyymm);
        setMonthlyRentStart(valueString(loaded.params.monthlyRentStart));
        setRentIndexPerM2(valueString(loaded.params.rentIndexPerM2));
        setLast558Date(loaded.params.last558Date ?? '');
        setLast559Date(loaded.params.last559Date ?? '');
        setMode(loaded.params.mode);
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

  const recalc = async (nextMode = mode, navigate = false) => {
    if (isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/detail-check/calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quickCheckId,
          startYyyymm,
          monthlyRentStart: parseDecimalInput(monthlyRentStart),
          rentIndexPerM2: rentIndexPerM2 === '' ? null : parseDecimalInput(rentIndexPerM2),
          last558Date: last558Date || null,
          last559Date: last559Date || null,
          mode: nextMode,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = await res.json() as CalculatorResponse;
      setData(updated);
      setMode(updated.params.mode);
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
                <TextField label="Mietspiegel Vergleichswert" value={rentIndexPerM2} suffix="€/m²" inputMode="decimal" onChange={(e) => setRentIndexPerM2(e.target.value)} helperText="Leer = Fallback aus Startmiete pro m² + 2%." />
                <ReadOnlyValue label="Größe" value={`${numberFormatter.format(data.params.livingAreaM2)} m²`} />
                <ReadOnlyValue label="Ort / PLZ" value={`${data.params.city || '-'} ${data.params.postalCode || ''}`.trim()} />
                <ReadOnlyValue label="Kappungsgrenze" value={`${data.denseMarket ? 'Ballungsgebiet' : 'Regelfall'} · ${formatPercent(data.capPercent)}`} />
                <ReadOnlyValue label="Finanzierungsvariante" value={data.selectedFinancingVariant === 'INDIVIDUAL' ? 'Individuell' : 'Angebot'} />
                <ReadOnlyValue label="Kapitaldienst Monat" value={formatCurrency(data.params.monthlyDebtService)} />
                <ReadOnlyValue label="§559-Deckel" value={`${formatCurrency(data.capAbs)} / Monat`} />
                <ReadOnlyValue label="Break Even Point" value={data.breakEven ?? 'nicht erreicht'} />
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

              <Button
                label="Neu berechnen"
                className="mt-4"
                onClick={() => recalc(mode)}
                disabled={isSaving}
              />
            </section>

            <section>
              <div className="mb-4 flex items-center gap-4">
                <h2 className="rounded-lg border border-border bg-card px-4 py-2 text-lg font-medium text-foreground">
                  Mietentwicklung
                </h2>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="max-h-[420px] overflow-auto rounded-lg border border-border">
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
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <div>
                <div className="mb-4 flex items-center gap-4">
                  <h2 className="rounded-lg border border-border bg-card px-4 py-2 text-lg font-medium text-foreground">
                    Modernisierungsmaßnahmen
                  </h2>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="overflow-hidden rounded-lg border border-border">
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
              </div>

              <div>
                <div className="mb-4 flex items-center gap-4">
                  <h2 className="rounded-lg border border-border bg-card px-4 py-2 text-lg font-medium text-foreground">
                    §558-Erhöhungen
                  </h2>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="overflow-hidden rounded-lg border border-border">
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
              </div>
            </section>

            <section>
              <div className="mb-4 flex items-center gap-4">
                <h2 className="rounded-lg border border-border bg-card px-4 py-2 text-lg font-medium text-foreground">
                  Einnahmen und Ausgaben
                </h2>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="max-h-[360px] overflow-auto rounded-lg border border-border">
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
