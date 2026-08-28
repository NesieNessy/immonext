"use client";

import { PROPERTY_CATEGORY_CREATE_OPTIONS, PropertyNotFoundPage } from '@/components/features/PropertyDisplay';
import { Button, CalendarField, Dropdown, Header, Icons, NumberField, PAGE_CONTAINER_CLASS, PillOptions, SectionLabel, StickyActionBar, TextField, UnsavedChangesModal, UploadButton, useToast } from '@/components/ui';
import { BUTTON_DETAILS } from '@/constants/ButtonLabels';
import { ExistingPropertiesUseCases } from '@/constants/ExistingPropertiesUseCases';
import { getLabel } from '@/constants/FieldLabels';
import { createAcquisitionCosts, getAcquisitionCosts, updateAcquisitionCosts } from '@/lib/supabase/acquisition_costs.supabase';
import { createParkingSpace, deleteParkingSpace, getParkingSpacesByProperty, updateParkingSpace } from '@/lib/supabase/parking_space.supabase';
import { getPropertyById, updateProperty } from '@/lib/supabase/property.supabase';
import { getPropertyAcquisitionByProperty, upsertPropertyAcquisition } from '@/lib/supabase/property_acquisition.supabase';
import { createUseCaseMenuItems } from '@/lib/propertyUseCaseMenu';
import { base64ToDataUri } from '@/lib/utils';
import { EnergyEfficient, type AcquisitionCosts, type ParkingSpace, type Property } from '@immonext/types';
import { format, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

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

interface FormState {
    objektkategorie: string;
    kaufdatum: string;
    kaufpreis: string;
    strasseHausnummer: string;
    plz: string;
    ort: string;
    bundesland: string;
    baujahr: string;
    wohnflaeche: string;
    anzahlZimmer: string;
    stellplaetze: string;
    energieeffizienz: string;
    bildBase64: string | null;
}

const EMPTY_FORM: FormState = {
    objektkategorie: '',
    kaufdatum: '',
    kaufpreis: '',
    strasseHausnummer: '',
    plz: '',
    ort: '',
    bundesland: '',
    baujahr: '',
    wohnflaeche: '',
    anzahlZimmer: '',
    stellplaetze: '0',
    energieeffizienz: '',
    bildBase64: null,
};

export default function PropertyData({ propertyId }: { propertyId: string }) {
    const router = useRouter();
    const { showToast } = useToast();

    const [property, setProperty] = useState<Property | null>(null);
    const [parkingSpace, setParkingSpace] = useState<ParkingSpace | null>(null);
    const [acquisitionCosts, setAcquisitionCosts] = useState<AcquisitionCosts | null>(null);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [original, setOriginal] = useState<FormState>(EMPTY_FORM);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pendingHref, setPendingHref] = useState<string | null>(null);

    useEffect(() => {
        const id = parseInt(propertyId, 10);
        let cancelled = false;

        Promise.all([
            getPropertyById(id),
            getPropertyAcquisitionByProperty(id),
            getParkingSpacesByProperty(id),
            getAcquisitionCosts(id),
        ]).then(([foundProperty, acquisition, spaces, acquisitionCostsRows]) => {
            if (cancelled || !foundProperty) return;
            const existingParking = spaces[0] ?? null;
            const existingAcquisitionCosts = acquisitionCostsRows[0] ?? null;

            const initial: FormState = {
                objektkategorie: foundProperty.propertyCategory ?? '',
                kaufdatum: acquisition?.purchaseDate ?? '',
                kaufpreis: existingAcquisitionCosts ? String(existingAcquisitionCosts.propertyPurchasePrice) : '',
                strasseHausnummer: `${foundProperty.street} ${foundProperty.houseNumber}`.trim(),
                plz: foundProperty.postalCode,
                ort: foundProperty.city,
                bundesland: foundProperty.federalState,
                baujahr: String(foundProperty.yearOfConstruction),
                wohnflaeche: String(foundProperty.squareMeters),
                anzahlZimmer: foundProperty.numberOfRooms != null ? String(foundProperty.numberOfRooms) : '',
                stellplaetze: existingParking?.numberOfParkingSpaces ? String(existingParking.numberOfParkingSpaces) : '0',
                energieeffizienz: foundProperty.energyEfficient ?? '',
                bildBase64: foundProperty.imageUrl,
            };

            setProperty(foundProperty);
            setParkingSpace(existingParking);
            setAcquisitionCosts(existingAcquisitionCosts);
            setForm(initial);
            setOriginal(initial);
        });

        return () => { cancelled = true; };
    }, [propertyId]);

    const isEditing = JSON.stringify(form) !== JSON.stringify(original);

    // Any navigation away from an unsaved edit is routed through here so it
    // can be confirmed first (breadcrumb links, the cancel button, use-case menu).
    const goTo = (href: string) => {
        if (isEditing) {
            setPendingHref(href);
        } else {
            router.push(href);
        }
    };

    const confirmDiscard = () => {
        if (pendingHref) router.push(pendingHref);
        setPendingHref(null);
    };

    const update = (patch: Partial<FormState>) => setForm((prev) => ({ ...prev, ...patch }));

    const handleImageSelect = async (files: FileList | null) => {
        const file = files?.[0];
        if (!file) return;
        update({ bildBase64: await readFileAsRawBase64(file) });
    };

    const currentYear = new Date().getFullYear();
    const isValid =
        form.objektkategorie !== '' &&
        form.strasseHausnummer.trim() !== '' &&
        /^\d{5}$/.test(form.plz) &&
        form.ort.trim() !== '' &&
        /^\d{4}$/.test(form.baujahr) && Number(form.baujahr) >= 1800 && Number(form.baujahr) <= currentYear &&
        Number(form.wohnflaeche) > 0 &&
        form.stellplaetze !== '' && Number(form.stellplaetze) >= 0 &&
        form.kaufpreis !== '' && Number(form.kaufpreis) > 0;

    const handleCancel = () => {
        goTo(`/existing-properties/${propertyId}`);
    };

    const handleSave = async () => {
        if (!property || !isValid) return;
        setIsSaving(true);
        setError(null);
        try {
            const updated = await updateProperty(property.propertyId, {
                street: form.strasseHausnummer.trim(),
                houseNumber: '',
                city: form.ort.trim(),
                postalCode: form.plz,
                federalState: form.bundesland.trim(),
                squareMeters: Number(form.wohnflaeche),
                numberOfRooms: form.anzahlZimmer !== '' ? Number(form.anzahlZimmer) : null,
                yearOfConstruction: Number(form.baujahr),
                energyEfficient: (form.energieeffizienz || null) as EnergyEfficient | null,
                propertyCategory: form.objektkategorie,
                imageUrl: form.bildBase64,
            });
            if (!updated) {
                setError('Objekt konnte nicht gespeichert werden.');
                return;
            }

            if (form.kaufdatum) {
                await upsertPropertyAcquisition({
                    propertyId: property.propertyId,
                    houseCompletionYear: null,
                    purchaseDate: form.kaufdatum,
                    transferDate: null,
                });
            }

            if (form.kaufpreis !== '' && Number(form.kaufpreis) > 0) {
                if (acquisitionCosts) {
                    await updateAcquisitionCosts(acquisitionCosts.acquisitionCostsId, {
                        propertyPurchasePrice: Number(form.kaufpreis),
                    });
                } else {
                    const createdAcquisitionCosts = await createAcquisitionCosts({
                        propertyId: property.propertyId,
                        parkingSpaceId: null,
                        propertyPurchasePrice: Number(form.kaufpreis),
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
                    setAcquisitionCosts(createdAcquisitionCosts);
                }
            }

            const parkingCount = Number(form.stellplaetze) || 0;
            if (parkingCount > 0) {
                if (parkingSpace) {
                    await updateParkingSpace(parkingSpace.parkingSpaceId, { numberOfParkingSpaces: parkingCount });
                } else {
                    const createdParking = await createParkingSpace({
                        propertyId: property.propertyId,
                        parkingSpaceType: 'OTHER',
                        numberOfParkingSpaces: parkingCount,
                    });
                    setParkingSpace(createdParking);
                }
            } else if (parkingSpace) {
                await deleteParkingSpace(parkingSpace.parkingSpaceId);
                setParkingSpace(null);
            }

            setProperty(updated);
            setOriginal(form);
            showToast('Objektdaten gespeichert.');
            router.push(`/existing-properties/${propertyId}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
        } finally {
            setIsSaving(false);
        }
    };

    // Create menu items for all use cases
    const useCaseMenuItems = useMemo(() =>
        createUseCaseMenuItems(propertyId, 'PropertyData', (route) => {
            goTo(route);
        }),
        [propertyId, isEditing] // eslint-disable-line react-hooks/exhaustive-deps
    );

    if (!property) return <PropertyNotFoundPage />;

    return (
        <div className="min-h-screen bg-background pb-24">
            <main className={PAGE_CONTAINER_CLASS}>
                <Header
                    items={[
                        {
                            label: 'Bestandsobjekte',
                            href: '/existing-properties',
                            onClick: (e) => { if (isEditing) { e.preventDefault(); goTo('/existing-properties'); } },
                        },
                        {
                            label: `${property.street} ${property.houseNumber}, ${property.postalCode} ${property.city}`,
                            href: `/existing-properties/${propertyId}`,
                            onClick: (e) => { if (isEditing) { e.preventDefault(); goTo(`/existing-properties/${propertyId}`); } },
                        },
                        { label: ExistingPropertiesUseCases.PropertyData },
                    ]}
                    image={form.bildBase64 ? <img src={base64ToDataUri(form.bildBase64)!} alt={`${property.street} ${property.houseNumber}`} className="w-10 h-10 object-cover rounded-lg" /> : undefined}
                    actions={
                        <Button
                            label={BUTTON_DETAILS.UseCases.label}
                            icon={<BUTTON_DETAILS.UseCases.icon />}
                            variant="outline"
                            hideLabelOnMobile
                            menuItems={useCaseMenuItems}
                        />
                    }
                />

                <div className="flex flex-col gap-6">
                    {error && (
                        <div className="px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                        <SectionLabel>Objektbild (opt.)</SectionLabel>
                        <div className="flex items-center gap-4">
                            {form.bildBase64 && (
                                <div className="relative shrink-0">
                                    <img
                                        src={base64ToDataUri(form.bildBase64)!}
                                        alt=""
                                        className="w-20 h-20 object-cover rounded-lg border border-border"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => update({ bildBase64: null })}
                                        aria-label="Bild entfernen"
                                        className="absolute -top-2 -right-2 p-1 rounded-full bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                    >
                                        <Icons.X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                            <UploadButton
                                buttonText={form.bildBase64 ? 'Anderes Bild wählen' : 'Bild hochladen'}
                                accept="image/*"
                                onFileSelect={(files) => void handleImageSelect(files)}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <SectionLabel>Objektkategorie</SectionLabel>
                        <PillOptions
                            options={PROPERTY_CATEGORY_CREATE_OPTIONS}
                            value={form.objektkategorie}
                            onChange={(objektkategorie) => update({ objektkategorie })}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <SectionLabel>Kaufinformationen</SectionLabel>
                        <div className="grid grid-cols-2 gap-3 max-w-md">
                            <NumberField
                                label="Kaufpreis *"
                                placeholder="450.000"
                                unit="€"
                                value={form.kaufpreis}
                                onChange={(e) => update({ kaufpreis: e.target.value })}
                                min={0}
                            />
                            <CalendarField
                                label="Kaufdatum (opt.)"
                                value={form.kaufdatum ? parseISO(form.kaufdatum) : undefined}
                                onChange={(date) => update({ kaufdatum: date ? format(date, 'yyyy-MM-dd') : '' })}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <SectionLabel>Adresse</SectionLabel>
                        <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr] gap-3">
                            <TextField
                                label="Straße & Hausnummer"
                                placeholder="Beispielstraße 123"
                                value={form.strasseHausnummer}
                                onChange={(e) => update({ strasseHausnummer: e.target.value })}
                            />
                            <TextField
                                label="PLZ"
                                placeholder="80801"
                                value={form.plz}
                                onChange={(e) => update({ plz: e.target.value.replace(/\D/g, '').slice(0, 5) })}
                            />
                            <TextField
                                label="Ort"
                                placeholder="München"
                                value={form.ort}
                                onChange={(e) => update({ ort: e.target.value })}
                            />
                            <TextField
                                label="Bundesland (opt.)"
                                placeholder="Bayern"
                                value={form.bundesland}
                                onChange={(e) => update({ bundesland: e.target.value })}
                                className="sm:col-span-2"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <SectionLabel>Objektdetails</SectionLabel>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <NumberField
                                label={getLabel('Property', 'YearOfConstruction', 'de')}
                                placeholder="1980"
                                value={form.baujahr}
                                onChange={(e) => update({ baujahr: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                            />
                            <NumberField
                                label="Wohnfläche"
                                placeholder="100"
                                unit="m²"
                                value={form.wohnflaeche}
                                onChange={(e) => update({ wohnflaeche: e.target.value })}
                                min={0}
                            />
                            <NumberField
                                label="Anzahl Zimmer (opt.)"
                                placeholder="3"
                                value={form.anzahlZimmer}
                                onChange={(e) => update({ anzahlZimmer: e.target.value })}
                                min={0}
                            />
                            <NumberField
                                label="Stellplätze"
                                placeholder="0"
                                value={form.stellplaetze}
                                onChange={(e) => update({ stellplaetze: e.target.value })}
                                min={0}
                            />
                            <Dropdown
                                label="Energieeffizienz (opt.)"
                                options={ENERGY_OPTIONS}
                                value={form.energieeffizienz}
                                onChange={(e) => update({ energieeffizienz: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            </main>

            {/* Sticky Action Bar */}
            <StickyActionBar
                show={true}
                onGhost={handleCancel}
                onPrimary={() => void handleSave()}
                ghostLabel={BUTTON_DETAILS.Back.label}
                primaryLabel="Objektdaten speichern"
                ghostIcon={<BUTTON_DETAILS.Back.icon />}
                primaryIcon={<BUTTON_DETAILS.Save.icon />}
                primaryDisabled={!isEditing || !isValid || isSaving}
            />

            <UnsavedChangesModal
                open={pendingHref !== null}
                onCancel={() => setPendingHref(null)}
                onDiscard={confirmDiscard}
                context="an den Objektdaten"
            />
        </div>
    );
}
