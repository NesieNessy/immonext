"use client";

import { Header } from '@/components/real-estate';
import { AppNavigation } from '@/components/AppNavigation';

export default function SettingsPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Navigation Bar */}
            <AppNavigation />

            <main className="container mx-auto px-4 py-8">
                {/* Page Header */}
                <Header
                    title="Einstellungen"
                    subtitle="Ihre Kontoeinstellungen"
                />

                <div className="mt-8">
                    <p className="text-muted-foreground">
                        Einstellungen-Inhalt wird hier angezeigt.
                    </p>
                </div>
            </main>
        </div>
    );
}
