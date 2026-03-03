"use client";

import { KpfRangeBar, NoResult } from '@/components/common';
import { Button, Dropdown, Header, Modal, NumberField, StickyActionBar, TextField, Tile } from '@/components/ui';
import { BUTTON_DETAILS } from '@/constants/ButtonLabels';
import { FieldLabels } from '@/constants/FieldLabels';
import { useKpfResult } from '@/hooks/useKpfRanges';
import { useQuickCheckById } from '@/hooks/useQuickCheckById';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { updateQuickCheck } from '@/lib/supabase/quick_check.supabase';
import { calcKpf } from '@/utils/kpf';
import { PropertyCondition } from '@immonext/types';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FormData {
  postalCode: string;
  purchasePrice: string;
  coldRent: string;
  condition: PropertyCondition | '';
  yearOfConstruction: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CONDITION_OPTIONS = [
  { value: '', label: 'Bitte auswählen' },
  ...Object.values(PropertyCondition).map((v) => ({ value: v, label: v })),
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props {
  id: number;
}

export function QuickCheckResultView({ id }: Props) {
  const router = useRouter();
  const { isLoading: authLoading } = useRequireAuth();
  const { data, isLoading, error } = useQuickCheckById(id);

  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const [portalUrl, setPortalUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<FormData>({
    postalCode: '',
    purchasePrice: '',
    coldRent: '',
    condition: '',
    yearOfConstruction: '',
  });

  // Pre-fill form once the record has loaded
  useEffect(() => {
    if (!data) return;
    setForm({
      postalCode:          data.postalCode,
      purchasePrice:       String(data.purchasePrice),
      coldRent:            String(data.coldRent),
      condition:           data.condition,
      yearOfConstruction:  String(data.yearOfConstruction),
    });
    setPortalUrl(data.portalId ?? '');
  }, [data]);

  const purchasePrice = parseFloat(form.purchasePrice) || 0;
  const coldRent      = parseFloat(form.coldRent) || 0;
  const condition     = form.condition as PropertyCondition | '';
  const yearOfConstructionNum = parseInt(form.yearOfConstruction, 10) || null;

  const { kpf, range, positionPct, isLoading: rangeLoading, noData } = useKpfResult(
    purchasePrice,
    coldRent,
    form.postalCode,
    condition,
    yearOfConstructionNum,
  );

  const currentYear = new Date().getFullYear();

  // Per-field validation
  const fieldErrors = {
    postalCode:
      form.postalCode.length > 0 && !/^\d{5}$/.test(form.postalCode)
        ? 'Genau 5 Ziffern erforderlich'
        : '',
    purchasePrice:
      form.purchasePrice !== '' && purchasePrice <= 0
        ? 'Muss größer als 0 sein'
        : '',
    coldRent:
      form.coldRent !== '' && coldRent <= 0
        ? 'Muss größer als 0 sein'
        : '',
    yearOfConstruction: (() => {
      const y = parseInt(form.yearOfConstruction, 10);
      if (form.yearOfConstruction === '') return '';
      if (isNaN(y) || y < 1850 || y > currentYear)
        return `Zwischen 1850 und ${currentYear}`;
      return '';
    })(),
  };

  const isFormValid =
    /^\d{5}$/.test(form.postalCode) &&
    purchasePrice > 0 &&
    coldRent > 0 &&
    form.condition !== '' &&
    (() => {
      const y = parseInt(form.yearOfConstruction, 10);
      return !isNaN(y) && y >= 1850 && y <= currentYear;
    })();

  const handleFieldChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!isFormValid) return;
    setIsSaving(true);
    try {
      await updateQuickCheck(id, {
        portalId:            portalUrl || undefined,
        purchasePrice,
        coldRent,
        postalCode:          form.postalCode,
        yearOfConstruction:  parseInt(form.yearOfConstruction, 10),
        condition:           condition as PropertyCondition,
        kpfMultiplier:       calcKpf(purchasePrice, coldRent) ?? 0,
      });
      router.push('/property-valuation/quick-check');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Loading / error / not-found guards ────────────────────────────────────
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Ergebnis wird geladen…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-destructive">Fehler: {error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Ersteinschätzung nicht gefunden.</p>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── URL Import Modal ────────────────────────────────────────────── */}
      <Modal
        open={urlModalOpen}
        onClose={() => setUrlModalOpen(false)}
        title={BUTTON_DETAILS.ImportData.label}
        subtitle="Immobiliendaten aus einem Portal laden"
        icon={<BUTTON_DETAILS.ImportData.icon />}
        footer={
          <>
            <Button
              label={BUTTON_DETAILS.Cancel.label}
              icon={<BUTTON_DETAILS.Cancel.icon />}
              variant="outline"
              onClick={() => setUrlModalOpen(false)}
            />
            <Button
              label={BUTTON_DETAILS.ImportData.label}
              icon={<BUTTON_DETAILS.ImportData.icon />}
              variant="primary"
              disabled
              title="URL-Import ist noch nicht verfügbar"
            />
          </>
        }
      >
        <TextField
          label="Portal-URL"
          placeholder="https://immobilienscout24.de/expose/..."
          helperText="Unterstützte Portale: ImmobilienScout24, Immowelt, Immonet"
          value={portalUrl}
          onChange={(e) => setPortalUrl(e.target.value)}
        />
      </Modal>

      {/* ── Main page ───────────────────────────────────────────────────── */}
      <div className="min-h-screen bg-background pb-20">
        <main className="container mx-auto px-4 py-3">
          <Header
            title="Immobilien-Ersteinschätzung"
            subtitle="Bewertung von Investitionsobjekten"
            actions={
              <Button
                label={BUTTON_DETAILS.ImportData.label}
                icon={<BUTTON_DETAILS.ImportData.icon />}
                variant="primary"
                onClick={() => setUrlModalOpen(true)}
              />
            }
          />

          <div className="mt-3 flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row gap-8 items-stretch">

              {/* Left: form */}
              <div className="flex flex-col gap-3 flex-1 p-5">
                <section>
                  <h2 className="text-md font-semibold text-foreground mb-2">
                    Informationen zur Berechnung
                  </h2>
                  <div className="flex flex-col gap-2 pt-1.5">
                    <div className="grid grid-cols-2 gap-2">
                      <TextField
                        label={FieldLabels.Property.PostalCode.de}
                        placeholder="z.B. 10115"
                        required
                        value={form.postalCode}
                        onChange={(e) => handleFieldChange('postalCode', e.target.value)}
                        error={fieldErrors.postalCode}
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <div className="grid grid-cols-2 gap-2">
                    <NumberField
                      label={FieldLabels.AcquisitionCosts.PurchasePrice.de}
                      placeholder="z.B. 450000"
                      unit="€"
                      required
                      value={form.purchasePrice}
                      onChange={(e) => handleFieldChange('purchasePrice', e.target.value)}
                      min={0}
                      error={fieldErrors.purchasePrice}
                    />
                    <NumberField
                      label={FieldLabels.Tenancy.ColdRent.de}
                      placeholder="z.B. 1800"
                      unit="€"
                      required
                      value={form.coldRent}
                      onChange={(e) => handleFieldChange('coldRent', e.target.value)}
                      min={0}
                      error={fieldErrors.coldRent}
                    />
                  </div>
                </section>

                <section>
                  <div className="grid grid-cols-2 gap-2">
                    <Dropdown
                      label="Zustand"
                      options={CONDITION_OPTIONS}
                      required
                      value={form.condition}
                      onChange={(e) => handleFieldChange('condition', e.target.value)}
                    />
                    <NumberField
                      label={FieldLabels.Property.YearOfConstruction.de}
                      placeholder="z.B. 1995"
                      required
                      value={form.yearOfConstruction}
                      onChange={(e) => handleFieldChange('yearOfConstruction', e.target.value)}
                      min={1850}
                      max={currentYear}
                      error={fieldErrors.yearOfConstruction}
                    />
                  </div>
                </section>

                <div className="flex-1" />
              </div>

              {/* Right: result */}
              <div className="flex flex-col flex-1 gap-4 p-5">
                {!isFormValid ? (
                  <NoResult className="flex-1" />
                ) : (
                  <div className="flex flex-col gap-4 flex-1">
                    <h2>Ersteinschätzung</h2>
                    <h5>{`${form.postalCode}`}</h5>
                    <Tile title="">
                      <div className="flex flex-col gap-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              {FieldLabels.AcquisitionCosts.PurchasePrice.de}
                            </p>
                            <p className="text-sm font-semibold text-foreground">
                              {purchasePrice.toLocaleString('de-DE')} €
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              {FieldLabels.Tenancy.ColdRent.de}
                            </p>
                            <p className="text-sm font-semibold text-foreground">
                              {coldRent.toLocaleString('de-DE')} €
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Zustand</p>
                            <p className="text-sm font-semibold text-foreground">
                              {condition || '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              {FieldLabels.Property.YearOfConstruction.de}
                            </p>
                            <p className="text-sm font-semibold text-foreground">
                              {form.yearOfConstruction || '—'}
                            </p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-border">
                          <KpfRangeBar
                            kpf={kpf}
                            range={range}
                            positionPct={positionPct}
                            isLoading={rangeLoading}
                            noData={noData}
                          />
                        </div>
                      </div>
                    </Tile>

                    <div className="flex-1" />
                  </div>
                )}
              </div>

            </div>
          </div>
        </main>

        <StickyActionBar
          show={true}
          ghostLabel={BUTTON_DETAILS.Discard.label}
          ghostIcon={<BUTTON_DETAILS.Discard.icon />}
          onGhost={() => router.push('/property-valuation/quick-check')}
          primaryLabel={BUTTON_DETAILS.Save.label}
          primaryIcon={<BUTTON_DETAILS.Save.icon />}
          primaryDisabled={!isFormValid || isSaving}
          onPrimary={handleSave}
        />
      </div>
    </>
  );
}
