"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, X } from 'lucide-react';
import { Header, TextField, NumberField, Tile, Button, StickyActionBar } from '@/components/immonext-design';
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
}
