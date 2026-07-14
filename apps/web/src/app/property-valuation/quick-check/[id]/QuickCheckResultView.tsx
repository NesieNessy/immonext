"use client";

import { KpfRangeBar, NoResult } from '@/components/common';
import { Button, Dropdown, Header, Modal, NumberField, StickyActionBar, TextField, Tile } from '@/components/ui';
import { BUTTON_DETAILS } from '@/constants/ButtonLabels';
import { FieldLabels } from '@/constants/FieldLabels';
import { useKpfResult } from '@/hooks/useKpfRanges';
import { useQuickCheckById } from '@/hooks/useQuickCheckById';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import {
  acceptQuickCheck,
  discardQuickCheck,
  updateQuickCheck,
  type AcceptPropertyInput,
} from '@/lib/supabase/quick_check.supabase';
import { calcKpf } from '@/utils/kpf';
import { EnergyEfficient, PropertyCondition } from '@immonext/types';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EditForm {
  street: string;
  postalCode: string;
  city: string;
  purchasePrice: string;
  coldRent: string;
  condition: PropertyCondition | '';
  yearOfConstruction: string;
}

interface AcceptForm {
  street: string;
  houseNumber: string;
  cityName: string;
  federalState: string;
  cityId: string;
  propertyAbbreviation: string;
  squareMeters: string;
  numberOfRooms: string;
  energyEfficient: EnergyEfficient | '';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CONDITION_OPTIONS = [
  { value: '', label: 'Bitte auswählen' },
  ...Object.values(PropertyCondition).map((v) => ({ value: v, label: v })),
];

const ENERGY_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Bitte auswählen' },
  ...Object.values(EnergyEfficient).map((v) => ({
    value: v,
    label: v,
  })),
];

const EMPTY_ACCEPT_FORM: AcceptForm = {
  street: '', houseNumber: '', cityName: '', federalState: '',
  cityId: '', propertyAbbreviation: '', squareMeters: '',
  numberOfRooms: '', energyEfficient: '',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props { id: number; }

export function QuickCheckResultView({ id }: Props) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useRequireAuth();
  const { data, isLoading, error } = useQuickCheckById(id);

  // Edit form (ACTIVE state) 
  const [editForm, setEditForm] = useState<EditForm>({
    street: '', postalCode: '', city: '', purchasePrice: '', coldRent: '', condition: '', yearOfConstruction: '',
  });
  const [portalUrl, setPortalUrl] = useState('');

  // Accept modal (ACTIVE → ACCEPT)
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [acceptForm, setAcceptForm] = useState<AcceptForm>(EMPTY_ACCEPT_FORM);

  // UI state
  const [isBusy, setIsBusy] = useState(false);

  // Pre-fill edit form when record loads
  useEffect(() => {
    if (!data) return;
    setEditForm({
      street:             data.street,
      postalCode:         data.postalCode,
      city:               data.city,
      purchasePrice:      String(data.purchasePrice),
      coldRent:           String(data.coldRent),
      condition:          data.condition,
      yearOfConstruction: String(data.yearOfConstruction),
    });
    setPortalUrl(data.portalId ?? '');
  }, [data]);

  // Derived edit-form values 
  const purchasePrice      = parseFloat(editForm.purchasePrice) || 0;
  const coldRent           = parseFloat(editForm.coldRent) || 0;
  const condition          = editForm.condition as PropertyCondition | '';
  const yearOfConstruction = parseInt(editForm.yearOfConstruction, 10) || null;
  const currentYear        = new Date().getFullYear();

  const { kpf, range, positionPct, isLoading: rangeLoading, noData } = useKpfResult(
    purchasePrice, coldRent, editForm.postalCode, condition, yearOfConstruction,
  );

  // Validation 
  const editErrors = {
    street: editForm.street.length > 0 && editForm.street.trim().length > 120
      ? 'Maximal 120 Zeichen' : '',
    postalCode: editForm.postalCode.length > 0 && !/^\d{5}$/.test(editForm.postalCode)
      ? 'Genau 5 Ziffern erforderlich' : '',
    city: editForm.city.length > 0 && editForm.city.trim().length > 120
      ? 'Maximal 120 Zeichen' : '',
    purchasePrice: editForm.purchasePrice !== '' && purchasePrice <= 0
      ? 'Muss größer als 0 sein' : '',
    coldRent: editForm.coldRent !== '' && coldRent <= 0
      ? 'Muss größer als 0 sein' : '',
    yearOfConstruction: (() => {
      const y = parseInt(editForm.yearOfConstruction, 10);
      if (editForm.yearOfConstruction === '') return '';
      return isNaN(y) || y < 1850 || y > currentYear ? `Zwischen 1850 und ${currentYear}` : '';
    })(),
  };

  const isEditValid =
    editForm.street.trim() !== '' &&
    editForm.street.trim().length <= 120 &&
    /^\d{5}$/.test(editForm.postalCode) &&
    editForm.city.trim() !== '' &&
    editForm.city.trim().length <= 120 &&
    purchasePrice > 0 && coldRent > 0 && condition !== '' &&
    (() => { const y = parseInt(editForm.yearOfConstruction, 10); return !isNaN(y) && y >= 1850 && y <= currentYear; })();

  // Whether the KPF result panel can be shown — independent of street/city,
  // since the calculation itself only needs price, rent, postal code,
  // condition and year. Legacy records can have a missing address.
  const canShowResult =
    /^\d{5}$/.test(editForm.postalCode) &&
    purchasePrice > 0 && coldRent > 0 && condition !== '' &&
    (() => { const y = parseInt(editForm.yearOfConstruction, 10); return !isNaN(y) && y >= 1850 && y <= currentYear; })();

  const isAcceptValid =
    acceptForm.street.trim() !== '' &&
    acceptForm.houseNumber.trim() !== '' &&
    acceptForm.cityName.trim() !== '' &&
    acceptForm.federalState.trim() !== '' &&
    parseInt(acceptForm.cityId, 10) > 0 &&
    acceptForm.propertyAbbreviation.trim() !== '' &&
    parseFloat(acceptForm.squareMeters) > 0 &&
    parseFloat(acceptForm.numberOfRooms) > 0 &&
    acceptForm.energyEfficient !== '';

  // Handlers
  const handleEditField = (f: keyof EditForm, v: string) =>
    setEditForm((p) => ({ ...p, [f]: v }));

  const handleAcceptField = (f: keyof AcceptForm, v: string) =>
    setAcceptForm((p) => ({ ...p, [f]: v }));

  const handleSave = async () => {
    if (!isEditValid) return;
    setIsBusy(true);
    try {
      await updateQuickCheck(id, {
        portalId: portalUrl || undefined,
        purchasePrice, coldRent,
        street:             editForm.street.trim(),
        postalCode:         editForm.postalCode,
        city:               editForm.city.trim(),
        yearOfConstruction: parseInt(editForm.yearOfConstruction, 10),
        condition:          condition as PropertyCondition,
        kpfMultiplier:      calcKpf(purchasePrice, coldRent) ?? 0,
      });
      router.push('/property-valuation/quick-check');
    } finally {
      setIsBusy(false);
    }
  };

  const handleDiscard = async () => {
    if (!user) return;
    setIsBusy(true);
    try {
      await discardQuickCheck(id, user.id);
      router.push('/property-valuation/quick-check');
    } finally {
      setIsBusy(false);
    }
  };

  const handleAccept = async () => {
    if (!user || !isAcceptValid) return;
    setIsBusy(true);
    try {
      const propertyInput: AcceptPropertyInput = {
        street:               acceptForm.street.trim(),
        houseNumber:          acceptForm.houseNumber.trim(),
        cityName:             acceptForm.cityName.trim(),
        federalState:         acceptForm.federalState.trim(),
        cityId:               parseInt(acceptForm.cityId, 10),
        propertyAbbreviation: acceptForm.propertyAbbreviation.trim(),
        squareMeters:         parseFloat(acceptForm.squareMeters),
        numberOfRooms:        parseFloat(acceptForm.numberOfRooms),
        energyEfficient:      acceptForm.energyEfficient as EnergyEfficient,
      };
      const newPropertyId = await acceptQuickCheck(id, user.id, propertyInput);
      router.push(`/existing-properties/${newPropertyId}/property-data`);
    } finally {
      setIsBusy(false);
      setAcceptModalOpen(false);
    }
  };

  // Guards 
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

  // Editable form (ACTIVE) 
  return (
    <>
      {/* Accept modal */}
      <Modal
        open={acceptModalOpen}
        onClose={() => setAcceptModalOpen(false)}
        title={BUTTON_DETAILS.TakeOver.label}
        subtitle="Objektdaten für die Portfolio-Aufnahme"
        icon={<BUTTON_DETAILS.TakeOver.icon />}
        footer={
          <>
            <Button
              label={BUTTON_DETAILS.Cancel.label}
              icon={<BUTTON_DETAILS.Cancel.icon />}
              variant="outline"
              onClick={() => setAcceptModalOpen(false)}
            />
            <Button
              label={BUTTON_DETAILS.TakeOver.label}
              icon={<BUTTON_DETAILS.TakeOver.icon />}
              variant="primary"
              disabled={!isAcceptValid || isBusy}
              onClick={handleAccept}
            />
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <TextField
              label={FieldLabels.Property.Street.de}
              placeholder="z.B. Hauptstraße"
              required
              value={acceptForm.street}
              onChange={(e) => handleAcceptField('street', e.target.value)}
            />
            <TextField
              label={FieldLabels.Property.HouseNumber.de}
              placeholder="z.B. 12a"
              required
              value={acceptForm.houseNumber}
              onChange={(e) => handleAcceptField('houseNumber', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <TextField
              label={FieldLabels.Property.City.de}
              placeholder="z.B. Berlin"
              required
              value={acceptForm.cityName}
              onChange={(e) => handleAcceptField('cityName', e.target.value)}
            />
            <TextField
              label={FieldLabels.Property.FederalState.de}
              placeholder="z.B. Bayern"
              required
              value={acceptForm.federalState}
              onChange={(e) => handleAcceptField('federalState', e.target.value)}
            />
          </div>
          <NumberField
            label="Stadt-ID"
            placeholder="z.B. 1"
            required
            value={acceptForm.cityId}
            onChange={(e) => handleAcceptField('cityId', e.target.value)}
            min={1}
          />
          <TextField
            label={FieldLabels.Property.PropertyAbbreviation.de}
            placeholder="z.B. BER-01"
            required
            value={acceptForm.propertyAbbreviation}
            onChange={(e) => handleAcceptField('propertyAbbreviation', e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <NumberField
              label={FieldLabels.Property.SquareMeters.de}
              placeholder="z.B. 75"
              unit="€"
              required
              value={acceptForm.squareMeters}
              onChange={(e) => handleAcceptField('squareMeters', e.target.value)}
              min={1}
            />
            <NumberField
              label={FieldLabels.Property.NumberOfRooms.de}
              placeholder="z.B. 3"
              required
              value={acceptForm.numberOfRooms}
              onChange={(e) => handleAcceptField('numberOfRooms', e.target.value)}
              min={0.5}
            />
          </div>
          <Dropdown
            label={FieldLabels.Property.EnergyEfficient.de}
            options={ENERGY_OPTIONS}
            required
            value={acceptForm.energyEfficient}
            onChange={(e) => handleAcceptField('energyEfficient', e.target.value)}
          />
        </div>
      </Modal>

      {/* Main page */}
      <div className="min-h-screen bg-background pb-20">
        <main className="container mx-auto px-4 py-3">
          <Header
            title="Immobilien-Ersteinschätzung"
            subtitle="Bewertung von Investitionsobjekten"
          />

          <div className="mt-3 flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row gap-8 items-stretch">

              {/* Left: editable form */}
              <div className="flex flex-col gap-3 flex-1 p-5">
                <section>
                  <h2 className="text-md font-semibold text-foreground mb-2">
                    Informationen zur Berechnung
                  </h2>
                  <div className="flex flex-col gap-2 pt-1.5">
                    <TextField
                      label={FieldLabels.Property.Street.de + ' & ' + FieldLabels.Property.HouseNumber.de}
                      placeholder="z.B. Hauptstraße 123"
                      required
                      value={editForm.street}
                      onChange={(e) => handleEditField('street', e.target.value)}
                      error={editErrors.street}
                    />
                    <div className="grid grid-cols-2 gap-2">
                    <TextField
                      label={FieldLabels.Property.PostalCode.de}
                      placeholder="z.B. 10115"
                      required
                      value={editForm.postalCode}
                      onChange={(e) => handleEditField('postalCode', e.target.value)}
                      error={editErrors.postalCode}
                    />
                    <TextField
                      label={FieldLabels.Property.City.de}
                      placeholder="z.B. Berlin"
                      required
                      value={editForm.city}
                      onChange={(e) => handleEditField('city', e.target.value)}
                      error={editErrors.city}
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
                      value={editForm.purchasePrice}
                      onChange={(e) => handleEditField('purchasePrice', e.target.value)}
                      min={0}
                      error={editErrors.purchasePrice}
                    />
                    <NumberField
                      label={FieldLabels.Tenancy.ColdRent.de}
                      placeholder="z.B. 1800"
                      unit="€"
                      required
                      value={editForm.coldRent}
                      onChange={(e) => handleEditField('coldRent', e.target.value)}
                      min={0}
                      error={editErrors.coldRent}
                    />
                  </div>
                </section>
                <section>
                  <div className="grid grid-cols-2 gap-2">
                    <Dropdown
                      label="Zustand"
                      options={CONDITION_OPTIONS}
                      required
                      value={editForm.condition}
                      onChange={(e) => handleEditField('condition', e.target.value)}
                    />
                    <NumberField
                      label={FieldLabels.Property.YearOfConstruction.de}
                      placeholder="z.B. 1995"
                      required
                      value={editForm.yearOfConstruction}
                      onChange={(e) => handleEditField('yearOfConstruction', e.target.value)}
                      min={1850}
                      max={currentYear}
                      error={editErrors.yearOfConstruction}
                    />
                  </div>
                </section>
                <div className="flex-1" />
              </div>

              {/* Right: live result */}
              <div className="flex flex-col flex-1 gap-4 p-5">
                {!canShowResult ? (
                  <NoResult className="flex-1" />
                ) : (
                  <div className="flex flex-col gap-4 flex-1">
                    <h2>Ersteinschätzung</h2>
                    <h5>{`${editForm.street}, ${editForm.postalCode} ${editForm.city}`}</h5>
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
                            <p className="text-sm font-semibold text-foreground">{condition || 'â€”'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">{FieldLabels.Property.YearOfConstruction.de}</p>
                            <p className="text-sm font-semibold text-foreground">{editForm.yearOfConstruction || 'â€”'}</p>
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
          onGhost={handleDiscard}
          primaryLabel={BUTTON_DETAILS.TakeOver.label}
          primaryIcon={<BUTTON_DETAILS.TakeOver.icon />}
          primaryDisabled={!isEditValid || isBusy}
          onPrimary={() => {
            // Save any edits first, then open property details modal
            handleSave().then(() => {}).catch(() => {});
            setAcceptModalOpen(true);
          }}
        />
      </div>
    </>
  );
}
