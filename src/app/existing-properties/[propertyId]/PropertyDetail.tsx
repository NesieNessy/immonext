"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, X, Edit } from 'lucide-react';
import { TextField, NumberField, Tile, Button, CalendarField, StickyActionBar, Header } from '@/components/immonext-design';
import type { MenuItem } from '@/components/immonext-design';
import { AppNavigation } from '../../shared/AppNavigation';
import { ButtonLabels } from '@/constants/ButtonLabels';
import existingPropertiesData from '@/data/existing_properties.json';
import { ExistingPropertiesUseCases } from '@/constants/ExistingPropertiesUseCases';

interface Property {
    id: string;
    street: string;
    house_number: string;
    postcode: string;
    city: string;
    year_of_construction: number;
    date_of_acquisition: string;
    number_of_parking_spaces: number;
    energy_rating: string;
    net_internal_area_sqm: number;
    image?: {
        format: string;
        encoding: string;
        data: string;
    };
}

export default function PropertyDetail({ propertyId }: { propertyId: string }) {
    const router = useRouter();

    const [property, setProperty] = useState<Property | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Property | null>(null);

    useEffect(() => {
        // Find property by ID from URL
        const foundProperty = existingPropertiesData.existing_properties.find((prop) => {
            return prop.id === propertyId;
        });

        if (foundProperty) {
            setProperty(foundProperty as Property);
            setFormData(foundProperty as Property);
        }
    }, [propertyId]);

    const handleInputChange = (field: keyof Property, value: string | number | Date) => {
        if (!formData) return;

        // Handle Date object conversion for date_of_acquisition
        if (field === 'date_of_acquisition' && value instanceof Date) {
            const dateString = value.toISOString().split('T')[0];
            setFormData({ ...formData, [field]: dateString });
        } else {
            setFormData({ ...formData, [field]: value });
        }

        if (!isEditing) setIsEditing(true);
    };

    const handleCancel = () => {
        setFormData(property);
        setIsEditing(false);
    };

    const handleSave = () => {
        // TODO: Implement save functionality
        console.log('Saving property data:', formData);
        setProperty(formData);
        setIsEditing(false);
    };

    // Create menu items for all use cases
    const useCaseMenuItems: MenuItem[] = Object.values(ExistingPropertiesUseCases).map((useCase) => ({
        label: useCase,
        onClick: () => {
            console.log('Selected use case:', useCase);
            // TODO: Implement use case navigation/functionality
        },
    }));

    if (!property || !formData) {
        return (
            <div className="min-h-screen bg-background">
                <AppNavigation />
                <main className="container mx-auto px-4 py-8">
                    <p className="text-muted-foreground">Objekt nicht gefunden</p>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-24">
            <AppNavigation />
            <main className="container mx-auto px-4 py-8">
                <Header 
                    title={`${property.street} ${property.house_number}`}
                    subtitle={ExistingPropertiesUseCases.PropertyData}
                    image={property.image?.data && (
                        <img
                            src={`data:${property.image.format};base64,${property.image.data}`}
                            alt={`${property.street} ${property.house_number}`}
                            className="w-16 h-16 object-cover rounded-lg"
                        />
                    )}
                    actions={
                        <>
                            <Button 
                                label={ButtonLabels.AdjustRND}
                                icon={<Edit />}
                                variant="outline" 
                                onClick={goToAdjustRND()}
                            />
                            <Button 
                                label={ButtonLabels.AdjustDistribution}
                                icon={<Edit />}
                                variant="outline" 
                                onClick={goToAdjustDistribution()}
                            />
                            <Button 
                                label={ButtonLabels.UseCases}
                                variant="primary"
                                menuItems={useCaseMenuItems}
                            />
                        </>
                    }
                />

                <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl">
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
                                value={formData.house_number}
                                onChange={(e) => handleInputChange('house_number', e.target.value)}
                            />
                            <TextField
                                label="Postleitzahl"
                                value={formData.postcode}
                                onChange={(e) => handleInputChange('postcode', e.target.value)}
                            />
                            <TextField
                                label="Stadt"
                                value={formData.city}
                                onChange={(e) => handleInputChange('city', e.target.value)}
                                className="sm:col-span-2"
                            />
                        </div>
                    </Tile>

                    {/* Property Details */}
                    <Tile title="Objektdetails">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                            <NumberField
                                label="Baujahr"
                                value={formData.year_of_construction}
                                onChange={(e) => handleInputChange('year_of_construction', parseInt(e.target.value) || 0)}
                            />
                            <CalendarField
                                label="Kaufsdatum"
                                value={new Date(formData.date_of_acquisition)}
                                onChange={(date) => date && handleInputChange('date_of_acquisition', date)}
                            />
                            <NumberField
                                label="Anzahl Stellplätze"
                                value={formData.number_of_parking_spaces}
                                onChange={(e) => handleInputChange('number_of_parking_spaces', parseInt(e.target.value) || 0)}
                            />
                            <TextField
                                label="Energieeffizienz"
                                value={formData.energy_rating}
                                onChange={(e) => handleInputChange('energy_rating', e.target.value)}
                            />
                            <TextField
                                label="Wohnfläche"
                                value={formData.net_internal_area_sqm}
                                suffix="m²"
                                onChange={(e) => handleInputChange('net_internal_area_sqm', e.target.value)}
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
                ghostLabel={ButtonLabels.Cancel}
                primaryLabel={ButtonLabels.Save}
                ghostIcon={<X size={20} />}
                primaryIcon={<Save size={20} />}
            />
        </div>
    );

    function goToAdjustRND() {
        return () => router.push(`/existing-properties/${propertyId}/adjust-rnd`);
    }

    function goToAdjustDistribution() {
        return () => router.push(`/existing-properties/${propertyId}/adjust-distribution`);
    }
}
