"use client";

import { useRouter } from 'next/navigation';
import { Tile, Button, Header } from '@/components/immonext-design';
import { AppNavigation } from '../../../shared/AppNavigation';
import { ButtonLabels } from '@/constants/ButtonLabels';
import { ExistingPropertiesUseCases } from '@/constants/ExistingPropertiesUseCases';
import { ArrowLeft } from 'lucide-react';
import existingPropertiesData from '@/data/existing_properties.json';

interface Property { id: string; street: string; house_number: string; image?: { format: string; encoding: string; data: string; }; }

export default function Sale({ propertyId }: { propertyId: string }) {
    const router = useRouter();
    const property = existingPropertiesData.existing_properties.find(p => p.id === propertyId) as Property;

    if (!property) return (<div className="min-h-screen bg-background"><AppNavigation /><main className="container mx-auto px-4 py-8"><p className="text-muted-foreground">Objekt nicht gefunden</p></main></div>);

    return (
        <div className="min-h-screen bg-background pb-24">
            <AppNavigation />
            <main className="container mx-auto px-4 py-8">
                <Header title={`${property.street} ${property.house_number}`} subtitle={ExistingPropertiesUseCases.Sale} image={property.image?.data && (<img src={`data:${property.image.format};base64,${property.image.data}`} alt={`${property.street} ${property.house_number}`} className="w-16 h-16 object-cover rounded-lg" />)} actions={<Button label={ButtonLabels.Back} icon={<ArrowLeft />} variant="ghost" onClick={() => router.push(`/existing-properties/${propertyId}/property-data`)} />} />
                <div className="mt-8 max-w-4xl">
                    <Tile title={ExistingPropertiesUseCases.Sale}>
                        <div className="p-4"><p className="text-muted-foreground">Hier können Sie Verkaufsinformationen für diese Immobilie verwalten.</p></div>
                    </Tile>
                </div>
            </main>
        </div>
    );
}
