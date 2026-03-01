"use client";
import { useEffect, useState } from 'react';

import { Button, Header, Tile } from '@/components/ui';
import { BUTTON_DETAILS } from '@/constants/ButtonLabels';
import { ExistingPropertiesUseCases } from '@/constants/ExistingPropertiesUseCases';
import { getPropertyById } from '@/lib/supabase/property.supabase';
import { createUseCaseMenuItems } from '@/lib/useCaseMenu';
import { base64ToDataUri } from '@/lib/utils';
import type { Property } from '@immonext/types';
import { useRouter } from 'next/navigation';

export default function Sale({ propertyId }: { propertyId: string }) {
    const router = useRouter();
    const [property, setProperty] = useState<Property | null>(null);

    useEffect(() => {
        getPropertyById(parseInt(propertyId, 10)).then(setProperty);
    }, [propertyId]);

    const useCaseMenuItems = createUseCaseMenuItems(propertyId, 'Sale', (route) => {
        router.push(route);
    });

    if (!property) return (<div className="min-h-screen bg-background">
<main className="container mx-auto px-4 py-8"><p className="text-muted-foreground">Objekt nicht gefunden</p></main></div>);

    return (
        <div className="min-h-screen bg-background pb-24">
            <main className="container mx-auto px-4 py-8">
                <Header
                    title={`${property.street} ${property.houseNumber}`}
                    subtitle={ExistingPropertiesUseCases.Sale}
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
                    <Tile title={ExistingPropertiesUseCases.Sale}>
                        <div className="p-4"><p className="text-muted-foreground">Hier können Sie Verkaufsinformationen für diese Immobilie verwalten.</p></div>
                    </Tile>
                </div>
            </main>
        </div>
    );
}
