"use client";

import { Button, Dropdown, Header, StickyActionBar } from '@/components/ui';
import { BUTTON_DETAILS } from '@/constants/ButtonLabels';
import { ExistingPropertiesUseCases } from '@/constants/ExistingPropertiesUseCases';
import {
    computeRemainingUsefulLife,
    MODERNIZATION_FIELDS,
    MODERNIZATION_OPTIONS,
    type ModernizationSelections,
} from '@/lib/detailCheck/depreciation';
import { getPropertyById } from '@/lib/supabase/property.supabase';
import { createUseCaseMenuItems } from '@/lib/useCaseMenu';
import { base64ToDataUri, cn } from '@/lib/utils';
import type { Property } from '@immonext/types';
import { Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type RndMode = 'STANDARD' | 'INDIVIDUAL';

const numberFormatter = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const EMPTY_MODERNIZATION: ModernizationSelections = {
    modernizationRoof: '',
    modernizationWindows: '',
    modernizationLines: '',
    modernizationHeating: '',
    modernizationFacade: '',
    modernizationBathrooms: '',
    modernizationInterior: '',
};

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pb-2 border-b border-border">
            {children}
        </h3>
    );
}

export default function AdjustRnd({ propertyId }: { propertyId: string }) {
    const router = useRouter();

    const [rndMode, setRndMode] = useState<RndMode>('STANDARD');
    const [modernization, setModernization] = useState<ModernizationSelections>(EMPTY_MODERNIZATION);

    const [originalRndMode, setOriginalRndMode] = useState<RndMode>('STANDARD');
    const [originalModernization, setOriginalModernization] = useState<ModernizationSelections>(EMPTY_MODERNIZATION);

    const [isEditing, setIsEditing] = useState(false);
    const [property, setProperty] = useState<Property | undefined>(undefined);

    useEffect(() => {
        getPropertyById(parseInt(propertyId, 10)).then(p => setProperty(p ?? undefined));
    }, [propertyId]);

    useEffect(() => {
        const hasChanges =
            rndMode !== originalRndMode ||
            JSON.stringify(modernization) !== JSON.stringify(originalModernization);

        setIsEditing(hasChanges);
    }, [rndMode, modernization, originalRndMode, originalModernization]);

    const useCaseMenuItems = useMemo(() =>
        createUseCaseMenuItems(propertyId, 'RND', (route) => {
            router.push(route);
        }),
        [propertyId, router]
    );

    const individualRnd = useMemo(() => {
        if (!property) return null;
        return computeRemainingUsefulLife({
            category: property.propertyCategory,
            yearOfConstruction: property.yearOfConstruction,
            selections: modernization,
        });
    }, [property, modernization]);

    const selectedRnd = rndMode === 'STANDARD'
        ? { remainingUsefulLifeYears: 50, afaPercent: 2 }
        : individualRnd;

    const handleSave = () => {
        // Standard mode ignores modernization entirely, so don't carry stale
        // individual selections forward once it's saved.
        const savedModernization = rndMode === 'STANDARD' ? EMPTY_MODERNIZATION : modernization;

        // TODO: Implement save functionality
        console.log('Saving RND data:', { rndMode, modernization: savedModernization, selectedRnd });

        setModernization(savedModernization);
        setOriginalRndMode(rndMode);
        setOriginalModernization(savedModernization);
        setIsEditing(false);
    };

    const handleCancel = () => {
        router.push(`/existing-properties/${propertyId}`);
    };

    if (!property) return (<div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8"><p className="text-muted-foreground">Objekt nicht gefunden</p></main></div>);

    return (
        <div className="min-h-screen bg-background pb-24">
            <main className="container mx-auto px-4 py-8">
                <Header
                    items={[
                        { label: 'Bestandsobjekte', href: '/existing-properties' },
                        { label: `${property.street} ${property.houseNumber}` },
                        { label: ExistingPropertiesUseCases.RND },
                    ]}
                    image={property.imageUrl ? <img src={base64ToDataUri(property.imageUrl)!} alt={`${property.street} ${property.houseNumber}`} className="w-10 h-10 object-cover rounded-lg" /> : undefined}
                    actions={
                        <Button
                            label={BUTTON_DETAILS.UseCases.label}
                            icon={<BUTTON_DETAILS.UseCases.icon />}
                            variant="primary"
                            hideLabelOnMobile
                            menuItems={useCaseMenuItems}
                        />
                    }
                />

                <div className="mt-8 mx-auto max-w-4xl">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <Clock className="w-5 h-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-lg font-semibold text-foreground">Restnutzungsdauer (RND)</h2>
                                <p className="text-sm text-muted-foreground truncate">
                                    {property.street} {property.houseNumber}, {property.postalCode} {property.city}
                                </p>
                            </div>
                        </div>

                        {/* Calculation Mode */}
                        <div>
                            <SectionLabel>Berechnungsmodus</SectionLabel>
                            <div className="flex flex-wrap gap-2 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setRndMode('STANDARD')}
                                    className={cn(
                                        "px-4 py-2 rounded-full text-sm font-medium border transition-colors cursor-pointer",
                                        rndMode === 'STANDARD'
                                            ? "bg-primary/10 border-primary text-primary"
                                            : "border-border text-foreground hover:bg-muted"
                                    )}
                                >
                                    Standard (50 Jahre)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRndMode('INDIVIDUAL')}
                                    className={cn(
                                        "px-4 py-2 rounded-full text-sm font-medium border transition-colors cursor-pointer",
                                        rndMode === 'INDIVIDUAL'
                                            ? "bg-primary/10 border-primary text-primary"
                                            : "border-border text-foreground hover:bg-muted"
                                    )}
                                >
                                    Individuell prüfen
                                </button>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg border border-border bg-muted/30">
                            <div className="flex gap-8 shrink-0">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide">RND</p>
                                    <p className="text-lg font-semibold text-foreground">
                                        {selectedRnd ? `${numberFormatter.format(selectedRnd.remainingUsefulLifeYears)} Jahre` : '– Jahre'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide">AfA</p>
                                    <p className="text-lg font-semibold text-foreground">
                                        {selectedRnd ? `${numberFormatter.format(selectedRnd.afaPercent)}%` : '– %'}
                                    </p>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground sm:text-right sm:ml-auto">
                                {rndMode === 'STANDARD'
                                    ? 'Standardwert gemäß gesetzlicher Regelung. Baujahr und Modernisierungen werden nicht berücksichtigt.'
                                    : 'Individuell ermittelt anhand von Baujahr, Objektkategorie und Modernisierungen.'}
                            </p>
                        </div>

                        {/* Renovation Section */}
                        {rndMode === 'INDIVIDUAL' && (
                            <div className="pt-4 border-t border-border">
                                <div className="flex items-center justify-between gap-3 mb-3">
                                    <SectionLabel>Letzte Modernisierung</SectionLabel>
                                    <span title="Coming soon">
                                        <Button
                                            label={BUTTON_DETAILS.RequestAppraisal.label}
                                            icon={<BUTTON_DETAILS.RequestAppraisal.icon />}
                                            variant="outline"
                                            size="sm"
                                            hideLabelOnMobile
                                            disabled
                                        />
                                    </span>
                                </div>

                                <div className="border border-border rounded-lg overflow-hidden">
                                    <div className="grid grid-cols-2 gap-4 px-4 py-2 bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                        <span>Maßnahme</span>
                                        <span>Zuletzt erneuert</span>
                                    </div>
                                    {MODERNIZATION_FIELDS.map(([field, label], index) => (
                                        <div
                                            key={field}
                                            className={cn(
                                                "grid grid-cols-2 items-center gap-4 px-4 py-3",
                                                index > 0 && "border-t border-border"
                                            )}
                                        >
                                            <span className="text-sm text-foreground">{label}</span>
                                            <Dropdown
                                                options={MODERNIZATION_OPTIONS}
                                                value={modernization[field]}
                                                onChange={(e) => setModernization((prev) => ({ ...prev, [field]: e.target.value }))}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Sticky Action Bar */}
            <StickyActionBar
                show={true}
                onGhost={handleCancel}
                onPrimary={handleSave}
                ghostLabel={BUTTON_DETAILS.Cancel.label}
                primaryLabel={BUTTON_DETAILS.Save.label}
                ghostIcon={<BUTTON_DETAILS.Cancel.icon />}
                primaryIcon={<BUTTON_DETAILS.Save.icon />}
                primaryDisabled={!isEditing}
            />
        </div>
    );
}
