"use client";

import { useRouter } from 'next/navigation';
import { Tile, Button, Header } from '@/components/immonext-design';
import { AppNavigation } from '../../../shared/AppNavigation';
import { ButtonLabels } from '@/constants/ButtonLabels';
import { ExistingPropertiesUseCases } from '@/constants/ExistingPropertiesUseCases';
import { Layers } from 'lucide-react';
import existingPropertiesData from '@/data/existing_properties.json';
import type { Property } from '@/types';
import { createUseCaseMenuItems } from '@/lib/useCaseMenu';

export default function Contractors({ propertyId }: { propertyId: string }) {
    const router = useRouter();
    const property = existingPropertiesData.existing_properties.find(p => p.id === propertyId) as Property;

    const useCaseMenuItems = createUseCaseMenuItems(propertyId, 'Contractors', (route) => {
        router.push(route);
    });

    if (!property) return (<div className="min-h-screen bg-background"><AppNavigation /><main className="container mx-auto px-4 py-8"><p className="text-muted-foreground">Objekt nicht gefunden</p></main></div>);

    return (
        <div className="min-h-screen bg-background pb-24">
            <AppNavigation />
            <main className="container mx-auto px-4 py-8">
                <Header 
                    title={`${property.street} ${property.house_number}`}
                    subtitle={ExistingPropertiesUseCases.Contractors}
                    image={property.image?.data && (<img src={`data:${property.image.format};base64,${property.image.data}`} alt={`${property.street} ${property.house_number}`} className="w-16 h-16 object-cover rounded-lg" />)}
                    actions={
                        <Button 
                            label={ButtonLabels.UseCases}
                            icon={<Layers />}
                            variant="primary"
                            menuItems={useCaseMenuItems}
                        />
                    }
                />
                <div className="mt-8 max-w-4xl">
                    <Tile title={ExistingPropertiesUseCases.Contractors}>
                        <div className="p-4"><p className="text-muted-foreground">Hier können Sie Handwerker und Dienstleister für diese Immobilie verwalten.</p></div>
                    </Tile>
                </div>
            </main>
        </div>
    );
}
