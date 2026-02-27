"use client";
import { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';
import { BUTTON_DETAILS } from '@/constants/ButtonLabels';
import { ExistingPropertiesUseCases } from '@/constants/ExistingPropertiesUseCases';
import { Layers } from 'lucide-react';
import type { Property } from '@immonext/types';
import { getPropertyById } from '@/lib/supabase/property';
import { createUseCaseMenuItems } from '@/lib/useCaseMenu';
import { Button, Header, Tile } from '@/components/ui';
import { base64ToDataUri } from '@/lib/utils';

export default function KeyMetrics({ propertyId }: { propertyId: string }) {
    const router = useRouter();
    const [property, setProperty] = useState<Property | null>(null);

    useEffect(() => {
        getPropertyById(parseInt(propertyId, 10)).then(setProperty);
    }, [propertyId]);

    const useCaseMenuItems = createUseCaseMenuItems(propertyId, 'KeyMetrics', (route) => {
        router.push(route);
    });

    if (!property) return (<div className="min-h-screen bg-background">
<main className="container mx-auto px-4 py-8"><p className="text-muted-foreground">Objekt nicht gefunden</p></main></div>);

    return (
        <div className="min-h-screen bg-background pb-24">
            <main className="container mx-auto px-4 py-8">
                <Header
                    title={`${property.street} ${property.houseNumber}`}
                    subtitle={ExistingPropertiesUseCases.KeyMetrics}
                    image={property.imageUrl ? <img src={base64ToDataUri(property.imageUrl)!} alt={`${property.street} ${property.houseNumber}`} className="w-16 h-16 object-cover rounded-lg" /> : undefined}
                    actions={
                    <Button 
                        label={BUTTON_DETAILS.UseCases.label}
                        icon={<BUTTON_DETAILS.UseCases.icon />}
                        variant="primary"
                        menuItems={useCaseMenuItems}
                    />
                } />
                <div className="mt-8 max-w-4xl">
                    <Tile title={ExistingPropertiesUseCases.KeyMetrics}>
                        <div className="p-4"><p className="text-muted-foreground">Hier können Sie die Kennzahlen für diese Immobilie einsehen.</p></div>
                    </Tile>
                </div>
            </main>
        </div>
    );
}
