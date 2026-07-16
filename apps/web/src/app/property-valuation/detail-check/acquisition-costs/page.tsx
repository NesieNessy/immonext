"use client";

import { StickyActionBar } from '@/components/ui';
import { BUTTON_DETAILS } from '@/constants/ButtonLabels';
import {
  computeAcquisitionCosts,
  parseDecimalInput,
  resolveStateFromPostalCode,
} from '@/lib/detailCheck/acquisitionCosts';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { PropertyValuationLayout } from '../PropertyValuationLayout';

type FormState = {
  purchasePrice: string;
  parkingPurchasePrice: string;
  brokerPercent: string;
  livingAreaM2: string;
};

type ApiPayload = {
  state: string | null;
  postalCode: string | null;
  purchasePrice: number;
  parkingPurchasePrice: number;
  brokerPercent: number;
  notaryPercent: number;
  landRegistryPercent: number;
  propertyTransferTaxPercent: number | null;
  livingAreaM2: number | null;
};

const currencyFormatter = new Intl.NumberFormat('de-DE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat('de-DE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function decimalString(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '';
  return String(value).replace('.', ',');
}

function ReadOnlyField({
  label,
  value,
  unit,
  hint,
}: {
  label: string;
  value: string;
  unit: string;
  hint?: string;
}) {
  return (
    <div className="w-full">
      <label className="block mb-2 text-sm text-foreground">{label}</label>
      <div className="relative">
        <input
          value={value}
          readOnly
          className="w-full rounded-lg border border-border bg-muted px-4 py-2 pr-12 text-foreground"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
          {unit}
        </span>
      </div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function DecimalField({
  label,
  value,
  unit,
  onChange,
  error,
}: {
  label: string;
  value: string;
  unit: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <div className="w-full">
      <label className="block mb-2 text-sm text-foreground">{label}</label>
      <div className="relative">
        <input
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full rounded-lg border bg-input-background px-4 py-2 pr-12 transition-all duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 ${
            error ? 'border-destructive focus:ring-destructive/50' : 'border-border'
          }`}
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
          {unit}
        </span>
      </div>
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}

function AcquisitionCostsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quickCheckId = searchParams.get('quickCheckId');
  const suffix = quickCheckId ? `?quickCheckId=${quickCheckId}` : '';

  const [form, setForm] = useState<FormState>({
    purchasePrice: '0',
    parkingPurchasePrice: '0',
    brokerPercent: '3,57',
    livingAreaM2: '',
  });
  const [apiData, setApiData] = useState<ApiPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/detail-check/acquisition-costs${suffix}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json() as ApiPayload;
        if (cancelled) return;
        setApiData(data);
        setForm({
          purchasePrice: decimalString(data.purchasePrice),
          parkingPurchasePrice: decimalString(data.parkingPurchasePrice),
          brokerPercent: decimalString(data.brokerPercent),
          livingAreaM2: decimalString(data.livingAreaM2),
        });
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Kaufkosten konnten nicht geladen werden.');
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

  const values = useMemo(() => ({
    purchasePrice: parseDecimalInput(form.purchasePrice),
    parkingPurchasePrice: parseDecimalInput(form.parkingPurchasePrice),
    brokerPercent: parseDecimalInput(form.brokerPercent),
    livingAreaM2: form.livingAreaM2.trim() ? parseDecimalInput(form.livingAreaM2) : null,
  }), [form]);

  const state = apiData?.state ?? resolveStateFromPostalCode(apiData?.postalCode);
  const notaryPercent = apiData?.notaryPercent ?? 1.5;
  const landRegistryPercent = apiData?.landRegistryPercent ?? 0.5;
  const propertyTransferTaxPercent = apiData?.propertyTransferTaxPercent ?? null;

  const computed = useMemo(() => computeAcquisitionCosts({
    purchasePrice: values.purchasePrice,
    parkingPurchasePrice: values.parkingPurchasePrice,
    brokerPercent: values.brokerPercent,
    livingAreaM2: values.livingAreaM2,
    postalCode: apiData?.postalCode,
    notaryPercent,
    landRegistryPercent,
    propertyTransferTaxPercent,
  }), [
    values,
    apiData?.postalCode,
    notaryPercent,
    landRegistryPercent,
    propertyTransferTaxPercent,
  ]);

  const errors = {
    purchasePrice:
      values.purchasePrice < 0 || values.purchasePrice > 1_000_000_000
        ? 'Bitte einen Betrag zwischen 0 und 1.000.000.000 eingeben.'
        : '',
    parkingPurchasePrice:
      values.parkingPurchasePrice < 0 || values.parkingPurchasePrice > 1_000_000_000
        ? 'Bitte einen Betrag zwischen 0 und 1.000.000.000 eingeben.'
        : '',
    brokerPercent:
      values.brokerPercent < 0 || values.brokerPercent > 20
        ? 'Bitte einen Prozentsatz zwischen 0 und 20 eingeben.'
        : '',
  };

  const isValid = !errors.purchasePrice && !errors.parkingPurchasePrice && !errors.brokerPercent;

  const formatCurrency = (value: number | null | undefined) =>
    value == null ? '-' : currencyFormatter.format(value);
  const formatPercent = (value: number | null | undefined) =>
    value == null ? '-' : percentFormatter.format(value);

  const handleSaveAndNext = async () => {
    if (!isValid || isSaving) return;

    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/detail-check/acquisition-costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quickCheckId,
          purchasePrice: values.purchasePrice,
          parkingPurchasePrice: values.parkingPurchasePrice,
          brokerPercent: values.brokerPercent,
          livingAreaM2: values.livingAreaM2,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      router.push(`/property-valuation/detail-check/leasing-or-rentals${suffix}`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Kaufkosten konnten nicht gespeichert werden.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PropertyValuationLayout currentStep={1} title="Kaufkosten">
      <div className="pb-24">

        {error && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Kaufkosten werden geladen...</p>
        ) : (
          <div className="max-w-5xl space-y-6">
            <section>
              <h2 className="mb-3 text-lg font-medium text-foreground">Kaufkosten</h2>
              <div className="grid gap-4 md:grid-cols-3">
                <DecimalField
                  label="Kaufpreis"
                  value={form.purchasePrice}
                  unit="€"
                  error={errors.purchasePrice}
                  onChange={(purchasePrice) => setForm((prev) => ({ ...prev, purchasePrice }))}
                />
                <ReadOnlyField
                  label="Kaufpreis pro m²"
                  value={formatCurrency(computed.purchasePricePerM2)}
                  unit="€"
                  hint={computed.purchasePricePerM2 == null ? 'Wohnfläche fehlt noch.' : undefined}
                />
                <DecimalField
                  label="Kaufkosten Stellplatz/Stellplätze"
                  value={form.parkingPurchasePrice}
                  unit="€"
                  error={errors.parkingPurchasePrice}
                  onChange={(parkingPurchasePrice) => setForm((prev) => ({ ...prev, parkingPurchasePrice }))}
                />
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-medium text-foreground">Kaufnebenkosten</h2>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-3">
                  <DecimalField
                    label="Makler"
                    value={form.brokerPercent}
                    unit="%"
                    error={errors.brokerPercent}
                    onChange={(brokerPercent) => setForm((prev) => ({ ...prev, brokerPercent }))}
                  />
                  <ReadOnlyField label="Maklerkosten" value={formatCurrency(computed.brokerAmount)} unit="€" />
                </div>

                <div className="space-y-3">
                  <ReadOnlyField label="Notar" value={formatPercent(notaryPercent)} unit="%" />
                  <ReadOnlyField label="Notarkosten" value={formatCurrency(computed.notaryAmount)} unit="€" />
                </div>

                <div className="space-y-3">
                  <ReadOnlyField label="Grundbuchamt" value={formatPercent(landRegistryPercent)} unit="%" />
                  <ReadOnlyField label="Grundbuchamtkosten" value={formatCurrency(computed.landRegistryAmount)} unit="€" />
                </div>

                <div className="space-y-3">
                  <ReadOnlyField
                    label="Grunderwerbsteuer"
                    value={formatPercent(propertyTransferTaxPercent)}
                    unit="%"
                    hint={propertyTransferTaxPercent == null ? 'PLZ prüfen' : `${state ?? ''}${apiData?.postalCode ? ` aus PLZ ${apiData.postalCode}` : ''}`}
                  />
                  <ReadOnlyField
                    label="Grunderwerbsteuerkosten"
                    value={formatCurrency(computed.propertyTransferTaxAmount)}
                    unit="€"
                  />
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-medium text-foreground">Gesamtkosten</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <ReadOnlyField
                  label="Gesamtnebenkosten"
                  value={formatCurrency(computed.totalAdditionalCosts)}
                  unit="€"
                />
                <ReadOnlyField
                  label="Gesamt"
                  value={formatCurrency(computed.totalCosts)}
                  unit="€"
                />
              </div>
            </section>
          </div>
        )}
      </div>

      <StickyActionBar
        show
        ghostLabel={BUTTON_DETAILS.Back.label}
        ghostIcon={<BUTTON_DETAILS.Back.icon />}
        onGhost={() => router.push(`/property-valuation/detail-check/property-data${suffix}`)}
        primaryLabel="Weiter"
        primaryIcon={<BUTTON_DETAILS.Next.icon />}
        primaryDisabled={!isValid || isSaving || isLoading}
        onPrimary={handleSaveAndNext}
      />
    </PropertyValuationLayout>
  );
}

export default function AcquisitionCostsPage() {
  return (
    <Suspense fallback={null}>
      <AcquisitionCostsContent />
    </Suspense>
  );
}
