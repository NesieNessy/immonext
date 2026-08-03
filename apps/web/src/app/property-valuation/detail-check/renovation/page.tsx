"use client";

import { Button, Dropdown, ReadOnlyField, StickyActionBar, TextArea, TextField } from '@/components/ui';
import { BUTTON_DETAILS } from '@/constants/ButtonLabels';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { authFetch } from '@/lib/api/authFetch';
import { formatDecimalInput, parseDecimalInput } from '@/lib/detailCheck/acquisitionCosts';
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
import { getDocumentsByUser, getDocumentUrl, uploadDocument } from '@/lib/supabase/document.supabase';
import type { UserDocument } from '@immonext/types';
import { format } from 'date-fns';
import { Eye, FileText, Image as ImageIcon, Upload } from 'lucide-react';
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
  return <ReadOnlyField value={value} align="right" emphasis />;
}

function RenovationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useRequireAuth();
  const quickCheckId = searchParams.get('quickCheckId');
  const workflowId = searchParams.get('workflowId');
  const suffix = quickCheckId ? `?quickCheckId=${encodeURIComponent(quickCheckId)}` : workflowId ? `?workflowId=${encodeURIComponent(workflowId)}` : '';

  const [stage, setStage] = useState<Stage>('ENTRY');
  const [cases, setCases] = useState<RenovationCase[]>([]);
  const [category, setCategory] = useState<RenovationCategory | ''>('');
  const [measure, setMeasure] = useState('');
  const [description, setDescription] = useState('');
  const [uploadNames, setUploadNames] = useState<string[]>([]);
  const [documentsById, setDocumentsById] = useState<Record<number, UserDocument>>({});
  const [previewUrls, setPreviewUrls] = useState<Record<number, string>>({});
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [uploadFilesError, setUploadFilesError] = useState<string | null>(null);
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
        setFinancedAmount(formatDecimalInput(String(data.financing.financedAmount || '')));
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

  useEffect(() => {
    if (!user) return;
    getDocumentsByUser(user.id).then(async (documents) => {
      setDocumentsById(Object.fromEntries(documents.map((document) => [document.documentId, document])));
      const imageDocuments = documents.filter((document) => document.contentType?.startsWith('image/'));
      const urls = await Promise.all(imageDocuments.map(async (document) => [document.documentId, await getDocumentUrl(document.storagePath)] as const));
      setPreviewUrls(Object.fromEntries(urls.filter((entry): entry is readonly [number, string] => Boolean(entry[1]))));
    });
  }, [user]);

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
    if (financingMode === 'FREMD') setFinancedAmount(formatDecimalInput(String(sumSelected)));
    if (financingMode === 'EIGEN') setFinancedAmount('');
  }, [financingMode, sumSelected]);

  const handleUploadRenovationFiles = async (files: File[]) => {
    if (!user || files.length === 0) return;
    setIsUploadingFiles(true);
    setUploadFilesError(null);
    try {
      for (const file of files) {
        const { document: uploaded, error } = await uploadDocument(user.id, file, {
          userId: user.id,
          category: 'Detailbewertung',
          name: file.name.replace(/\.[^/.]+$/, ''),
          propertyId: null,
          quickCheckId: quickCheckId ? Number(quickCheckId) : null,
          documentDate: format(new Date(), 'yyyy-MM-dd'),
        });
        if (error) {
          setUploadFilesError(error);
          break;
        }
        if (uploaded) {
          setUploadNames((prev) => [...prev.filter((name) => name !== `local:${file.name}`), `document:${uploaded.documentId}`]);
          setDocumentsById((prev) => ({ ...prev, [uploaded.documentId]: uploaded }));
          if (uploaded.contentType?.startsWith('image/')) {
            const url = await getDocumentUrl(uploaded.storagePath);
            if (url) setPreviewUrls((prev) => ({ ...prev, [uploaded.documentId]: url }));
          }
        }
      }
    } finally {
      setIsUploadingFiles(false);
    }
  };

  const openUpload = async (reference: string) => {
    const documentId = Number(reference.replace(/^document:/, ''));
    const document = documentsById[documentId];
    if (!document) return;
    const url = await getDocumentUrl(document.storagePath);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const uploadLabel = (reference: string) => {
    if (!reference.startsWith('document:')) return reference.replace(/^local:/, '');
    return documentsById[Number(reference.slice('document:'.length))]?.fileName ?? 'Datei';
  };

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
      setFinancedAmount(formatDecimalInput(String(data.financing.financedAmount || '')));
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

  const continueWithoutRenovations = async (navigate = true): Promise<boolean> => {
    if (isSaving) return false;

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
      if (navigate) router.push(`/property-valuation/detail-check/calculator${suffix}`);
      return true;
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Sanierung konnte nicht übersprungen werden.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const persistCurrent = async (): Promise<boolean> => cases.length > 0
    ? evaluateCases()
    : continueWithoutRenovations(false);

  const handleBack = async () => {
    if (await persistCurrent()) router.push(`/property-valuation/detail-check/depreciation${suffix}`);
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
      beforeStepChange={persistCurrent}
      actions={
        <Button
          label="Überspringen"
          variant="outline"
          hideLabelOnMobile
          disabled={isLoading || isSaving || cases.length > 0}
          onClick={() => void continueWithoutRenovations(true)}
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
          <div className="space-y-8">
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
                    <div className="mb-3 flex items-start gap-3">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"><Upload size={18} /></span>
                      <div>
                        <h3 className="font-medium text-foreground">Bilder und Unterlagen hochladen</h3>
                        <p className="text-xs text-muted-foreground">Exposé, Besichtigungsfotos oder vorhandene Kostendokumente</p>
                      </div>
                    </div>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                    disabled={!user || isUploadingFiles}
                    onChange={(event) => {
                      const files = Array.from(event.target.files ?? []);
                      setUploadNames(files.map((file) => `local:${file.name}`));
                      void handleUploadRenovationFiles(files);
                    }}
                    className="block w-full text-sm text-muted-foreground disabled:opacity-50"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Dateien werden gespeichert und erscheinen auf der Dokumente-Seite. Die Preisindikation verwendet derzeit Kategorie, Wohnfläche und PLZ; eine KI-Bildauswertung ist noch nicht angebunden.
                  </p>
                  {uploadNames.length > 0 && <p className="mt-2 text-xs font-medium text-primary">Ausgewählt: {uploadNames.map(uploadLabel).join(', ')}</p>}
                  {isUploadingFiles && <p className="mt-1 text-xs text-muted-foreground">Lädt hoch…</p>}
                  {uploadFilesError && <p className="mt-1 text-xs text-destructive">{uploadFilesError}</p>}
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
                        <th className="px-4 py-3 font-medium">Bilder und Unterlagen</th>
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
                            {item.uploads?.length ? (
                              <div className="flex flex-wrap gap-2">
                                {item.uploads.map((reference) => {
                                  const documentId = reference.startsWith('document:') ? Number(reference.slice('document:'.length)) : 0;
                                  const document = documentsById[documentId];
                                  const previewUrl = previewUrls[documentId];
                                  return (
                                    <button
                                      key={reference}
                                      type="button"
                                      onClick={() => void openUpload(reference)}
                                      disabled={!document}
                                      className="group flex max-w-48 items-center gap-2 rounded-md border border-border bg-card p-1.5 text-left text-xs hover:border-primary disabled:cursor-default"
                                      title={document ? `${document.fileName} öffnen` : uploadLabel(reference)}
                                    >
                                      {previewUrl ? <img src={previewUrl} alt="" className="h-10 w-12 rounded object-cover" /> : document?.contentType?.startsWith('image/') ? <ImageIcon size={18} /> : <FileText size={18} />}
                                      <span className="min-w-0 truncate">{uploadLabel(reference)}</span>
                                      {document && <Eye size={14} className="shrink-0 text-muted-foreground group-hover:text-primary" />}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : '-'}
                          </td>
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
                            <td className="px-4 py-3 text-right">
                              <div>{formatCurrency(costForCase(item))}</div>
                              <div className="text-xs font-normal text-muted-foreground">Aus dem gewählten Gesamtwert anteilig auf diese Maßnahme verteilt</div>
                            </td>
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
                                  label="Fremdkapitalanteil"
                                  value={financedAmount}
                                  onChange={(event) => setFinancedAmount(event.target.value)}
                                  inputMode="decimal"
                                  suffix="€"
                                  aria-label="Fremdfinanzierter Anteil"
                                  helperText="Der verbleibende Betrag wird als Eigenkapital behandelt."
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
        onGhost={() => void handleBack()}
        primaryLabel={primaryLabel}
        primaryIcon={<BUTTON_DETAILS.Next.icon />}
        primaryDisabled={isLoading || isSaving}
        onPrimary={stage === 'ENTRY'
          ? (cases.length === 0 ? () => void continueWithoutRenovations(true) : evaluateCases)
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
