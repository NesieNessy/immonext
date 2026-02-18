"use client";

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button, Tile } from '@/components/immonext-design';
import { AppNavigation } from '../../../shared/AppNavigation';

export default function AdjustDistribution({ propertyId }: { propertyId: string }) {
    const router = useRouter();

    const handleBack = () => {
        router.push(`/existing-properties/${propertyId}`);
    };

    return (
        <div className="min-h-screen bg-background pb-24">
            <AppNavigation />
            <main className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-between border-b border-border pb-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground">
                            Aufteilung anpassen
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Kostenaufteilung und Verteilung anpassen
                        </p>
                    </div>
                    <Button variant="ghost" onClick={handleBack}>
                        <ArrowLeft size={20} className="mr-2" />
                        Zurück
                    </Button>
                </div>

                <div className="max-w-4xl">
                    <Tile title="Aufteilungseinstellungen">
                        <div className="p-4">
                            <p className="text-muted-foreground">
                                Hier können Sie die Aufteilungseinstellungen für diese Immobilie anpassen.
                            </p>
                        </div>
                    </Tile>
                </div>
            </main>
        </div>
    );
}
