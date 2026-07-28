"use client";

import { PROPERTY_CATEGORY_CREATE_OPTIONS } from '@/components/features/PropertyDisplay';
import { CalendarField, Dropdown, Header, NumberField, StickyActionBar, TextField, UploadButton } from '@/components/ui';
import { BUTTON_DETAILS } from '@/constants/ButtonLabels';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { createAcquisitionCosts } from '@/lib/supabase/acquisition_costs.supabase';
import { createParkingSpace } from '@/lib/supabase/parking_space.supabase';
import { createProperty } from '@/lib/supabase/property.supabase';
import { createPropertyAcquisition } from '@/lib/supabase/property_acquisition.supabase';
import { base64ToDataUri, cn } from '@/lib/utils';
import { EnergyEfficient } from '@immonext/types';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

/** Strips the "data:image/...;base64," prefix — Property.imageUrl stores
 *  raw base64 only; base64ToDataUri() re-adds the right prefix for display. */
function readFileAsRawBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

const ENERGY_OPTIONS = [
  { value: '', label: '–' },
  ...Object.values(EnergyEfficient).map((v) => ({ value: v, label: v })),
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pb-2 border-b border-border">
      {children}
    </p>
  );
}

function NewPropertyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useRequireAuth();

  // Prefill comes from NewPropertyModal's "Aus Detailbewertung übernehmen"
  // step via query params — that step already has the full row in memory,
  // so there's no need to re-fetch it here. Absent for "Manuell erfassen".
  const [objektkategorie, setObjektkategorie] = useState(searchParams.get('kategorie') ?? '');
  const [kaufdatum, setKaufdatum] = useState<Date | undefined>(undefined);
  const [kaufpreis, setKaufpreis] = useState('');
  const [strasseHausnummer, setStrasseHausnummer] = useState(searchParams.get('strasse') ?? '');
  const [plz, setPlz] = useState(searchParams.get('plz') ?? '');
  const [ort, setOrt] = useState(searchParams.get('ort') ?? '');
  const [bundesland, setBundesland] = useState('');
  const [baujahr, setBaujahr] = useState(searchParams.get('baujahr') ?? '');
  const [wohnflaeche, setWohnflaeche] = useState(searchParams.get('wohnflaeche') ?? '');
  const [anzahlZimmer, setAnzahlZimmer] = useState('');
  const [stellplaetze, setStellplaetze] = useState('0');
  const [energieeffizienz, setEnergieeffizienz] = useState('');
  const [bildBase64, setBildBase64] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageSelect = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setBildBase64(await readFileAsRawBase64(file));
  };

  const currentYear = new Date().getFullYear();
  const isValid =
    objektkategorie !== '' &&
    strasseHausnummer.trim() !== '' &&
    /^\d{5}$/.test(plz) &&
    ort.trim() !== '' &&
    /^\d{4}$/.test(baujahr) && Number(baujahr) >= 1800 && Number(baujahr) <= currentYear &&
    Number(wohnflaeche) > 0 &&
    stellplaetze !== '' && Number(stellplaetze) >= 0;

  const handleSave = async () => {
    if (!isValid || !user) return;
    setIsSaving(true);
    setError(null);
    try {
      const created = await createProperty({
        userId: user.id,
        cityId: null,
        propertyAbbreviation: null,
        street: strasseHausnummer.trim(),
        houseNumber: '',
        city: ort.trim(),
        postalCode: plz,
        federalState: bundesland.trim(),
        squareMeters: Number(wohnflaeche),
        numberOfRooms: anzahlZimmer !== '' ? Number(anzahlZimmer) : null,
        yearOfConstruction: Number(baujahr),
        energyEfficient: (energieeffizienz || null) as EnergyEfficient | null,
        propertyCategory: objektkategorie,
        imageUrl: bildBase64,
      });
      if (!created) {
        setError('Objekt konnte nicht gespeichert werden.');
        return;
      }

      if (kaufdatum) {
        await createPropertyAcquisition({
          propertyId: created.propertyId,
          houseCompletionYear: null,
          purchaseDate: format(kaufdatum, 'yyyy-MM-dd'),
          transferDate: null,
        });
      }

      if (kaufpreis !== '' && Number(kaufpreis) > 0) {
        await createAcquisitionCosts({
          propertyId: created.propertyId,
          parkingSpaceId: null,
          propertyPurchasePrice: Number(kaufpreis),
          pricePerSqm: null,
          broker: null,
          brokerValue: null,
          notary: null,
          notaryValue: null,
          landRegistry: null,
          landRegistryValue: null,
          realEstateTax: null,
          realEstateTaxValue: null,
          adjustmentVariable: null,
          adjustmentVariableValue: null,
          totalAncillaryCostsValue: null,
          totalAncillaryCosts: null,
          parkingSpacePurchasePrice: null,
        });
      }

      const parkingCount = Number(stellplaetze);
      if (parkingCount > 0) {
        await createParkingSpace({
          propertyId: created.propertyId,
          parkingSpaceType: 'OTHER',
          numberOfParkingSpaces: parkingCount,
        });
      }

      router.push('/existing-properties');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <main className="container mx-auto px-4 pt-8 pb-3">
        <Header
          items={[
            { label: 'Bestandsobjekte', href: '/existing-properties' },
            { label: 'Neues Objekt anlegen' },
          ]}
        />

        <div className="mt-6 mx-auto flex flex-col gap-6 max-w-2xl">
          <p className="text-sm text-muted-foreground">Erfassen Sie die Stammdaten des Bestandsobjekts.</p>

          {error && (
            <div className="px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <SectionLabel>Objektbild (opt.)</SectionLabel>
            <div className="flex items-center gap-4">
              {bildBase64 && (
                <div className="relative shrink-0">
                  <img
                    src={base64ToDataUri(bildBase64)!}
                    alt=""
                    className="w-20 h-20 object-cover rounded-lg border border-border"
                  />
                  <button
                    type="button"
                    onClick={() => setBildBase64(null)}
                    aria-label="Bild entfernen"
                    className="absolute -top-2 -right-2 p-1 rounded-full bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <UploadButton
                buttonText={bildBase64 ? 'Anderes Bild wählen' : 'Bild hochladen'}
                accept="image/*"
                onFileSelect={(files) => void handleImageSelect(files)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <SectionLabel>Objektkategorie</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {PROPERTY_CATEGORY_CREATE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setObjektkategorie(opt.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
                    objektkategorie === opt.value
                      ? "bg-primary/10 border-primary text-primary"
                      : "border-border text-foreground hover:bg-muted"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <SectionLabel>Kaufinformationen</SectionLabel>
            <div className="grid grid-cols-2 gap-3 max-w-md">
              <CalendarField
                label="Kaufdatum (opt.)"
                value={kaufdatum}
                onChange={setKaufdatum}
              />
              <NumberField
                label="Kaufpreis (opt.)"
                placeholder="450.000"
                unit="€"
                value={kaufpreis}
                onChange={(e) => setKaufpreis(e.target.value)}
                min={0}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <SectionLabel>Adresse</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr] gap-3">
              <TextField
                label="Straße & Hausnummer"
                placeholder="Beispielstraße 123"
                value={strasseHausnummer}
                onChange={(e) => setStrasseHausnummer(e.target.value)}
              />
              <TextField
                label="PLZ"
                placeholder="80801"
                value={plz}
                onChange={(e) => setPlz(e.target.value.replace(/\D/g, '').slice(0, 5))}
              />
              <TextField
                label="Ort"
                placeholder="München"
                value={ort}
                onChange={(e) => setOrt(e.target.value)}
              />
              <TextField
                label="Bundesland (opt.)"
                placeholder="Bayern"
                value={bundesland}
                onChange={(e) => setBundesland(e.target.value)}
                className="sm:col-span-2"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <SectionLabel>Objektdetails</SectionLabel>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <NumberField
                label="Baujahr"
                placeholder="1980"
                value={baujahr}
                onChange={(e) => setBaujahr(e.target.value.replace(/\D/g, '').slice(0, 4))}
              />
              <NumberField
                label="Wohnfläche"
                placeholder="100"
                unit="m²"
                value={wohnflaeche}
                onChange={(e) => setWohnflaeche(e.target.value)}
                min={0}
              />
              <NumberField
                label="Anzahl Zimmer (opt.)"
                placeholder="3"
                value={anzahlZimmer}
                onChange={(e) => setAnzahlZimmer(e.target.value)}
                min={0}
              />
              <NumberField
                label="Stellplätze"
                placeholder="0"
                value={stellplaetze}
                onChange={(e) => setStellplaetze(e.target.value)}
                min={0}
              />
              <Dropdown
                label="Energieeffizienz (opt.)"
                options={ENERGY_OPTIONS}
                value={energieeffizienz}
                onChange={(e) => setEnergieeffizienz(e.target.value)}
              />
            </div>
          </div>
        </div>
      </main>

      <StickyActionBar
        show={true}
        ghostLabel={BUTTON_DETAILS.Cancel.label}
        ghostIcon={<BUTTON_DETAILS.Cancel.icon />}
        onGhost={() => router.push('/existing-properties')}
        primaryLabel={BUTTON_DETAILS.Save.label}
        primaryIcon={<BUTTON_DETAILS.Save.icon />}
        primaryDisabled={!isValid || isSaving || authLoading}
        onPrimary={() => void handleSave()}
      />
    </div>
  );
}

export default function NewPropertyPage() {
  return (
    <Suspense fallback={null}>
      <NewPropertyPageContent />
    </Suspense>
  );
}
