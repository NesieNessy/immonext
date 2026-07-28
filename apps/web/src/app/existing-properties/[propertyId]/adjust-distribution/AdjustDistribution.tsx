"use client";

import { Button, Header, NumberField, StickyActionBar } from '@/components/ui';
import { BUTTON_DETAILS } from '@/constants/ButtonLabels';
import { ExistingPropertiesUseCases } from '@/constants/ExistingPropertiesUseCases';
import { computePriceSplitIndividual, computePriceSplitStandard } from '@/lib/detailCheck/depreciation';
import { getCityPurchasePriceSplit } from '@/lib/supabase/city_purchase_price_split.supabase';
import { getPropertyOverviewById, type PropertyOverview } from '@/lib/supabase/property.supabase';
import { createUseCaseMenuItems } from '@/lib/useCaseMenu';
import { base64ToDataUri, cn } from '@/lib/utils';
import { Info, PieChart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type SplitMode = 'STANDARD' | 'INDIVIDUAL';

const numberFormatter = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const currencyFormatter = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pb-2 border-b border-border">
            {children}
        </h3>
    );
}

export default function AdjustDistribution({ propertyId }: { propertyId: string }) {
    const router = useRouter();

    const [property, setProperty] = useState<PropertyOverview | undefined>(undefined);
    const [cityShare, setCityShare] = useState({ buildingSharePercent: 65, landSharePercent: 35 });

    const [splitMode, setSplitMode] = useState<SplitMode>('STANDARD');
    const [plotAreaM2, setPlotAreaM2] = useState('');
    const [landReferenceValue, setLandReferenceValue] = useState('');
    const [coOwnershipNumerator, setCoOwnershipNumerator] = useState('');
    const [coOwnershipDenominator, setCoOwnershipDenominator] = useState('');

    const [originalSplitMode, setOriginalSplitMode] = useState<SplitMode>('STANDARD');
    const [originalPlotAreaM2, setOriginalPlotAreaM2] = useState('');
    const [originalLandReferenceValue, setOriginalLandReferenceValue] = useState('');
    const [originalCoOwnershipNumerator, setOriginalCoOwnershipNumerator] = useState('');
    const [originalCoOwnershipDenominator, setOriginalCoOwnershipDenominator] = useState('');

    useEffect(() => {
        getPropertyOverviewById(parseInt(propertyId, 10)).then((p) => setProperty(p ?? undefined));
    }, [propertyId]);

    useEffect(() => {
        if (!property) return;
        getCityPurchasePriceSplit(property.city).then(setCityShare);
    }, [property]);

    const isEditing =
        splitMode !== originalSplitMode ||
        plotAreaM2 !== originalPlotAreaM2 ||
        landReferenceValue !== originalLandReferenceValue ||
        coOwnershipNumerator !== originalCoOwnershipNumerator ||
        coOwnershipDenominator !== originalCoOwnershipDenominator;

    const purchasePrice = property?.purchasePrice ?? 0;

    const standardSplit = useMemo(
        () => computePriceSplitStandard(purchasePrice, cityShare.buildingSharePercent),
        [purchasePrice, cityShare]
    );

    const individualSplit = useMemo(
        () => computePriceSplitIndividual({
            purchasePrice,
            landReferenceValue: Number(landReferenceValue) || 0,
            plotAreaM2: Number(plotAreaM2) || 0,
            coOwnershipNumerator: Number(coOwnershipNumerator) || 0,
            coOwnershipDenominator: Number(coOwnershipDenominator) || 0,
        }),
        [purchasePrice, landReferenceValue, plotAreaM2, coOwnershipNumerator, coOwnershipDenominator]
    );

    const selectedSplit = splitMode === 'STANDARD' ? standardSplit : individualSplit;

    const useCaseMenuItems = useMemo(() =>
        createUseCaseMenuItems(propertyId, 'SplitPurchasePrice', (route) => {
            router.push(route);
        }),
        [propertyId, router]
    );

    const handleSave = () => {
        // TODO: Implement save functionality
        console.log('Saving purchase price split data:', {
            splitMode, plotAreaM2, landReferenceValue, coOwnershipNumerator, coOwnershipDenominator, selectedSplit,
        });

        setOriginalSplitMode(splitMode);
        setOriginalPlotAreaM2(plotAreaM2);
        setOriginalLandReferenceValue(landReferenceValue);
        setOriginalCoOwnershipNumerator(coOwnershipNumerator);
        setOriginalCoOwnershipDenominator(coOwnershipDenominator);
    };

    const handleCancel = () => {
        setSplitMode(originalSplitMode);
        setPlotAreaM2(originalPlotAreaM2);
        setLandReferenceValue(originalLandReferenceValue);
        setCoOwnershipNumerator(originalCoOwnershipNumerator);
        setCoOwnershipDenominator(originalCoOwnershipDenominator);
    };

    if (!property) {
        return (
            <div className="min-h-screen bg-background">
                <main className="container mx-auto px-4 py-8">
                    <p className="text-muted-foreground">Objekt nicht gefunden</p>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-24">
            <main className="container mx-auto px-4 py-8">
                <Header
                    items={[
                        { label: 'Bestandsobjekte', href: '/existing-properties' },
                        { label: `${property.street} ${property.houseNumber}`, href: `/existing-properties/${propertyId}` },
                        { label: ExistingPropertiesUseCases.SplitPurchasePrice },
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

                <div className="mt-8 mx-auto max-w-4xl space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <PieChart className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-lg font-semibold text-foreground">Kaufpreisaufteilung</h2>
                            <p className="text-sm text-muted-foreground truncate">
                                {property.street} {property.houseNumber}, {property.postalCode} {property.city} · Kaufpreis: {currencyFormatter.format(purchasePrice)} €
                            </p>
                        </div>
                    </div>

                    {/* Calculation Mode */}
                    <div>
                        <SectionLabel>Berechnungsmodus</SectionLabel>
                        <div className="flex flex-wrap gap-2 pt-3">
                            <button
                                type="button"
                                onClick={() => setSplitMode('STANDARD')}
                                className={cn(
                                    "px-4 py-2 rounded-full text-sm font-medium border transition-colors cursor-pointer",
                                    splitMode === 'STANDARD'
                                        ? "bg-primary/10 border-primary text-primary"
                                        : "border-border text-foreground hover:bg-muted"
                                )}
                            >
                                {`Standard (${numberFormatter.format(standardSplit.buildingSharePercent)} / ${numberFormatter.format(standardSplit.landSharePercent)})`}
                            </button>
                            <button
                                type="button"
                                onClick={() => setSplitMode('INDIVIDUAL')}
                                className={cn(
                                    "px-4 py-2 rounded-full text-sm font-medium border transition-colors cursor-pointer",
                                    splitMode === 'INDIVIDUAL'
                                        ? "bg-primary/10 border-primary text-primary"
                                        : "border-border text-foreground hover:bg-muted"
                                )}
                            >
                                Individuell berechnen
                            </button>
                        </div>
                    </div>

                    {/* Plot data — only relevant for individual calculation */}
                    {splitMode === 'INDIVIDUAL' && (
                        <div>
                            <SectionLabel>Grundstücksdaten</SectionLabel>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                                <NumberField
                                    label="Grundstücksgröße"
                                    placeholder="7.500"
                                    unit="m²"
                                    value={plotAreaM2}
                                    onChange={(e) => setPlotAreaM2(e.target.value)}
                                    min={0}
                                />
                                <NumberField
                                    label="Bodenrichtwert"
                                    placeholder="5.000"
                                    unit="€/m²"
                                    value={landReferenceValue}
                                    onChange={(e) => setLandReferenceValue(e.target.value)}
                                    min={0}
                                />
                                <NumberField
                                    label="MEA Zähler"
                                    placeholder="100"
                                    value={coOwnershipNumerator}
                                    onChange={(e) => setCoOwnershipNumerator(e.target.value)}
                                    min={0}
                                />
                                <NumberField
                                    label="MEA Nenner"
                                    placeholder="10.000"
                                    value={coOwnershipDenominator}
                                    onChange={(e) => setCoOwnershipDenominator(e.target.value)}
                                    min={0}
                                />
                            </div>
                            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Info className="w-3.5 h-3.5 shrink-0 text-primary" />
                                Tragen Sie die Grundstücksdaten ein um die Aufteilung zu berechnen.
                            </p>
                        </div>
                    )}

                    {/* Result */}
                    <div>
                        <SectionLabel>Berechnete Aufteilung</SectionLabel>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
                            <div className="p-4 rounded-lg border border-border bg-card">
                                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Gebäude</p>
                                <div className="flex items-baseline justify-between gap-2">
                                    <p className="text-2xl font-semibold text-foreground">
                                        {numberFormatter.format(selectedSplit.buildingSharePercent)}
                                        <span className="text-sm font-normal text-muted-foreground ml-0.5">%</span>
                                    </p>
                                    <p className="text-sm text-muted-foreground">{currencyFormatter.format(selectedSplit.buildingValue)} €</p>
                                </div>
                            </div>
                            <div className="p-4 rounded-lg border border-border bg-card">
                                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Grund und Boden</p>
                                <div className="flex items-baseline justify-between gap-2">
                                    <p className="text-2xl font-semibold text-foreground">
                                        {numberFormatter.format(selectedSplit.landSharePercent)}
                                        <span className="text-sm font-normal text-muted-foreground ml-0.5">%</span>
                                    </p>
                                    <p className="text-sm text-muted-foreground">{currencyFormatter.format(selectedSplit.landValue)} €</p>
                                </div>
                            </div>
                        </div>
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
