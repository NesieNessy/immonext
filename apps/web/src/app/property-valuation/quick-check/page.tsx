"use client";

import { KpfRangeBar, NoResult } from '@/components/common';
import { Button, Dropdown, Header, Modal, NumberField, StickyActionBar, TextField, Tile } from '@/components/ui';
import { BUTTON_DETAILS } from '@/constants/ButtonLabels';
import { FieldLabels } from '@/constants/FieldLabels';
import { useKpfResult } from '@/hooks/useKpfRanges';
import { PropertyCondition } from '@immonext/types';
import { useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FormData {
  street: string;
  postalCode: string;
  city: string;
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
// Page
// ---------------------------------------------------------------------------

export default function QuickCheckPage() {
  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const [portalUrl, setPortalUrl] = useState('');
  const [form, setForm] = useState<FormData>({
    street: '',
    postalCode: '',
    city: '',
    purchasePrice: '',
    coldRent: '',
    condition: '',
    yearOfConstruction: '',
  });

  const purchasePrice = parseFloat(form.purchasePrice) || 0;
  const coldRent = parseFloat(form.coldRent) || 0;
  const condition = form.condition as PropertyCondition | '';

  const yearOfConstructionNum = parseInt(form.yearOfConstruction, 10) || null;
  const { kpf, range, positionPct, isLoading, noData } = useKpfResult(
    purchasePrice,
    coldRent,
    form.postalCode,
    condition,
    yearOfConstructionNum,
  );

  const currentYear = new Date().getFullYear();

  // Per-field validation — only shown when the field has been touched (non-empty)
  const fieldErrors = {
    street:
      form.street.length > 0 && form.street.trim().length > 120
        ? 'Maximal 120 Zeichen'
        : '',
    postalCode:
      form.postalCode.length > 0 && !/^\d{5}$/.test(form.postalCode)
        ? 'Genau 5 Ziffern erforderlich'
        : '',
    city:
      form.city.length > 0 && form.city.trim().length > 120
        ? 'Maximal 120 Zeichen'
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

  const handleFieldChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid =
    form.street.trim() !== '' &&
    form.street.trim().length <= 120 &&
    /^\d{5}$/.test(form.postalCode) &&
    form.city.trim() !== '' &&
    form.city.trim().length <= 120 &&
    purchasePrice > 0 &&
    coldRent > 0 &&
    form.condition !== '' &&
    (() => {
      const y = parseInt(form.yearOfConstruction, 10);
      return !isNaN(y) && y >= 1850 && y <= currentYear;
    })();

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <>
      {/* ── URL Import Modal ──────────────────────────────────────────────── */}
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

      {/* ── Main page ─────────────────────────────────────────────────────── */}
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

              {/* Left: form — fills full column height */}
              <div className="flex flex-col gap-3 flex-1 p-5">

                {/* Address */}
                <section>
                  <h2 className="text-md font-semibold text-foreground mb-2">Informationen zur Berechnung</h2>
                  <div className="flex flex-col gap-2">
                    <TextField
                      label={FieldLabels.Property.Street.de + ' & ' + FieldLabels.Property.HouseNumber.de}
                      placeholder="z.B. Hauptstraße 123"
                      required
                      value={form.street}
                      onChange={(e) => handleFieldChange('street', e.target.value)}
                      error={fieldErrors.street}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <TextField
                        label={FieldLabels.Property.PostalCode.de}
                        placeholder="z.B. 10115"
                        required
                        value={form.postalCode}
                        onChange={(e) => handleFieldChange('postalCode', e.target.value)}
                        error={fieldErrors.postalCode}
                      />
                      <TextField
                        label={FieldLabels.Property.City.de}
                        placeholder="z.B. Berlin"
                        required
                        value={form.city}
                        onChange={(e) => handleFieldChange('city', e.target.value)}
                        error={fieldErrors.city}
                      />
                    </div>
                  </div>
                </section>

                {/* Financial */}
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

                {/* Property details */}
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
                      max={new Date().getFullYear()}
                      error={fieldErrors.yearOfConstruction}
                    />
                  </div>
                </section>

                {/* Push bottom of form to fill column height */}
                <div className="flex-1" />

              </div>

              {/* Right: result — fills full column height */}
              <div className="flex flex-col flex-1 gap-4 p-5">
                {!isFormValid ? (
                  <NoResult className="flex-1" />
                ) : (
                  <div className="flex flex-col gap-4 flex-1">
                    <h2>Ersteinschätzung</h2>
                    <h5>{`${form.street}, ${form.postalCode} ${form.city}`}</h5>
                    <Tile title="">
                      <div className="flex flex-col gap-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-muted-foreground">{FieldLabels.AcquisitionCosts.PurchasePrice.de}</p>
                            <p className="text-sm font-semibold text-foreground">{purchasePrice.toLocaleString('de-DE')} €</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">{FieldLabels.Tenancy.ColdRent.de}</p>
                            <p className="text-sm font-semibold text-foreground">{coldRent.toLocaleString('de-DE')} €</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Zustand</p>
                            <p className="text-sm font-semibold text-foreground">{condition || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">{FieldLabels.Property.YearOfConstruction.de}</p>
                            <p className="text-sm font-semibold text-foreground">{form.yearOfConstruction || '—'}</p>
                          </div>
                        </div>

                        {/* KPF corridor bar */}
                        <div className="pt-3 border-t border-border">
                          <KpfRangeBar
                            kpf={kpf}
                            range={range}
                            positionPct={positionPct}
                            isLoading={isLoading}
                            noData={noData}
                          />
                        </div>
                      </div>
                    </Tile>

                    {/* Spacer fills remaining height to match left column bottom */}
                    <div className="flex-1" />
                  </div>
                )}
              </div>

            </div>

            {/* ── Action buttons — sticky bar at the bottom of the viewport ── */}
          </div>
        </main>

        <StickyActionBar
          show={true}
          ghostLabel={BUTTON_DETAILS.Discard.label}
          ghostIcon={<BUTTON_DETAILS.Discard.icon />}
          onGhost={() => {
            setForm({ street: '', postalCode: '', city: '', purchasePrice: '', coldRent: '', condition: '', yearOfConstruction: '' });
          }}
          primaryLabel={BUTTON_DETAILS.TakeOver.label}
          primaryIcon={<BUTTON_DETAILS.TakeOver.icon />}
          primaryDisabled={!isFormValid}
          onPrimary={() => {
            // TODO: persist to Property table via createProperty
          }}
        />
      </div>
    </>
  );
}
