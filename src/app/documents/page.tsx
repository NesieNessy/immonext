"use client";

import { Header } from '@/components/real-estate';
import { AppNavigation } from '@/components/AppNavigation';

export default function DocumentsPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Navigation Bar */}
            <AppNavigation />

            <main className="container mx-auto px-4 py-8">
                {/* Page Header */}
                <Header
                    title="Dokumente"
                    subtitle="Ihre Immobiliendokumente"
                />

                <div className="mt-8">
                    <p className="text-muted-foreground">
                        Dokumente-Inhalt wird hier angezeigt.
                    </p>
                </div>
            </main>
        </div>
    );
}
