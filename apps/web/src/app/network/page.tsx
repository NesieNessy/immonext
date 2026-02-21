"use client";

import { Header } from '@/components/ui';
export default function NetworkPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Navigation Bar */}
            <main className="container mx-auto px-4 py-8">
                {/* Page Header */}
                <Header
                    title="Netzwerk"
                    subtitle="Ihr professionelles Netzwerk"
                />

                <div className="mt-8">
                    <p className="text-muted-foreground">
                        Netzwerk-Inhalt wird hier angezeigt.
                    </p>
                </div>
            </main>
        </div>
    );
}
