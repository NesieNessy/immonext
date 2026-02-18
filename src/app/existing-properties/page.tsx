"use client";

import { Header } from '@/components/immonext-design';
import { AppNavigation } from '../shared/AppNavigation';

export default function ExistingPropertiesPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Navigation Bar */}
            <AppNavigation />

            <main className="container mx-auto px-4 py-8">
                {/* Page Header */}
                <Header
                    title="Bestandsobjekte"
                    subtitle="Übersicht Ihrer Immobilien"
                />

                <div className="mt-8">
                    <p className="text-muted-foreground">
                        Bestandsobjekte-Inhalt wird hier angezeigt.
                    </p>
                </div>
            </main>
        </div>
    );
}
