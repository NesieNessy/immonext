"use client";

import { NoResult } from '@/components/common';
import { KpfAssessmentCard } from '@/components/features/KpfAssessmentCard';
import { MobileResultBanner } from '@/components/features/MobileResultBanner';
import { QuickCheckImportSection } from '@/components/features/QuickCheckImportSection';
import { Dropdown, Header, NumberField, StickyActionBar, TextField } from '@/components/ui';
import { BUTTON_DETAILS } from '@/constants/ButtonLabels';
import { FieldLabels } from '@/constants/FieldLabels';
import { useQuickCheckById } from '@/hooks/useQuickCheckById';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import {
  acceptQuickCheck,
  discardQuickCheck,
  updateQuickCheck,
} from '@/lib/supabase/quick_check.supabase';
import { calcKpf } from '@/utils/kpf';
import { isValidConstructionYear } from '@/utils/validation';
import { PropertyCondition } from '@immonext/types';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

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

  // Snapshot of the loaded values, to detect whether the user has changed
  // anything since the record was fetched.
  const [initialForm, setInitialForm] = useState<EditForm | null>(null);
  const [initialPortalUrl, setInitialPortalUrl] = useState('');

  // UI state
  const [isBusy, setIsBusy] = useState(false);

  // Pre-fill edit form when record loads
  useEffect(() => {
    if (!data) return;
    const loadedForm: EditForm = {
      street:             data.street,
      postalCode:         data.postalCode,
      city:               data.city,
      purchasePrice:      String(data.purchasePrice),
      coldRent:           String(data.coldRent),
      condition:          data.condition,
      yearOfConstruction: String(data.yearOfConstruction),
    };
    setEditForm(loadedForm);
    setInitialForm(loadedForm);
    setPortalUrl(data.portalId ?? '');
    setInitialPortalUrl(data.portalId ?? '');
  }, [data]);

  // Derived edit-form values
  const purchasePrice = parseFloat(editForm.purchasePrice) || 0;
  const coldRent      = parseFloat(editForm.coldRent) || 0;
  const condition     = editForm.condition as PropertyCondition | '';
  const currentYear   = new Date().getFullYear();

  const kpf = calcKpf(purchasePrice, coldRent);

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
    yearOfConstruction:
      editForm.yearOfConstruction !== '' && !isValidConstructionYear(parseInt(editForm.yearOfConstruction, 10), currentYear)
        ? `Zwischen 1850 und ${currentYear}`
        : '',
  };

  // Shared by isEditValid and canShowResult — everything the KPF calculation
  // itself needs (it never uses street/city).
  const financialsValid =
    /^\d{5}$/.test(editForm.postalCode) &&
    purchasePrice > 0 && coldRent > 0 && condition !== '' &&
    isValidConstructionYear(parseInt(editForm.yearOfConstruction, 10), currentYear);

  const isEditValid =
    financialsValid &&
    editForm.street.trim() !== '' &&
    editForm.street.trim().length <= 120 &&
    editForm.city.trim() !== '' &&
    editForm.city.trim().length <= 120;

  // Verwerfen/Übernehmen only make sense while the record is still pending
  // a decision — finalize_quick_check itself rejects DISCARD/ACCEPT once
  // status is no longer ACTIVE or a decision was already recorded.
  // (data is still possibly null here — the loading/error/not-found guards
  // that narrow it run later; this value is unused during those states.)
  const isActionable = data?.status === 'ACTIVE' && data?.finalisedAction === null;

  // Verwerfen/Übernehmen also require the user to have actually changed
  // something compared to the loaded record.
  const hasChanges =
    initialForm !== null &&
    (editForm.street !== initialForm.street ||
      editForm.postalCode !== initialForm.postalCode ||
      editForm.city !== initialForm.city ||
      editForm.purchasePrice !== initialForm.purchasePrice ||
      editForm.coldRent !== initialForm.coldRent ||
      editForm.condition !== initialForm.condition ||
      editForm.yearOfConstruction !== initialForm.yearOfConstruction ||
      portalUrl !== initialPortalUrl);

  // Whether the KPF result panel can be shown — independent of street/city,
  // since the calculation itself only needs price, rent, postal code,
  // condition and year. Legacy records can have a missing address.
  const canShowResult = financialsValid;

  // On mobile, jump straight to the result on first load — this view is for
  // an already-computed record, so there's no reason to make the user
  // scroll past the form first. Runs once; matches the `lg` breakpoint
  // where the two-column layout takes over and scrolling is unnecessary.
  const hasAutoScrolled = useRef(false);
  useEffect(() => {
    if (hasAutoScrolled.current || !canShowResult) return;
    if (window.innerWidth >= 1024) return;
    hasAutoScrolled.current = true;
    document.getElementById('qc-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [canShowResult]);

  // Handlers
  const handleEditField = (f: keyof EditForm, v: string) =>
    setEditForm((p) => ({ ...p, [f]: v }));

  // Saves any pending edits, then accepts the quick-check into the
  // Portfolio (creates a property from the street/city/postal_code/year
  // already on the quick_check row) and returns to the overview.
  const handleTakeOver = async () => {
    if (!user || !isEditValid || !isActionable || !hasChanges) return;
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
      await acceptQuickCheck(id, user.id);
      router.push('/property-valuation/quick-check');
    } catch (err) {
      console.error('Übernehmen fehlgeschlagen', err);
    } finally {
      setIsBusy(false);
    }
  };

  // Always leaves back to the overview — that's its main job. The actual
  // DISCARD write only happens when there's something meaningful to record
  // (record still pending a decision, and the user actually changed something).
  const handleDiscard = async () => {
    if (user && isActionable && hasChanges) {
      setIsBusy(true);
      try {
        await discardQuickCheck(id, user.id);
      } catch (err) {
        console.error('Verwerfen fehlgeschlagen', err);
      } finally {
        setIsBusy(false);
      }
    }
    router.push('/property-valuation/quick-check');
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
      {/* Main page */}
      <div className="min-h-screen bg-background pb-20">
        <main className="container mx-auto px-4 py-3">
          <Header
            title="Immobilien-Ersteinschätzung"
            subtitle="Bewertung von Investitionsobjekten"
          />

          <div className="mt-3 flex flex-col gap-4">
            {!isActionable && (
              <div className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                Diese Ersteinschätzung wurde bereits abgeschlossen und kann nicht mehr übernommen werden.
              </div>
            )}

            <MobileResultBanner show={canShowResult} resultId="qc-result" formTopId="qc-form-top" />

            <div className="flex flex-col lg:flex-row gap-8 items-stretch">

              {/* Left: editable form */}
              <div className="flex flex-col gap-3 flex-1 p-5">
                <section id="qc-form-top">
                  <h2 className="text-md font-semibold text-foreground mb-2">
                    Informationen zur Berechnung
                  </h2>

                  <QuickCheckImportSection portalUrl={portalUrl} onPortalUrlChange={setPortalUrl} />

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
              <div id="qc-result" className="flex flex-col flex-1 gap-4 p-5">
                {!canShowResult ? (
                  <NoResult className="flex-1" />
                ) : (
                  <div className="flex flex-col gap-4 flex-1">
                    <KpfAssessmentCard
                      street={editForm.street}
                      postalCode={editForm.postalCode}
                      city={editForm.city}
                      purchasePrice={purchasePrice}
                      coldRent={coldRent}
                      condition={condition}
                      yearOfConstruction={editForm.yearOfConstruction}
                      kpf={kpf}
                    />
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
          ghostDisabled={isBusy}
          onGhost={handleDiscard}
          primaryLabel={BUTTON_DETAILS.TakeOver.label}
          primaryIcon={<BUTTON_DETAILS.TakeOver.icon />}
          primaryDisabled={!isEditValid || isBusy || !isActionable || !hasChanges}
          onPrimary={() => void handleTakeOver()}
        />
      </div>
    </>
  );
}
