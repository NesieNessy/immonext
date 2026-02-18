"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Header, TextField, NumberField, Tile, Button, CalendarField } from '@/components/immonext-design';
import { AppNavigation } from '../../shared/AppNavigation';
import existingPropertiesData from '@/data/existing_properties.json';

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

    const handleBack = () => {
        router.push('/existing-properties');
    };

    if (!property || !formData) {
        return (
            <div className="min-h-screen bg-background">
                <AppNavigation />
                <main className="container mx-auto px-4 py-8">
                    <p className="text-muted-foreground">Immobilie nicht gefunden</p>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-12">
            <AppNavigation />
            <main className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-between border-b border-border pb-4">
                    <div className="flex items-center gap-4">
                        {property.image?.data && (
                            <img
                                src={`data:${property.image.format};base64,${property.image.data}`}
                                alt={`${property.street} ${property.house_number}`}
                                className="w-16 h-16 object-cover rounded-lg"
                            />
                        )}
                        <div>
                            <h1 className="text-2xl font-semibold text-foreground">
                                {property.street} {property.house_number}
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">Immobiliendetails</p>
                        </div>
                    </div>
                    <Button variant="ghost" onClick={handleBack}>
                        <ArrowLeft size={20} className="mr-2" />
                        Zurück
                    </Button>
                </div>

                <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl">
                    {/* Address Information */}
                    <Tile title="Adresse">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                            <TextField
                                label="Straße"
                                value={formData.street}
                                readOnly
                                className="sm:col-span-2"
                            />
                            <TextField
                                label="Hausnummer"
                                value={formData.house_number}
                                readOnly
                            />
                            <TextField
                                label="Postleitzahl"
                                value={formData.postcode}
                                readOnly
                            />
                            <TextField
                                label="Stadt"
                                value={formData.city}
                                readOnly
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
                                readOnly
                            />
                            <CalendarField
                                label="Kaufsdatum"
                                value={new Date(formData.date_of_acquisition)}
                                readOnly
                            />
                            <NumberField
                                label="Anzahl Stellplätze"
                                value={formData.number_of_parking_spaces}
                                readOnly
                            />
                            <TextField
                                label="Energieeffizienz"
                                value={formData.energy_rating}
                                readOnly
                            />
                            <TextField
                                label="Wohnfläche"
                                value={formData.net_internal_area_sqm.toString()}
                                suffix="m²"
                                readOnly
                                className="sm:col-span-2"
                            />
                        </div>
                    </Tile>
                </div>
            </main>
        </div>
    );
}
