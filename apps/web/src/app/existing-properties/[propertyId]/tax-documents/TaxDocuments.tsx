"use client";
import { useEffect, useState } from 'react';

import { buildPropertyUseCaseBreadcrumb, PropertyNotFoundPage } from '@/components/features/PropertyDisplay';
import { Button, Header, PAGE_CONTAINER_CLASS, Tile } from '@/components/ui';
import { BUTTON_DETAILS } from '@/constants/ButtonLabels';
import { ExistingPropertiesUseCases } from '@/constants/ExistingPropertiesUseCases';
import { getPropertyById } from '@/lib/supabase/property.supabase';
import { createUseCaseMenuItems } from '@/lib/propertyUseCaseMenu';
import { base64ToDataUri } from '@/lib/utils';
import type { Property } from '@immonext/types';
import { useRouter } from 'next/navigation';

export default function TaxDocuments({ propertyId }: { propertyId: string }) {
    const router = useRouter();
    const [property, setProperty] = useState<Property | null>(null);

    useEffect(() => {
        getPropertyById(parseInt(propertyId, 10)).then(setProperty);
    }, [propertyId]);

    const useCaseMenuItems = createUseCaseMenuItems(propertyId, 'TaxDocuments', (route) => {
        router.push(route);
    });

    if (!property) return <PropertyNotFoundPage />;

    return (
        <div className="min-h-screen bg-background pb-24">
            <main className={PAGE_CONTAINER_CLASS}>
                <Header
                    items={buildPropertyUseCaseBreadcrumb(property, propertyId, ExistingPropertiesUseCases.TaxDocuments)}
                    image={property.imageUrl ? <img src={base64ToDataUri(property.imageUrl)!} alt={`${property.street} ${property.houseNumber}`} className="w-10 h-10 object-cover rounded-lg" /> : undefined}
                    actions={
                    <Button
                        label={BUTTON_DETAILS.UseCases.label}
                        icon={<BUTTON_DETAILS.UseCases.icon />}
                        variant="outline"
                        hideLabelOnMobile
                        menuItems={useCaseMenuItems}
                    />
                } />
                <div>
                    <Tile title={ExistingPropertiesUseCases.TaxDocuments}>
                        <div className="p-4"><p className="text-muted-foreground">Hier können Sie Steuerunterlagen für diese Immobilie verwalten.</p></div>
                    </Tile>
                </div>
            </main>
        </div>
    );
}
