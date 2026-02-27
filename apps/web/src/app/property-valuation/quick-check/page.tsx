"use client";

import { useState } from 'react';
import { Link2, PenLine } from 'lucide-react';
import { Header, Tile, TextField, NumberField, Dropdown, Button, RatingScale } from '@/components/ui';
import { PropertyCondition } from '@immonext/types';
import { BUTTON_DETAILS } from '@/constants/ButtonLabels';
import { FieldLabels } from '@/constants/FieldLabels';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Step = 'input-method' | 'manual-form' | 'result';

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
  const handleFieldChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid =
    form.street.trim() !== '' &&
    form.postalCode.trim() !== '' &&
    form.city.trim() !== '' &&
    form.purchasePrice !== '' &&
    form.coldRent !== '' &&
    form.condition !== '';

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
  // Step 2 – Manual form
  // -------------------------------------------------------------------------
  if (step === 'manual-form') {
    return (
      <div className="min-h-screen bg-background pb-24">
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <Header
            title="Immobiliendaten"
            subtitle="Bitte geben Sie alle erforderlichen Informationen ein"
          />

          <div className="mt-8 space-y-8">
            {/* Address */}
            <section>
              <h2 className="text-base font-semibold text-foreground mb-4">Adresse</h2>
              <div className="space-y-4">
                <TextField
                  label={FieldLabels.Property.Street.de + ' & ' + FieldLabels.Property.HouseNumber.de}
                  placeholder="z.B. Hauptstraße 123"
                  value={form.street}
                  onChange={(e) => handleFieldChange('street', e.target.value)}
                />
                <div className="grid grid-cols-2 gap-4">
                  <TextField
                    label={FieldLabels.Property.PostalCode.de}
                    placeholder="z.B. 10115"
                    value={form.postalCode}
                    onChange={(e) => handleFieldChange('postalCode', e.target.value)}
                  />
                  <TextField
                    label={FieldLabels.Property.City.de}
                    placeholder="z.B. Berlin"
                    value={form.city}
                    onChange={(e) => handleFieldChange('city', e.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* Financial */}
            <section>
              <h2 className="text-base font-semibold text-foreground mb-4">Finanzielle Daten</h2>
              <div className="grid grid-cols-2 gap-4">
                <NumberField
                  label={FieldLabels.AcquisitionCosts.PurchasePrice.de}
                  placeholder="450000"
                  unit="€"
                  value={form.purchasePrice}
                  onChange={(e) => handleFieldChange('purchasePrice', e.target.value)}
                  min={0}
                />
                <NumberField
                  label={FieldLabels.Tenancy.ColdRent.de}
                  placeholder="1800"
                  unit="€"
                  value={form.coldRent}
                  onChange={(e) => handleFieldChange('coldRent', e.target.value)}
                  min={0}
                />
              </div>
            </section>

            {/* Property details */}
            <section>
              <h2 className="text-base font-semibold text-foreground mb-4">Objektdaten</h2>
              <div className="grid grid-cols-2 gap-4">
                <Dropdown
                  label="Zustand"
                  options={CONDITION_OPTIONS}
                  value={form.condition}
                  onChange={(e) => handleFieldChange('condition', e.target.value)}
                />
                <NumberField
                  label={FieldLabels.Property.YearOfConstruction.de}
                  placeholder="z.B. 1995"
                  value={form.yearOfConstruction}
                  onChange={(e) => handleFieldChange('yearOfConstruction', e.target.value)}
                  min={1800}
                  max={new Date().getFullYear()}
                />
              </div>
            </section>
          </div>

          {/* Navigation buttons */}
          <div className="mt-10 flex gap-3 float-right">
            <Button
              label={BUTTON_DETAILS.Back.label}
              icon={<BUTTON_DETAILS.Back.icon />}
              variant="outline"
              onClick={() => setStep('input-method')}
            />
            <Button
              label={BUTTON_DETAILS.Calculate.label}
              icon={<BUTTON_DETAILS.Calculate.icon />}
              variant="primary"
              disabled={!isFormValid}
              onClick={() => setStep('result')}
            />
          </div>
        </main>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Step 3 – Result
  // -------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-background pb-24">
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Header
          title="Ersteinschätzung Ergebnis"
          subtitle={`${form.street}, ${form.postalCode} ${form.city}`}
        />

        <div className="mt-10 space-y-8">
          {/* Rating scale */}
          <section>
            <h2 className="text-base font-semibold text-foreground mb-6">Bewertung</h2>
            <RatingScale value={scaleValue} label={rating} />
          </section>

          {/* Summary card */}
          <Tile title="">
            <div className="space-y-4">
              {/* Verdict */}
              <p className="text-sm text-foreground leading-relaxed">
                <span
                  className={[
                    'inline-block w-2 h-2 rounded-full mr-2 align-middle',
                    grossYield >= 7 ? 'bg-green-500' :
                      grossYield >= 5.5 ? 'bg-lime-500' :
                        grossYield >= 4 ? 'bg-yellow-500' :
                          grossYield >= 2.5 ? 'bg-orange-500' :
                            'bg-red-500',
                  ].join(' ')}
                />
                {yieldDescription(grossYield, condition)}
              </p>

              {/* Key figures */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground">{FieldLabels.AcquisitionCosts.PurchasePrice.de}</p>
                  <p className="text-sm font-semibold text-foreground">
                    {purchasePrice.toLocaleString('de-DE')} €
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{FieldLabels.Tenancy.ColdRent.de}</p>
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
                  <p className="text-xs text-muted-foreground">{FieldLabels.Property.YearOfConstruction.de}</p>
                  <p className="text-sm font-semibold text-foreground">
                    {form.yearOfConstruction || '—'}
                  </p>
                </div>
              </div>
            </div>
          </Tile>
        </div>

        {/* Action buttons */}
        <div className="mt-10 flex gap-3">
          <Button
            label={BUTTON_DETAILS.Discard.label}
            icon={<BUTTON_DETAILS.Discard.icon/>}
            variant="outline"
            className="flex-1"
            onClick={() => {
              setForm({ street: '', postalCode: '', city: '', purchasePrice: '', coldRent: '', condition: '', yearOfConstruction: '' });
              setStep('input-method');
            }}
          />
          <Button
            label={BUTTON_DETAILS.TakeOver.label}
            icon={<BUTTON_DETAILS.TakeOver.icon/>}
            variant="primary"
            className="flex-1"
            onClick={() => {
              // TODO: persist to Property table via createProperty
            }}
          />
        </div>
      </main>
    </div>
  );
}

