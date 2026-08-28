"use client";
import { useEffect, useState } from 'react';

import { buildPropertyUseCaseBreadcrumb, PropertyLoadingPage, PropertyNotFoundPage, propertyThumbnail } from '@/components/features/PropertyDisplay';
import { Button, Header, PAGE_CONTAINER_CLASS, Tile } from '@/components/ui';
import { BUTTON_DETAILS } from '@/constants/ButtonLabels';
import { ExistingPropertiesUseCases } from '@/constants/ExistingPropertiesUseCases';
import { getPropertyById } from '@/lib/supabase/property.supabase';
import { createUseCaseMenuItems } from '@/lib/propertyUseCaseMenu';
import type { Property } from '@immonext/types';
import { Layers } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Contractors({ propertyId }: { propertyId: string }) {
    const router = useRouter();
    const [property, setProperty] = useState<Property | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getPropertyById(parseInt(propertyId, 10)).then((p) => {
            setProperty(p);
            setIsLoading(false);
        });
    }, [propertyId]);

    const useCaseMenuItems = createUseCaseMenuItems(propertyId, 'Contractors', (route) => {
        router.push(route);
    });

    if (isLoading) return <PropertyLoadingPage />;

    if (!property) return <PropertyNotFoundPage />;

    return (
        <div className="min-h-screen bg-background pb-24">
            <main className={PAGE_CONTAINER_CLASS}>
                <Header
                    items={buildPropertyUseCaseBreadcrumb(property, propertyId, ExistingPropertiesUseCases.Contractors)}
                    image={propertyThumbnail(property)}
                    actions={
                        <Button
                            label={BUTTON_DETAILS.UseCases.label}
                            icon={<Layers />}
                            variant="outline"
                            hideLabelOnMobile
                            menuItems={useCaseMenuItems}
                        />
                    }
                />
                <div>
                    <Tile title={ExistingPropertiesUseCases.Contractors}>
                        <div className="p-4"><p className="text-muted-foreground">Hier können Sie Handwerker und Dienstleister für diese Immobilie verwalten.</p></div>
                    </Tile>
                </div>
            </main>
        </div>
    );
}
