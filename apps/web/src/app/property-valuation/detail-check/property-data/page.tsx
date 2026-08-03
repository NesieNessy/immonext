"use client";

import { Dropdown, StickyActionBar, TextField } from '@/components/ui';
import { BUTTON_DETAILS } from '@/constants/ButtonLabels';
import { authFetch } from '@/lib/api/authFetch';
import { parseDecimalInput } from '@/lib/detailCheck/acquisitionCosts';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { PropertyValuationLayout } from '../PropertyValuationLayout';

type FormState = {
  propertyCategory: string;
  dataEntrySource: string;
  tenancyType: string;
  sourceUrl: string;
  streetHouseNumber: string;
  postalCode: string;
  city: string;
  yearOfConstruction: string;
  livingAreaM2: string;
  parkingSpaces: string;
  energyEfficiency: string;
};

type PropertyDataResponse = FormState & {
  workflowId: string;
  quickCheckId: number | null;
  hasDetailCheckData: boolean;
  livingAreaM2: number | string;
  parkingSpaces: number | string;
  yearOfConstruction: number | string;
};

type PostalCodeLookupResponse = {
  postalCode: string;
  cities: string[];
  federalState: { key: string; name: string } | null;
};

type PostalLookupStatus = 'idle' | 'loading' | 'resolved' | 'empty' | 'error';

const EMPTY_FORM: FormState = {
  propertyCategory: 'EIGENTUMSWOHNUNG',
  dataEntrySource: '',
  tenancyType: '',
  sourceUrl: '',
  streetHouseNumber: '',
  postalCode: '',
  city: '',
  yearOfConstruction: '',
  livingAreaM2: '',
  parkingSpaces: '0',
  energyEfficiency: '',
};

const dataEntrySourceOptions = [
  { value: '', label: 'Bitte wählen...' },
  { value: 'PORTAL_IMPORT', label: 'Aus Immobilienportal importieren' },
  { value: 'MANUELL', label: 'Manuelle Erfassung' },
  { value: 'SCAN_EXPOSE', label: 'Scan Exposé (Ausbaustufe)', disabled: true },
];

const tenancyTypeOptions = [
  { value: '', label: 'Bitte wählen...' },
  { value: 'STANDARD', label: 'Standard' },
  { value: 'INDEXMIETE', label: 'Indexmiete (Ausbaustufe)', disabled: true },
  { value: 'NIESSBRAUCH', label: 'Nießbrauch (Ausbaustufe)', disabled: true },
  { value: 'ERBPACHT', label: 'Erbpacht (Ausbaustufe)', disabled: true },
  { value: 'SONDERVERMIETUNG', label: 'Sondervermietung (Ausbaustufe)', disabled: true },
  { value: 'GEWERBE', label: 'Gewerbe (Ausbaustufe)', disabled: true },
  { value: 'ALTENHEIM', label: 'Altenheim (Ausbaustufe)', disabled: true },
  { value: 'ZWANGSVERSTEIGERUNG', label: 'Zwangsversteigerung (Ausbaustufe)', disabled: true },
];

const parkingOptions = Array.from({ length: 11 }, (_, value) => ({
  value: String(value),
  label: String(value),
}));

const energyOptions = [
  { value: '', label: 'Bitte wählen...' },
  ...['A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((value) => ({ value, label: value })),
];

function valueString(value: number | string | null | undefined): string {
  if (value == null) return '';
  return String(value).replace('.', ',');
}

function PropertyDataContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quickCheckId = searchParams.get('quickCheckId');
  const workflowId = searchParams.get('workflowId');
  const suffix = quickCheckId
    ? `?quickCheckId=${encodeURIComponent(quickCheckId)}`
    : workflowId
      ? `?workflowId=${encodeURIComponent(workflowId)}`
      : '';

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [topError, setTopError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasDetailCheckData, setHasDetailCheckData] = useState(false);
  const [postalCodeWasEdited, setPostalCodeWasEdited] = useState(false);
  const [postalLookupStatus, setPostalLookupStatus] = useState<PostalLookupStatus>('idle');
  const [cityOptions, setCityOptions] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setTopError(null);
      try {
        const res = await authFetch(`/api/detail-check/property-data${suffix}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json() as PropertyDataResponse;
        if (cancelled) return;
        setHasDetailCheckData(data.hasDetailCheckData);
        setPostalCodeWasEdited(false);
        setForm({
          propertyCategory: data.propertyCategory || 'EIGENTUMSWOHNUNG',
          dataEntrySource: data.dataEntrySource || '',
          tenancyType: data.tenancyType || '',
          sourceUrl: data.sourceUrl || '',
          streetHouseNumber: data.streetHouseNumber || '',
          postalCode: data.postalCode || '',
          city: data.city || '',
          yearOfConstruction: valueString(data.yearOfConstruction),
          livingAreaM2: valueString(data.livingAreaM2),
          parkingSpaces: valueString(data.parkingSpaces || 0),
          energyEfficiency: data.energyEfficiency || '',
        });
      } catch (error) {
        if (!cancelled) {
          setTopError(error instanceof Error ? error.message : 'Objektdaten konnten nicht geladen werden.');
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
    const postalCode = form.postalCode;
    if (isLoading || !/^\d{5}$/.test(postalCode)) {
      setPostalLookupStatus('idle');
      setCityOptions([]);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setPostalLookupStatus('loading');
      try {
        const response = await authFetch(
          `/api/address/postal-code?postalCode=${encodeURIComponent(postalCode)}`,
          { cache: 'force-cache', signal: controller.signal },
        );
        if (!response.ok) throw new Error(await response.text());

        const payload = await response.json() as PostalCodeLookupResponse;
        if (controller.signal.aborted || payload.postalCode !== postalCode) return;

        setCityOptions(payload.cities);
        setPostalLookupStatus(payload.cities.length > 0 ? 'resolved' : 'empty');
        setForm((previous) => {
          if (previous.postalCode !== postalCode) return previous;
          if (payload.cities.length === 1 && (postalCodeWasEdited || !previous.city.trim())) {
            return { ...previous, city: payload.cities[0] };
          }
          if (
            payload.cities.length > 1
            && postalCodeWasEdited
            && !payload.cities.includes(previous.city)
          ) {
            return { ...previous, city: '' };
          }
          return previous;
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Postal-code lookup failed:', error);
        setCityOptions([]);
        setPostalLookupStatus('error');
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [form.postalCode, isLoading, postalCodeWasEdited]);

  const currentYear = new Date().getFullYear();
  const liveErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    const year = Number(form.yearOfConstruction);
    const livingArea = parseDecimalInput(form.livingAreaM2);

    if (form.streetHouseNumber.length > 100) errors.streetHouseNumber = 'Maximal 100 Zeichen.';
    if (form.postalCode && !/^\d{4,5}$/.test(form.postalCode)) errors.postalCode = 'Bitte 4 bis 5 Ziffern eingeben.';
    if (form.city && form.city.length > 100) errors.city = 'Maximal 100 Zeichen.';
    if (form.yearOfConstruction && (!Number.isInteger(year) || year < 1000 || year > currentYear)) {
      errors.yearOfConstruction = `Baujahr muss zwischen 1000 und ${currentYear} liegen.`;
    }
    if (form.livingAreaM2 && (livingArea <= 0 || livingArea > 10000)) {
      errors.livingAreaM2 = 'Wohnfläche muss größer als 0 und maximal 10.000 sein.';
    }

    return errors;
  }, [form, currentYear]);

  const displayErrors = { ...liveErrors, ...fieldErrors };

  const updateForm = (field: keyof FormState, value: string) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });

    if (field === 'postalCode') {
      setPostalCodeWasEdited(true);
      setPostalLookupStatus('idle');
      setCityOptions([]);
    }

    setForm((prev) => {
      if (field === 'dataEntrySource') {
        return { ...prev, dataEntrySource: value, tenancyType: '', sourceUrl: value === 'PORTAL_IMPORT' ? prev.sourceUrl : '' };
      }
      return { ...prev, [field]: value };
    });
  };

  const cityHelperText = postalLookupStatus === 'loading'
    ? 'Ort wird automatisch ermittelt...'
    : postalLookupStatus === 'resolved' && cityOptions.length === 1
      ? 'Automatisch aus der Postleitzahl ermittelt. Der Ort bleibt änderbar.'
      : postalLookupStatus === 'resolved'
        ? 'Mehrere Orte gefunden. Bitte einen Vorschlag auswählen.'
        : postalLookupStatus === 'empty'
          ? 'Zu dieser Postleitzahl wurde kein Ort gefunden. Bitte manuell eingeben.'
          : postalLookupStatus === 'error'
            ? 'Automatische Ortssuche derzeit nicht verfügbar. Bitte manuell eingeben.'
            : undefined;

  const validateBeforeSave = () => {
    const errors: Record<string, string> = { ...liveErrors };
    const year = Number(form.yearOfConstruction);
    const livingArea = parseDecimalInput(form.livingAreaM2);

    if (!form.dataEntrySource) errors.dataEntrySource = 'Bitte wählen Sie eine Erfassungsquelle.';
    if (!form.tenancyType) errors.tenancyType = 'Bitte wählen Sie eine Miet-/Nutzungsart.';
    if (form.dataEntrySource === 'PORTAL_IMPORT' && form.sourceUrl) {
      try {
        new URL(form.sourceUrl);
      } catch {
        errors.sourceUrl = 'Bitte eine gültige URL eingeben.';
      }
    }
    if (!form.city.trim()) errors.city = 'Ort ist ein Pflichtfeld.';
    if (!Number.isInteger(year) || year < 1000 || year > currentYear) {
      errors.yearOfConstruction = `Baujahr muss zwischen 1000 und ${currentYear} liegen.`;
    }
    if (livingArea <= 0 || livingArea > 10000) {
      errors.livingAreaM2 = 'Wohnfläche muss größer als 0 sein.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const persist = async (): Promise<boolean> => {
    if (isSaving || !validateBeforeSave()) return false;

    setIsSaving(true);
    setTopError(null);
    try {
      const res = await authFetch('/api/detail-check/property-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quickCheckId,
          workflowId,
          propertyCategory: form.propertyCategory,
          dataEntrySource: form.dataEntrySource,
          tenancyType: form.tenancyType,
          sourceUrl: form.sourceUrl,
          streetHouseNumber: form.streetHouseNumber,
          postalCode: form.postalCode,
          city: form.city,
          yearOfConstruction: Number(form.yearOfConstruction),
          livingAreaM2: parseDecimalInput(form.livingAreaM2),
          parkingSpaces: Number(form.parkingSpaces || 0),
          energyEfficiency: form.energyEfficiency,
        }),
      });

      if (!res.ok) {
        const responseText = await res.text();
        let payload: { fieldErrors?: Record<string, string>; error?: string } | null = null;
        try {
          payload = responseText ? JSON.parse(responseText) : null;
        } catch {
          payload = null;
        }
        if (payload?.fieldErrors) {
          setFieldErrors(payload.fieldErrors);
          setTopError('Bitte prüfen Sie die markierten Felder.');
          return false;
        }
        throw new Error(payload?.error ?? responseText);
      }

      const payload = await res.json() as { workflowId: string };
      if (!quickCheckId && !workflowId) {
        window.history.replaceState(null, '', `${window.location.pathname}?workflowId=${encodeURIComponent(payload.workflowId)}`);
      }
      return true;
    } catch (error) {
      setTopError(error instanceof Error ? error.message : 'Objektdaten konnten nicht gespeichert werden.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    if (!(await persist())) return;
    const currentWorkflowId = new URLSearchParams(window.location.search).get('workflowId');
    const nextSuffix = quickCheckId
      ? suffix
      : currentWorkflowId
        ? `?workflowId=${encodeURIComponent(currentWorkflowId)}`
        : suffix;
    router.push(`/property-valuation/detail-check/acquisition-costs${nextSuffix}`);
  };

  const handleBack = () => {
    router.push(quickCheckId && !hasDetailCheckData
      ? '/property-valuation/quick-check'
      : '/property-valuation/detail-check');
  };

  return (
    <PropertyValuationLayout currentStep={0} title="Objektdaten" beforeStepChange={persist}>
      <div className="pb-24">
        {topError && (
          <div aria-live="assertive" className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {topError}
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Objektdaten werden geladen...</p>
        ) : (
          <div className="space-y-7">
            <section>
              <h2 className="mb-3 text-lg font-medium text-foreground">Erfassung</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <Dropdown
                  label="Erfassungsquelle"
                  options={dataEntrySourceOptions}
                  value={form.dataEntrySource}
                  onChange={(event) => updateForm('dataEntrySource', event.target.value)}
                  error={displayErrors.dataEntrySource}
                />
                <Dropdown
                  label="Miet-/Nutzungsart"
                  options={tenancyTypeOptions}
                  value={form.tenancyType}
                  onChange={(event) => updateForm('tenancyType', event.target.value)}
                  disabled={!form.dataEntrySource}
                  error={displayErrors.tenancyType}
                />
              </div>

              {form.dataEntrySource === 'PORTAL_IMPORT' && (
                <div className="mt-4 max-w-xl">
                  <TextField
                    label="Inserats-URL"
                    placeholder="https://..."
                    value={form.sourceUrl}
                    onChange={(event) => updateForm('sourceUrl', event.target.value)}
                    error={displayErrors.sourceUrl}
                    helperText="Der Importdienst ist noch nicht angebunden; vorbefüllte Daten bleiben editierbar."
                  />
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-3 text-lg font-medium text-foreground">Adresse</h2>
              <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,1fr)]">
                <TextField
                  label="Straße + Hausnummer"
                  placeholder="Straße"
                  autoComplete="street-address"
                  value={form.streetHouseNumber}
                  onChange={(event) => updateForm('streetHouseNumber', event.target.value)}
                  error={displayErrors.streetHouseNumber}
                />
                <TextField
                  label="Postleitzahl"
                  placeholder="Postleitzahl"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  value={form.postalCode}
                  onChange={(event) => updateForm('postalCode', event.target.value.replace(/\D/g, '').slice(0, 5))}
                  error={displayErrors.postalCode}
                />
                <TextField
                  label="Ort"
                  placeholder="Ort"
                  autoComplete="address-level2"
                  list={cityOptions.length > 1 ? 'detail-check-city-options' : undefined}
                  aria-busy={postalLookupStatus === 'loading'}
                  value={form.city}
                  onChange={(event) => updateForm('city', event.target.value)}
                  error={displayErrors.city}
                  helperText={cityHelperText}
                />
                {cityOptions.length > 1 && (
                  <datalist id="detail-check-city-options">
                    {cityOptions.map((city) => <option key={city} value={city} />)}
                  </datalist>
                )}
              </div>
            </section>

            <section>
              <div className="grid gap-4 md:grid-cols-3">
                <TextField
                  label="Wohnfläche"
                  placeholder="100"
                  inputMode="decimal"
                  suffix="m²"
                  value={form.livingAreaM2}
                  onChange={(event) => updateForm('livingAreaM2', event.target.value)}
                  error={displayErrors.livingAreaM2}
                />
                <TextField
                  label="Baujahr"
                  placeholder="1980"
                  inputMode="numeric"
                  value={form.yearOfConstruction}
                  onChange={(event) => updateForm('yearOfConstruction', event.target.value.replace(/\D/g, '').slice(0, 4))}
                  error={displayErrors.yearOfConstruction}
                />
                <Dropdown
                  label="Anzahl Stellplätze"
                  options={parkingOptions}
                  value={form.parkingSpaces}
                  onChange={(event) => updateForm('parkingSpaces', event.target.value)}
                  error={displayErrors.parkingSpaces}
                />
              </div>
            </section>

            <section className="max-w-sm">
              <Dropdown
                label="Energieeffizienz (opt.)"
                options={energyOptions}
                value={form.energyEfficiency}
                onChange={(event) => updateForm('energyEfficiency', event.target.value)}
                error={displayErrors.energyEfficiency}
              />
            </section>
          </div>
        )}
      </div>

      <StickyActionBar
        show
        ghostLabel={BUTTON_DETAILS.Back.label}
        ghostIcon={<BUTTON_DETAILS.Back.icon />}
        onGhost={handleBack}
        primaryLabel="Weiter"
        primaryIcon={<BUTTON_DETAILS.Next.icon />}
        primaryDisabled={isLoading || isSaving}
        onPrimary={handleNext}
      />
    </PropertyValuationLayout>
  );
}

export default function PropertyDataPage() {
  return (
    <Suspense fallback={null}>
      <PropertyDataContent />
    </Suspense>
  );
}
