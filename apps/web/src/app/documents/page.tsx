"use client";

import { Header } from '@/components/ui';
export default function DocumentsPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Navigation Bar */}
            <main className="container mx-auto px-4 py-8">
                {/* Page Header */}
                <Header
                    items={[{ label: 'Dokumente' }]}
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
