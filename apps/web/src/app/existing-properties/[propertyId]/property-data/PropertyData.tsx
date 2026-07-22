"use client";

import { Button, Header, NumberField, StickyActionBar, TextField, Tile } from '@/components/ui';
import { BUTTON_DETAILS } from '@/constants/ButtonLabels';
import { ExistingPropertiesUseCases } from '@/constants/ExistingPropertiesUseCases';
import { getPropertyById, updateProperty } from '@/lib/supabase/property.supabase';
import { createUseCaseMenuItems } from '@/lib/useCaseMenu';
import { base64ToDataUri } from '@/lib/utils';
import type { Property } from '@immonext/types';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PropertyData({ propertyId }: { propertyId: string }) {
    const router = useRouter();

    const [property, setProperty] = useState<Property | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Property | null>(null);

    useEffect(() => {
        getPropertyById(parseInt(propertyId, 10)).then((found) => {
            if (found) {
                setProperty(found);
                setFormData(found);
            }
        });
    }, [propertyId]);

    const handleInputChange = (field: keyof Property, value: string | number) => {
        if (!formData) return;
        setFormData({ ...formData, [field]: value });
        if (!isEditing) setIsEditing(true);
    };

    const handleCancel = () => {
        setFormData(property);
        setIsEditing(false);
    };

    const handleSave = async () => {
        if (!formData || !property) return;
        const updated = await updateProperty(property.propertyId, {
            street:               formData.street,
            houseNumber:          formData.houseNumber,
            city:                 formData.city,
            postalCode:           formData.postalCode,
            federalState:         formData.federalState,
            squareMeters:         formData.squareMeters,
            numberOfRooms:        formData.numberOfRooms,
            yearOfConstruction:   formData.yearOfConstruction,
            energyEfficient:      formData.energyEfficient,
       });
        if (updated) {
            setProperty(updated);
            setFormData(updated);
        }
        setIsEditing(false);
    };

    // Create menu items for all use cases
    const useCaseMenuItems = createUseCaseMenuItems(propertyId, 'PropertyData', (route) => {
        router.push(route);
    });

    if (!property || !formData) {
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
                        { label: `${property.street} ${property.houseNumber}` },
                        { label: ExistingPropertiesUseCases.PropertyData },
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

                <div className="mt-8 mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl">
                    {/* Address Information */}
                    <Tile title="Adresse">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                            <TextField
                                label="Straße"
                                value={formData.street}
                                onChange={(e) => handleInputChange('street', e.target.value)}
                                className="sm:col-span-2"
                            />
                            <TextField
                                label="Hausnummer"
                                value={formData.houseNumber}
                                onChange={(e) => handleInputChange('houseNumber', e.target.value)}
                            />
                            <TextField
                                label="Postleitzahl"
                                value={formData.postalCode}
                                onChange={(e) => handleInputChange('postalCode', e.target.value)}
                            />
                            <TextField
                                label="Stadt"
                                value={formData.city}
                                onChange={(e) => handleInputChange('city', e.target.value)}
                                className="sm:col-span-2"
                            />
                            <TextField
                                label="Bundesland"
                                value={formData.federalState}
                                onChange={(e) => handleInputChange('federalState', e.target.value)}
                                className="sm:col-span-2"
                            />
                        </div>
                    </Tile>

                    {/* Property Details */}
                    <Tile title="Objektdetails">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                            <NumberField
                                label="Baujahr"
                                value={formData.yearOfConstruction}
                                onChange={(e) => handleInputChange('yearOfConstruction', parseInt(e.target.value) || 0)}
                            />
                            <NumberField
                                label="Anzahl Zimmer"
                                value={formData.numberOfRooms ?? ''}
                                onChange={(e) => handleInputChange('numberOfRooms', parseInt(e.target.value) || 0)}
                            />
                            <TextField
                                label="Energieeffizienz"
                                value={formData.energyEfficient ?? ''}
                                onChange={(e) => handleInputChange('energyEfficient', e.target.value)}
                            />
                            <NumberField
                                label="Wohnfläche (m²)"
                                value={formData.squareMeters}
                                onChange={(e) => handleInputChange('squareMeters', parseFloat(e.target.value) || 0)}
                            />
                        </div>
                    </Tile>
                </div>
            </main>

            {/* Sticky Action Bar */}
            <StickyActionBar
                show={isEditing}
                onGhost={handleCancel}
                onPrimary={handleSave}
                ghostLabel={BUTTON_DETAILS.Cancel.label}
                primaryLabel={BUTTON_DETAILS.Save.label}
                ghostIcon={<BUTTON_DETAILS.Cancel.icon />}
                primaryIcon={<BUTTON_DETAILS.Save.icon />}
            />
        </div>
    );
}
