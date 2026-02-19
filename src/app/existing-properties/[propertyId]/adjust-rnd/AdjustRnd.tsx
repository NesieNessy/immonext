"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Calculator, Layers, Save, X, FileText } from 'lucide-react';
import { Button, Header, RadioButton, NumberField, Dropdown, StickyActionBar } from '@/components/immonext-design';
import { AppNavigation } from '../../../shared/AppNavigation';
import { ButtonLabels } from '@/constants/ButtonLabels';
import { ExistingPropertiesUseCases } from '@/constants/ExistingPropertiesUseCases';
import { RenovationAttribute, RenovationValue, RndMode, getPropertyRndDefaults } from '@/constants/RndValues';
import existingPropertiesData from '@/data/existing_properties.json';
import propertyRndData from '@/data/property_rnd.json';
import rndRenovationData from '@/data/rnd_renovation.json';
import type { Property } from '@/types/Property';
import type { RenovationFields } from '@/types/Rnd';
import { createUseCaseMenuItems } from '@/lib/useCaseMenu';

export default function AdjustRnd({ propertyId }: { propertyId: string }) {
    const router = useRouter();
    
    // State - initialize with static defaults
    const [rndMode, setRndMode] = useState<RndMode>(RndMode.STANDARD);
    const [rndYears, setRndYears] = useState<number>(getPropertyRndDefaults(RndMode.STANDARD).rnd_years);
    const [afaPercent, setAfaPercent] = useState<number>(getPropertyRndDefaults(RndMode.STANDARD).afa_percent);
    const [renovations, setRenovations] = useState<Partial<RenovationFields>>({});
    
    // Track original values for change detection
    const [originalRndMode, setOriginalRndMode] = useState<RndMode>(RndMode.STANDARD);
    const [originalRndYears, setOriginalRndYears] = useState<number>(getPropertyRndDefaults(RndMode.STANDARD).rnd_years);
    const [originalAfaPercent, setOriginalAfaPercent] = useState<number>(getPropertyRndDefaults(RndMode.STANDARD).afa_percent);
    const [originalRenovations, setOriginalRenovations] = useState<Partial<RenovationFields>>({});
    
    const [isEditing, setIsEditing] = useState(false);
    const [property, setProperty] = useState<Property | undefined>(undefined);

    // Load data on mount - client-side only
    useEffect(() => {
        // Find property data
        const foundProperty = existingPropertiesData.existing_properties.find(p => p.id === propertyId) as Property;
        setProperty(foundProperty);

        // Load property RND data
        const propertyRnd = propertyRndData.property_rnd.find(r => r.property_id === propertyId);
        const renovationData = propertyRnd?.renovation_id 
            ? rndRenovationData.rnd_renovation.find(r => r.id === propertyRnd.renovation_id)
            : null;

        if (propertyRnd) {
            const mode = propertyRnd.rnd_mode === 'Individuell' ? RndMode.INDIVIDUAL : RndMode.STANDARD;
            setRndMode(mode);
            setOriginalRndMode(mode);
            
            if (mode === RndMode.INDIVIDUAL && propertyRnd.rnd_years && propertyRnd.afa_percent) {
                setRndYears(propertyRnd.rnd_years);
                setAfaPercent(propertyRnd.afa_percent);
                setOriginalRndYears(propertyRnd.rnd_years);
                setOriginalAfaPercent(propertyRnd.afa_percent);
            } else {
                const defaults = getPropertyRndDefaults(RndMode.STANDARD);
                setRndYears(defaults.rnd_years);
                setAfaPercent(defaults.afa_percent);
                setOriginalRndYears(defaults.rnd_years);
                setOriginalAfaPercent(defaults.afa_percent);
            }

            if (renovationData) {
                const loadedRenovations = {
                    [RenovationAttribute.ROOF_RENEWAL_INCL_INSULATION]: renovationData.roof_renewal_incl_insulation as RenovationValue,
                    [RenovationAttribute.WINDOWS_AND_EXTERIOR_DOORS]: renovationData.windows_and_exterior_doors as RenovationValue,
                    [RenovationAttribute.PIPING_SYSTEMS]: renovationData.piping_systems as RenovationValue,
                    [RenovationAttribute.HEATING_SYSTEM]: renovationData.heating_system as RenovationValue,
                    [RenovationAttribute.EXTERIOR_WALL_INSULATION]: renovationData.exterior_wall_insulation as RenovationValue,
                    [RenovationAttribute.BATHROOMS]: renovationData.bathrooms as RenovationValue,
                    [RenovationAttribute.INTERIOR_WORK_EXCL_BATHROOMS]: renovationData.interior_work_excl_bathrooms as RenovationValue,
                };
                setRenovations(loadedRenovations);
                setOriginalRenovations(loadedRenovations);
            }
        }
    }, [propertyId]);

    // Check if any changes were made
    useEffect(() => {
        const hasChanges = 
            rndMode !== originalRndMode ||
            rndYears !== originalRndYears ||
            afaPercent !== originalAfaPercent ||
            JSON.stringify(renovations) !== JSON.stringify(originalRenovations);
        
        setIsEditing(hasChanges);
    }, [rndMode, rndYears, afaPercent, renovations, originalRndMode, originalRndYears, originalAfaPercent, originalRenovations]);

    const useCaseMenuItems = useMemo(() => 
        createUseCaseMenuItems(propertyId, 'RND', (route) => {
            router.push(route);
        }),
        [propertyId, router]
    );

    const renovationTimeOptions = useMemo(() => [
        { value: '', label: 'Zeitraum wählen' },
        { value: RenovationValue.ZERO_TO_FIVE, label: RenovationValue.ZERO_TO_FIVE },
        { value: RenovationValue.FIVE_TO_TEN, label: RenovationValue.FIVE_TO_TEN },
        { value: RenovationValue.TEN_TO_FIFTEEN, label: RenovationValue.TEN_TO_FIFTEEN },
        { value: RenovationValue.FIFTEEN_TO_TWENTY, label: RenovationValue.FIFTEEN_TO_TWENTY },
        { value: RenovationValue.OVER_TWENTY, label: RenovationValue.OVER_TWENTY }
    ], []);

    const handleModeChange = (mode: RndMode) => {
        setRndMode(mode);
        if (mode === RndMode.STANDARD) {
            const defaults = getPropertyRndDefaults(RndMode.STANDARD);
            setRndYears(defaults.rnd_years);
            setAfaPercent(defaults.afa_percent);
        }
    };

    const handleSave = () => {
        // TODO: Implement save functionality
        console.log('Saving RND data:', { rndMode, rndYears, afaPercent, renovations });
        
        // Update original values
        setOriginalRndMode(rndMode);
        setOriginalRndYears(rndYears);
        setOriginalAfaPercent(afaPercent);
        setOriginalRenovations(renovations);
        setIsEditing(false);
    };

    const handleCancel = () => {
        // Restore original values
        setRndMode(originalRndMode);
        setRndYears(originalRndYears);
        setAfaPercent(originalAfaPercent);
        setRenovations(originalRenovations);
        setIsEditing(false);
    };

    const handleRequestAppraisal = () => {
        // TODO: Implement request appraisal functionality
        console.log('Requesting appraisal for property:', propertyId);
    };

    if (!property) return (<div className="min-h-screen bg-background"><AppNavigation /><main className="container mx-auto px-4 py-8"><p className="text-muted-foreground">Objekt nicht gefunden</p></main></div>);

    return (
        <div className="min-h-screen bg-background pb-24">
            <AppNavigation />
            <main className="container mx-auto px-4 py-8">
                <Header 
                    title={`${property.street} ${property.house_number}`}
                    subtitle={ExistingPropertiesUseCases.RND}
                    image={property.image?.data && (
                        <img src={`data:${property.image.format};base64,${property.image.data}`} alt={`${property.street} ${property.house_number}`} className="w-16 h-16 object-cover rounded-lg" />
                    )}
                    actions={
                        <div className="flex gap-3">
                            <Button 
                                label={ButtonLabels.RequestAppraisal}
                                icon={<FileText />}
                                variant="outline"
                                onClick={handleRequestAppraisal}
                                disabled={rndMode === RndMode.STANDARD}
                            />
                            <Button 
                                label={ButtonLabels.UseCases}
                                icon={<Layers />}
                                variant="primary"
                                menuItems={useCaseMenuItems}
                            />
                        </div>
                    }
                />

                <div className="mt-8 max-w-4xl">
                    <div className="p-6 bg-card border border-border rounded-lg space-y-6">
                        <div className="flex items-start gap-3">
                            <Calculator className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                            <p className="text-muted-foreground">
                                Berechnen Sie die Restnutzungsdauer (RND) und Abschreibung für Abnutzung (AfA) Ihrer Immobilie
                            </p>
                        </div>

                        {/* Calculation Mode */}
                        <div>
                            <h3 className="text-sm font-medium text-foreground mb-3">Berechnungsmodus</h3>
                            <div className="space-y-2">
                                <RadioButton
                                    label={`${RndMode.STANDARD} (${getPropertyRndDefaults(RndMode.STANDARD).rnd_years} Jahre RND, ${getPropertyRndDefaults(RndMode.STANDARD).afa_percent}% AfA)`}
                                    checked={rndMode === RndMode.STANDARD}
                                    onChange={() => handleModeChange(RndMode.STANDARD)}
                                    name="rnd-mode"
                                />
                                <RadioButton
                                    label={RndMode.INDIVIDUAL}
                                    checked={rndMode === RndMode.INDIVIDUAL}
                                    onChange={() => handleModeChange(RndMode.INDIVIDUAL)}
                                    name="rnd-mode"
                                />
                            </div>
                        </div>

                        {/* RND and AfA Inputs - Only show in Individual mode */}
                        {rndMode === RndMode.INDIVIDUAL && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <NumberField
                                    label="Restnutzungsdauer (RND)"
                                    unit="Jahre"
                                    value={rndYears}
                                    onChange={(e) => setRndYears(Number(e.target.value))}
                                    min={1}
                                    max={100}
                                />
                                <NumberField
                                    label="Abschreibung für Abnutzung (AfA)"
                                    unit="%"
                                    value={afaPercent}
                                    onChange={(e) => setAfaPercent(Number(e.target.value))}
                                    min={0}
                                    max={100}
                                    step={0.1}
                                />
                            </div>
                        )}

                        {/* Renovation Section */}
                        {rndMode === RndMode.INDIVIDUAL && (
                            <div className="pt-4 border-t border-border">
                                <h3 className="text-sm font-medium text-foreground mb-3">Modernisierung</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Geben Sie das Alter der letzten Modernisierungsmaßnahmen an
                                </p>
                                
                                <div className="space-y-4">
                                    {Object.values(RenovationAttribute).map((attribute) => (
                                        <div key={attribute} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                            <div className="text-sm text-foreground">
                                                {attribute}
                                            </div>
                                            <Dropdown
                                                options={renovationTimeOptions}
                                                value={renovations[attribute] || ''}
                                                onChange={(e) => setRenovations({
                                                    ...renovations,
                                                    [attribute]: e.target.value as RenovationValue
                                                })}
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
                show={isEditing}
                onGhost={handleCancel}
                onPrimary={handleSave}
                ghostLabel={ButtonLabels.Cancel}
                primaryLabel={ButtonLabels.Save}
                ghostIcon={<X />}
                primaryIcon={<Save />}
            />
        </div>
    );
}
