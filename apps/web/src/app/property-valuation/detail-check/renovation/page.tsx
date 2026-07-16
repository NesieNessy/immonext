"use client";

import { Button, Dropdown, StickyActionBar, TextArea, TextField } from '@/components/ui';
import { BUTTON_DETAILS } from '@/constants/ButtonLabels';
import { authFetch } from '@/lib/api/authFetch';
import { parseDecimalInput } from '@/lib/detailCheck/acquisitionCosts';
import {
  aggregateRenovationPricing,
  categoryLabel,
  costForCase,
  RENOVATION_CATEGORIES,
  RENOVATION_MEASURES,
  type RenovationCase,
  type RenovationCategory,
  type RenovationFinancingMode,
  type RenovationTiming,
} from '@/lib/detailCheck/renovation';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { PropertyValuationLayout } from '../PropertyValuationLayout';

type Stage = 'ENTRY' | 'PRICING';

type RenovationResponse = {
  cases: RenovationCase[];
  pricing: {
    sum_min: number;
    sum_max: number;
    sum_mid: number;
    sum_selected: number;
  };
  financing: {
    mode: RenovationFinancingMode;
    financedAmount: number;
  };
  context: {
    postalCode: string;
    livingAreaM2: number;
  };
};

const currencyFormatter = new Intl.NumberFormat('de-DE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatCurrency(value: number): string {
  return `${currencyFormatter.format(value)} €`;
}

function idForCase() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function measureOptions(category: RenovationCategory | '') {
  return [
    { value: '', label: 'Bitte wählen...' },
    ...((category ? RENOVATION_MEASURES[category] : []) ?? []).map((measure) => ({
      value: measure,
      label: measure,
    })),
  ];
}

function ReadOnlyPill({ value }: { value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted px-4 py-2 text-right font-medium text-foreground">
      {value}
    </div>
  );
}

function RenovationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quickCheckId = searchParams.get('quickCheckId');
  const workflowId = searchParams.get('workflowId');
  const suffix = quickCheckId ? `?quickCheckId=${encodeURIComponent(quickCheckId)}` : workflowId ? `?workflowId=${encodeURIComponent(workflowId)}` : '';

  const [stage, setStage] = useState<Stage>('ENTRY');
  const [cases, setCases] = useState<RenovationCase[]>([]);
  const [category, setCategory] = useState<RenovationCategory | ''>('');
  const [measure, setMeasure] = useState('');
  const [description, setDescription] = useState('');
  const [uploadNames, setUploadNames] = useState<string[]>([]);
  const [sumSelected, setSumSelected] = useState(0);
  const [financingMode, setFinancingMode] = useState<RenovationFinancingMode>('FREMD');
  const [financedAmount, setFinancedAmount] = useState('');
  const [context, setContext] = useState<RenovationResponse['context'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await authFetch(`/api/detail-check/renovation${suffix}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json() as RenovationResponse;
        if (cancelled) return;
        setCases(data.cases);
        setContext(data.context);
        setSumSelected(data.pricing.sum_selected);
        setFinancingMode(data.financing.mode);
        setFinancedAmount(String(data.financing.financedAmount || '').replace('.', ','));
        if (data.cases.length > 0) setStage('PRICING');
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Sanierung konnte nicht geladen werden.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [suffix]);

  const totals = useMemo(() => aggregateRenovationPricing(cases), [cases]);

  useEffect(() => {
    if (totals.sum_max <= 0) {
      setSumSelected(0);
      return;
    }
    setSumSelected((prev) => {
      if (prev <= 0) return totals.sum_mid;
      return Math.max(totals.sum_min, Math.min(totals.sum_max, prev));
    });
  }, [totals.sum_min, totals.sum_mid, totals.sum_max]);

  useEffect(() => {
    if (financingMode === 'FREMD') setFinancedAmount(String(sumSelected).replace('.', ','));
    if (financingMode === 'EIGEN') setFinancedAmount('');
  }, [financingMode, sumSelected]);

  const addCase = () => {
    if (!category || !measure) {
      setError('Bitte wählen Sie Kategorie und Maßnahme aus.');
      return;
    }
    setError(null);
    setCases((prev) => [
      ...prev,
      {
        id: idForCase(),
        kategorie: category,
        massnahme: measure,
        beschreibung: description.trim(),
        uploads: uploadNames,
        selected: true,
        zeitpunkt: 'SOFORT',
        publish_order: false,
      },
    ]);
    setMeasure('');
    setDescription('');
    setUploadNames([]);
  };

  const evaluateCases = async () => {
    if (cases.length === 0) {
      setError('Bitte legen Sie mindestens einen Sanierungsfall an.');
      return false;
    }
    setIsSaving(true);
    setError(null);
    try {
      const res = await authFetch('/api/detail-check/renovation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quickCheckId,
          workflowId,
          cases,
          pricing: { sum_selected: sumSelected || totals.sum_mid },
          financing: {
            mode: financingMode,
            financedAmount: parseDecimalInput(financedAmount),
          },
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json() as RenovationResponse;
      setCases(data.cases);
      setSumSelected(data.pricing.sum_selected);
      setFinancingMode(data.financing.mode);
      setFinancedAmount(String(data.financing.financedAmount || '').replace('.', ','));
      setStage('PRICING');
      return true;
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Sanierung konnte nicht ausgewertet werden.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const saveAndNext = async () => {
    const ok = await evaluateCases();
    if (ok && stage === 'PRICING') router.push(`/property-valuation/detail-check/calculator${suffix}`);
  };

  const continueWithoutRenovations = async () => {
    if (isSaving) return;

    setIsSaving(true);
    setError(null);
    try {
      const res = await authFetch('/api/detail-check/renovation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quickCheckId,
          workflowId,
          cases: [],
          pricing: { sum_selected: 0 },
          financing: { mode: 'FREMD', financedAmount: 0 },
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      router.push(`/property-valuation/detail-check/calculator${suffix}`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Sanierung konnte nicht übersprungen werden.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateCase = (id: string, patch: Partial<RenovationCase>) => {
    setCases((prev) => prev.map((item) => item.id === id ? { ...item, ...patch } : item));
  };

  const selectedCases = cases.filter((item) => item.selected);
  const primaryLabel = stage === 'ENTRY' ? 'Weiter zur Auswertung' : 'Weiter';

  return (
    <PropertyValuationLayout
      currentStep={5}
      title="Sanierungskosten"
      actions={
        <Button
          label="Überspringen"
          variant="outline"
          hideLabelOnMobile
          disabled={isLoading || isSaving || cases.length > 0}
          onClick={() => void continueWithoutRenovations()}
        />
      }
    >
      <div className="pb-24">
        {error && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Sanierung wird geladen...</p>
        ) : (
          <div className="max-w-6xl space-y-8">
            <section>
              <div className="mb-4 flex items-center gap-4">
                <h2 className="rounded-lg border border-border bg-card px-4 py-2 text-lg font-medium text-foreground">
                  Aufnahme der Sanierungsfälle
                </h2>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Dropdown
                  label="Kategorie"
                  value={category}
                  onChange={(event) => {
                    setCategory(event.target.value as RenovationCategory);
                    setMeasure('');
                  }}
                  options={[
                    { value: '', label: 'Bitte wählen...' },
                    ...RENOVATION_CATEGORIES,
                  ]}
                />
                <Dropdown
                  label="Maßnahme"
                  value={measure}
                  onChange={(event) => setMeasure(event.target.value)}
                  disabled={!category}
                  options={measureOptions(category)}
                />
                <TextArea
                  label="Beschreibung"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  maxLength={1500}
                  helperText="Optional: Schaden oder Modernisierungswunsch beschreiben. Bilder und Text können kombiniert werden."
                  className="md:col-span-2"
                />
                <div className="rounded-lg border border-dashed border-border bg-card px-4 py-3">
                  <label className="mb-2 block text-sm text-foreground">Bilder aus Exposé oder Besichtigung</label>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(event) => {
                      const names = Array.from(event.target.files ?? []).map((file) => `local:${file.name}`);
                      setUploadNames(names);
                    }}
                    className="block w-full text-sm text-muted-foreground"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Lokal werden Dateinamen für die spätere Upload-Anbindung vorgemerkt; eine echte Datei-Auswertung folgt mit dem KI-Service.
                  </p>
                </div>
                <div className="flex items-end justify-start md:justify-end">
                  <Button label="Fall hinzufügen" onClick={addCase} />
                </div>
              </div>

              {cases.length > 0 && (
                <div className="mt-6 overflow-hidden rounded-lg border border-border">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-3 font-medium">Kategorie</th>
                        <th className="px-4 py-3 font-medium">Maßnahme</th>
                        <th className="px-4 py-3 font-medium">Beschreibung</th>
                        <th className="px-4 py-3 font-medium">Aktion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cases.map((item) => (
                        <tr key={item.id} className="border-t border-border">
                          <td className="px-4 py-3">{categoryLabel(item.kategorie)}</td>
                          <td className="px-4 py-3">{item.massnahme}</td>
                          <td className="px-4 py-3 text-muted-foreground">{item.beschreibung || '-'}</td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              className="text-sm text-destructive"
                              onClick={() => setCases((prev) => prev.filter((current) => current.id !== item.id))}
                            >
                              Entfernen
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {stage === 'PRICING' && (
              <>
                <section>
                  <div className="mb-4 flex items-center gap-4">
                    <h2 className="rounded-lg border border-border bg-card px-4 py-2 text-lg font-medium text-foreground">
                      Preisindikation
                    </h2>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-3 font-medium">Auswahl</th>
                          <th className="px-4 py-3 font-medium">Maßnahme</th>
                          <th className="px-4 py-3 font-medium">Indikation</th>
                          <th className="px-4 py-3 text-right font-medium">Von</th>
                          <th className="px-4 py-3 text-right font-medium">Bis</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cases.map((item) => (
                          <tr key={item.id} className="border-t border-border">
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={item.selected}
                                onChange={(event) => updateCase(item.id, { selected: event.target.checked })}
                                aria-label={`${item.massnahme} auswählen`}
                              />
                            </td>
                            <td className="px-4 py-3 font-medium">{item.massnahme}</td>
                            <td className="px-4 py-3 text-muted-foreground">{item.ai?.summary ?? '-'}</td>
                            <td className="px-4 py-3 text-right">{formatCurrency(item.ai?.price_min ?? 0)}</td>
                            <td className="px-4 py-3 text-right">{formatCurrency(item.ai?.price_max ?? 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-6 max-w-3xl">
                    <p className="mb-3 text-lg font-medium">Mit welchem Preis wollen Sie weiterrechnen?</p>
                    <div className="grid gap-3 md:grid-cols-[130px_1fr_130px] md:items-center">
                      <ReadOnlyPill value={formatCurrency(totals.sum_min)} />
                      <input
                        type="range"
                        min={totals.sum_min}
                        max={Math.max(totals.sum_max, totals.sum_min)}
                        step="100"
                        value={Math.max(totals.sum_min, Math.min(totals.sum_max, sumSelected))}
                        disabled={totals.sum_max <= totals.sum_min}
                        onChange={(event) => setSumSelected(Number(event.target.value))}
                        aria-label="Preis für weitere Berechnung"
                      />
                      <ReadOnlyPill value={formatCurrency(totals.sum_max)} />
                    </div>
                    <div className="mt-3 max-w-xs">
                      <ReadOnlyPill value={`Ausgewählt: ${formatCurrency(sumSelected)}`} />
                    </div>
                  </div>
                </section>

                <section>
                  <div className="mb-4 flex items-center gap-4">
                    <h2 className="rounded-lg border border-border bg-card px-4 py-2 text-lg font-medium text-foreground">
                      Zusammenfassung
                    </h2>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-3 font-medium">Maßnahme</th>
                          <th className="px-4 py-3 text-right font-medium">Kosten</th>
                          <th className="px-4 py-3 font-medium">Zeitpunkt</th>
                          <th className="px-4 py-3 font-medium">Auftrag veröffentlichen</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedCases.map((item) => (
                          <tr key={item.id} className="border-t border-border even:bg-muted/40">
                            <td className="px-4 py-3">
                              <div className="font-medium">{item.massnahme}</div>
                              <div className="text-xs text-muted-foreground">{categoryLabel(item.kategorie)}</div>
                            </td>
                            <td className="px-4 py-3 text-right">{formatCurrency(costForCase(item))}</td>
                            <td className="px-4 py-3">
                              <Dropdown
                                aria-label={`${item.massnahme} Zeitpunkt`}
                                value={item.zeitpunkt}
                                onChange={(event) => updateCase(item.id, { zeitpunkt: event.target.value as RenovationTiming })}
                                options={[
                                  { value: 'SOFORT', label: 'Sofort' },
                                  { value: 'FLEXIBEL', label: 'Flexibel' },
                                ]}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <label className="inline-flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={item.publish_order}
                                  onChange={(event) => updateCase(item.id, { publish_order: event.target.checked })}
                                />
                                Ja
                              </label>
                            </td>
                          </tr>
                        ))}
                        <tr className="border-t border-border bg-card font-semibold">
                          <td className="px-4 py-3">Gesamtsumme</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(sumSelected)}</td>
                          <td className="px-4 py-3" colSpan={2}>
                            <div className="grid gap-3 md:grid-cols-[minmax(0,240px)_minmax(0,220px)]">
                              <Dropdown
                                value={financingMode}
                                onChange={(event) => setFinancingMode(event.target.value as RenovationFinancingMode)}
                                options={[
                                  { value: 'FREMD', label: 'Fremdfinanziert' },
                                  { value: 'EIGEN', label: 'Eigen finanziert' },
                                  { value: 'TEILWEISE', label: 'Teilweise' },
                                ]}
                              />
                              {financingMode === 'TEILWEISE' && (
                                <TextField
                                  value={financedAmount}
                                  onChange={(event) => setFinancedAmount(event.target.value)}
                                  inputMode="decimal"
                                  suffix="€"
                                  aria-label="Fremdfinanzierter Anteil"
                                />
                              )}
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Preisindikation aktuell per lokaler Fallback-Logik mit PLZ-Faktor{context?.postalCode ? ` (${context.postalCode})` : ''}; die KI- und Upload-Auswertung ist als nächster Integrationspunkt vorbereitet.
                  </p>
                </section>
              </>
            )}
          </div>
        )}
      </div>

      <StickyActionBar
        show
        ghostLabel={BUTTON_DETAILS.Back.label}
        ghostIcon={<BUTTON_DETAILS.Back.icon />}
        onGhost={() => router.push(`/property-valuation/detail-check/depreciation${suffix}`)}
        primaryLabel={primaryLabel}
        primaryIcon={<BUTTON_DETAILS.Next.icon />}
        primaryDisabled={isLoading || isSaving}
        onPrimary={stage === 'ENTRY'
          ? (cases.length === 0 ? () => void continueWithoutRenovations() : evaluateCases)
          : saveAndNext}
      />
    </PropertyValuationLayout>
  );
}

export default function RenovationPage() {
  return (
    <Suspense fallback={null}>
      <RenovationContent />
    </Suspense>
  );
}
