"use client";

import { NoResult } from '@/components/common';
import { Button, Dropdown, Header, NumberField, RatingScale, StickyActionBar, TextField, Tile } from '@/components/ui';
import { BUTTON_DETAILS } from '@/constants/ButtonLabels';
import { FieldLabels } from '@/constants/FieldLabels';
import { PropertyCondition } from '@immonext/types';
import { Link2, PenLine } from 'lucide-react';
import { useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Step = 'input-method' | 'manual-form';

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

const CONDITION_MULTIPLIER: Record<PropertyCondition, number> = {
  [PropertyCondition.InNeedOfRenovation]: 0.85,
  [PropertyCondition.Standard]: 1.0,
  [PropertyCondition.Upscale]: 1.1,
  [PropertyCondition.Luxury]: 1.2,
};

function calcGrossYield(purchasePrice: number, coldRent: number): number {
  if (purchasePrice <= 0) return 0;
  return (coldRent * 12 / purchasePrice) * 100;
}

/** Maps gross yield → scale position 0 (best) to 1 (worst). ≥8% excellent, ≤2% bad. */
function yieldToScale(grossYield: number): number {
  const max = 8;
  const min = 2;
  const clamped = Math.min(max, Math.max(min, grossYield));
  return 1 - (clamped - min) / (max - min);
}

function yieldLabel(grossYield: number): string {
  if (grossYield >= 7) return 'Ausgezeichnet';
  if (grossYield >= 5.5) return 'Gut';
  if (grossYield >= 4) return 'Befriedigend';
  if (grossYield >= 2.5) return 'Ausreichend';
  return 'Schlecht';
}

function yieldDescription(grossYield: number, condition: PropertyCondition | ''): string {
  const conditionText = condition || 'Standard';
  if (grossYield >= 7)
    return `Sehr gute Investitionsmöglichkeit. Die Bruttomietrendite liegt bei ca. ${grossYield.toFixed(2)}%. Objekt im Zustand "${conditionText}" mit hoher Renditequalität.`;
  if (grossYield >= 5.5)
    return `Gute Investitionsmöglichkeit. Die Bruttomietrendite liegt bei ca. ${grossYield.toFixed(2)}%. Ein solides Investment mit Zustand "${conditionText}".`;
  if (grossYield >= 4)
    return `Durchschnittliche Investitionsmöglichkeit. Die Bruttomietrendite liegt bei ca. ${grossYield.toFixed(2)}%. Es handelt sich um eine akzeptable Investition, die jedoch genauer geprüft werden sollte.`;
  if (grossYield >= 2.5)
    return `Unterdurchschnittliche Rendite von ca. ${grossYield.toFixed(2)}%. Objekt im Zustand "${conditionText}" — eine detaillierte Prüfung ist empfehlenswert.`;
  return `Schwache Rendite von ca. ${grossYield.toFixed(2)}%. Bei Zustand "${conditionText}" ist diese Investition kritisch zu hinterfragen.`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function QuickCheckPage() {
  const [step, setStep] = useState<Step>('input-method');
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
  const multiplier = condition ? CONDITION_MULTIPLIER[condition] : 1;
  const adjustedRent = coldRent * multiplier;
  const grossYield = calcGrossYield(purchasePrice, adjustedRent);
  const scaleValue = yieldToScale(grossYield);
  const rating = yieldLabel(grossYield);

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
  // Step 1 – Input method selection
  // -------------------------------------------------------------------------
  if (step === 'input-method') {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8 max-w-3xl">
          <Header
            title="Ersteinschätzung"
            subtitle="Wählen Sie aus, wie Sie Ihre Immobiliendaten eingeben möchten"
          />

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* URL Import */}
            <Tile
              title="URL Import"
              icon={<Link2 className="w-6 h-6" />}
              description="Importieren Sie die Daten direkt aus einem Immobilienportal"
            >
              <div className="mt-4 space-y-4">
                <TextField
                  label="Portal-URL"
                  placeholder="https://"
                  value={portalUrl}
                  onChange={(e) => setPortalUrl(e.target.value)}
                />
                <Button
                  label={BUTTON_DETAILS.ImportData.label}
                  icon={<BUTTON_DETAILS.ImportData.icon />}
                  variant="primary"
                  className="w-full"
                  disabled
                  title="URL-Import ist noch nicht verfügbar"
                />
              </div>
            </Tile>

            {/* Manual entry */}
            <Tile
              title="Manuelle Eingabe"
              icon={<PenLine className="w-6 h-6" />}
              description="Geben Sie alle Immobiliendaten manuell ein"
            >
              <div className="mt-4">
                <Button
                   label={BUTTON_DETAILS.EnterManually.label}
                  icon={<BUTTON_DETAILS.EnterManually.icon />}
                  variant="outline"
                  className="w-full"
                  onClick={() => setStep('manual-form')}
                />
              </div>
            </Tile>
          </div>
        </main>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Step 2 – Manual form  (auto-calculates when all fields are filled)
  // -------------------------------------------------------------------------
  if (step === 'manual-form') {
    return (
      <div className="min-h-screen bg-background pb-20">
        <main className="container mx-auto px-4 py-3 max-w-5xl">

          <div className="mt-3 flex flex-col gap-4">

            {/* ── Two columns: form (left) + result (right) ─────────────── */}
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
                    <Header
                      subtitle={`${form.street}, ${form.postalCode} ${form.city}`}
                    />

                    <section>
                      <h2 className="text-sm font-semibold text-foreground mb-3">Bewertung</h2>
                      <RatingScale value={scaleValue} label={rating} />
                    </section>

                    <Tile title="">
                      <div className="flex flex-col gap-3">
                        <p className="text-sm text-foreground leading-relaxed">
                          <span
                            className={[
                              'inline-block w-2 h-2 mr-2 align-middle',
                              grossYield >= 7 ? 'bg-green-500' :
                                grossYield >= 5.5 ? 'bg-lime-500' :
                                  grossYield >= 4 ? 'bg-yellow-500' :
                                    grossYield >= 2.5 ? 'bg-orange-500' :
                                      'bg-red-500',
                            ].join(' ')}
                          />
                          {yieldDescription(grossYield, condition)}
                        </p>

                        <div className="grid grid-cols-2 gap-3 pt-3">
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
            setStep('input-method');
          }}
          primaryLabel={BUTTON_DETAILS.TakeOver.label}
          primaryIcon={<BUTTON_DETAILS.TakeOver.icon />}
          primaryDisabled={!isFormValid}
          onPrimary={() => {
            // TODO: persist to Property table via createProperty
          }}
        />
      </div>
    );
  }
}

