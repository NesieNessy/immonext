"use client";

import { useEffect, useState } from 'react';

import { buildPropertyUseCaseBreadcrumb, PropertyLoadingPage, PropertyNotFoundPage } from '@/components/features/PropertyDisplay';
import { Dropdown, Header, NumberField, PillOptions, SectionLabel, StickyActionBar, TextField } from '@/components/ui';
import { ExistingPropertiesUseCases } from '@/constants/ExistingPropertiesUseCases';
import { getPropertyById } from '@/lib/supabase/property.supabase';
import { createPropertyUnit, getPropertyUnitsByProperty } from '@/lib/supabase/property_unit.supabase';
import { base64ToDataUri, deCurrencyFormatter, deNumberFormatter } from '@/lib/utils';
import { EnergyEfficient, type Property, UnitUsageType } from '@immonext/types';
import { Archive, Briefcase, Car, Check, DoorOpen, Home, MoreHorizontal, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UsageTypeOption {
    value: UnitUsageType;
    label: string;
    description: string;
    icon: React.ElementType;
}

const WOHNEINHEITEN_OPTIONS: UsageTypeOption[] = [
    { value: UnitUsageType.Wohnung, label: 'Wohnung', description: 'Eigenständige Mietwohnung – z.B. in einem Mehrfamilienhaus oder Einfamilienhaus', icon: Home },
    { value: UnitUsageType.Einliegerwohnung, label: 'Einliegerwohnung', description: 'Untergeordnete Einheit im EFH oder ZFH, baulich an die Haupteinheit gebunden', icon: DoorOpen },
];

const SONSTIGE_EINHEITEN_OPTIONS: UsageTypeOption[] = [
    { value: UnitUsageType.Stellplatz, label: 'Stellplatz / Garage', description: 'Nur Parkfläche, kein Wohnraum', icon: Car },
    { value: UnitUsageType.Gewerbeflaeche, label: 'Gewerbefläche', description: 'Büro, Laden oder gewerbliche Nutzung', icon: Briefcase },
    { value: UnitUsageType.Lager, label: 'Lager / Keller', description: 'Nicht-Wohnfläche zur Lagerung', icon: Archive },
    { value: UnitUsageType.Sonstige, label: 'Sonstige', description: 'Andere Nutzungsart', icon: MoreHorizontal },
];

const USAGE_TYPE_LABEL: Record<UnitUsageType, string> = {
    [UnitUsageType.Wohnung]: 'Wohnung',
    [UnitUsageType.Einliegerwohnung]: 'Einliegerwohnung',
    [UnitUsageType.Stellplatz]: 'Stellplatz / Garage',
    [UnitUsageType.Gewerbeflaeche]: 'Gewerbefläche',
    [UnitUsageType.Lager]: 'Lager / Keller',
    [UnitUsageType.Sonstige]: 'Sonstige',
};

const PARKING_OPTIONS = [
    { value: '0', label: 'Kein' },
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
    { value: '4', label: '4+' },
];

const ENERGY_OPTIONS = [
    { value: '', label: '–' },
    ...Object.values(EnergyEfficient).map((v) => ({ value: v, label: v })),
];

function UsageTypeCard({ option, selected, onSelect }: { option: UsageTypeOption; selected: boolean; onSelect: () => void }) {
    const Icon = option.icon;
    return (
        <button
            type="button"
            onClick={onSelect}
            className={`text-left p-4 rounded-lg border transition-colors cursor-pointer ${
                selected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'
            }`}
        >
            <Icon className={`w-5 h-5 mb-2 ${selected ? 'text-primary' : 'text-muted-foreground'}`} />
            <p className="text-sm font-semibold text-foreground">{option.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
        </button>
    );
}

export default function NewUnit({ propertyId }: { propertyId: string }) {
    const router = useRouter();
    const [property, setProperty] = useState<Property | null | undefined>(undefined);
    const [unitCount, setUnitCount] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    const [usageType, setUsageType] = useState<UnitUsageType>(UnitUsageType.Wohnung);
    const [unitLabel, setUnitLabel] = useState('');
    const [floor, setFloor] = useState('');
    const [locationNote, setLocationNote] = useState('');
    const [livingAreaM2, setLivingAreaM2] = useState('');
    const [numberOfRooms, setNumberOfRooms] = useState('');
    const [yearOfConstruction, setYearOfConstruction] = useState('');
    const [energyEfficient, setEnergyEfficient] = useState('');
    const [numberOfParkingSpaces, setNumberOfParkingSpaces] = useState('0');
    const [targetColdRent, setTargetColdRent] = useState('0');
    const [targetParkingRent, setTargetParkingRent] = useState('0');
    const [targetAncillaryCosts, setTargetAncillaryCosts] = useState('0');

    useEffect(() => {
        const id = parseInt(propertyId, 10);
        Promise.all([getPropertyById(id), getPropertyUnitsByProperty(id)]).then(([foundProperty, units]) => {
            setProperty(foundProperty);
            setUnitCount(units.length);
            if (foundProperty) {
                setYearOfConstruction(String(foundProperty.yearOfConstruction));
                setEnergyEfficient(foundProperty.energyEfficient ?? '');
            }
        });
    }, [propertyId]);

    if (property === undefined) return <PropertyLoadingPage />;
    if (property === null) return <PropertyNotFoundPage />;

    const breadcrumbItems = [
        ...buildPropertyUseCaseBreadcrumb(property, propertyId, ExistingPropertiesUseCases.TenantData).slice(0, 2),
        { label: ExistingPropertiesUseCases.TenantData, href: `/existing-properties/${propertyId}/tenant-data` },
        { label: 'Einheit hinzufügen' },
    ];

    const backHref = `/existing-properties/${propertyId}/tenant-data`;

    const isValid = unitLabel.trim() !== '' && Number(livingAreaM2) > 0;

    const parkingCount = Number(numberOfParkingSpaces);
    const soll = (Number(targetColdRent) || 0) + (Number(targetParkingRent) || 0);

    const handleSave = async () => {
        if (!isValid) return;
        setIsSaving(true);
        await createPropertyUnit({
            propertyId: parseInt(propertyId, 10),
            unitLabel: unitLabel.trim(),
            sortOrder: unitCount,
            usageType,
            floor: floor.trim() || null,
            locationNote: locationNote.trim() || null,
            livingAreaM2: livingAreaM2 !== '' ? Number(livingAreaM2) : null,
            numberOfRooms: numberOfRooms !== '' ? Number(numberOfRooms) : null,
            yearOfConstruction: yearOfConstruction !== '' ? Number(yearOfConstruction) : null,
            energyEfficient: (energyEfficient || null) as EnergyEfficient | null,
            numberOfParkingSpaces: parkingCount,
            targetColdRent: targetColdRent !== '' ? Number(targetColdRent) : null,
            targetParkingRent: targetParkingRent !== '' ? Number(targetParkingRent) : null,
            targetAncillaryCosts: targetAncillaryCosts !== '' ? Number(targetAncillaryCosts) : null,
        });
        router.push(backHref);
    };

    return (
        <div className="min-h-screen bg-background pb-24">
            <main className="container mx-auto px-4 py-8">
                <Header
                    items={breadcrumbItems}
                    image={property.imageUrl ? <img src={base64ToDataUri(property.imageUrl)!} alt="" className="w-10 h-10 object-cover rounded-lg" /> : undefined}
                />

                <div className="mt-8 mx-auto max-w-3xl space-y-6">
                    {/* Nutzungsart */}
                    <div>
                        <SectionLabel>Nutzungsart</SectionLabel>

                        <p className="mt-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Wohneinheiten</p>
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {WOHNEINHEITEN_OPTIONS.map((option) => (
                                <UsageTypeCard key={option.value} option={option} selected={usageType === option.value} onSelect={() => setUsageType(option.value)} />
                            ))}
                        </div>

                        <p className="mt-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sonstige Einheiten</p>
                        <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {SONSTIGE_EINHEITEN_OPTIONS.map((option) => (
                                <UsageTypeCard key={option.value} option={option} selected={usageType === option.value} onSelect={() => setUsageType(option.value)} />
                            ))}
                        </div>
                    </div>

                    {/* Bezeichnung */}
                    <div>
                        <SectionLabel>Bezeichnung</SectionLabel>
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <TextField
                                label="Einheitenbezeichnung *"
                                placeholder="z.B. Whg. 1, EG links"
                                value={unitLabel}
                                onChange={(e) => setUnitLabel(e.target.value)}
                            />
                            <TextField
                                label="Etage (opt.)"
                                placeholder="–"
                                value={floor}
                                onChange={(e) => setFloor(e.target.value)}
                            />
                            <TextField
                                label="Lage (opt.)"
                                placeholder="–"
                                value={locationNote}
                                onChange={(e) => setLocationNote(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Fläche & Details */}
                    <div>
                        <SectionLabel>Fläche & Details</SectionLabel>
                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <NumberField
                                label="Wohnfläche *"
                                unit="m²"
                                value={livingAreaM2}
                                onChange={(e) => setLivingAreaM2(e.target.value)}
                                min={0}
                            />
                            <NumberField
                                label="Zimmeranzahl (opt.)"
                                placeholder="–"
                                value={numberOfRooms}
                                onChange={(e) => setNumberOfRooms(e.target.value)}
                                min={0}
                            />
                            <NumberField
                                label="Baujahr (opt.)"
                                value={yearOfConstruction}
                                onChange={(e) => setYearOfConstruction(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            />
                            <Dropdown
                                label="Energieeffizienz (opt.)"
                                options={ENERGY_OPTIONS}
                                value={energyEfficient}
                                onChange={(e) => setEnergyEfficient(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Stellplätze */}
                    <div>
                        <SectionLabel>Stellplätze (opt.)</SectionLabel>
                        <div className="mt-3">
                            <PillOptions options={PARKING_OPTIONS} value={numberOfParkingSpaces} onChange={setNumberOfParkingSpaces} />
                        </div>
                    </div>

                    {/* Sollmiete */}
                    <div>
                        <SectionLabel>Sollmiete (opt. – kann später beim Mieter erfasst werden)</SectionLabel>
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <NumberField
                                label="Nettokaltmiete"
                                unit="€"
                                value={targetColdRent}
                                onChange={(e) => setTargetColdRent(e.target.value)}
                                min={0}
                            />
                            <NumberField
                                label="Stellplatzmiete"
                                unit="€"
                                value={targetParkingRent}
                                onChange={(e) => setTargetParkingRent(e.target.value)}
                                min={0}
                            />
                            <NumberField
                                label="Nebenkosten (Vorauszahlung)"
                                unit="€"
                                value={targetAncillaryCosts}
                                onChange={(e) => setTargetAncillaryCosts(e.target.value)}
                                min={0}
                            />
                        </div>
                    </div>

                    {/* Zusammenfassung */}
                    <div>
                        <SectionLabel>Zusammenfassung</SectionLabel>
                        <div className="mt-3 rounded-lg border border-border divide-y divide-border overflow-hidden">
                            {[
                                ['Bezeichnung', unitLabel.trim() || '–'],
                                ['Nutzungsart', USAGE_TYPE_LABEL[usageType]],
                                ['Fläche', livingAreaM2 !== '' ? `${deNumberFormatter.format(Number(livingAreaM2))} m²` : '–'],
                                ['Stellplätze', parkingCount === 0 ? 'Kein' : parkingCount === 4 ? '4+' : String(parkingCount)],
                                ['Sollmiete', soll > 0 ? `${deCurrencyFormatter.format(soll)} €` : '–'],
                                ['Status nach Anlage', 'Leerstand (kein Mieter)'],
                            ].map(([label, value], index) => (
                                <div key={label} className={`flex items-center justify-between px-4 py-2.5 text-sm ${index % 2 === 1 ? 'bg-muted/30' : ''}`}>
                                    <span className="text-muted-foreground">{label}</span>
                                    <span className={label === 'Nutzungsart' ? 'font-medium text-primary' : 'text-foreground'}>{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            <StickyActionBar
                show={true}
                onGhost={() => router.push(backHref)}
                onPrimary={() => void handleSave()}
                ghostLabel="Abbrechen"
                ghostIcon={<X className="w-4 h-4" />}
                primaryLabel="Einheit anlegen"
                primaryIcon={<Check className="w-4 h-4" />}
                primaryDisabled={!isValid || isSaving}
            />
        </div>
    );
}
