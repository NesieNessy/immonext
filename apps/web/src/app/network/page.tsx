"use client";

import { Header, PAGE_CONTAINER_CLASS } from '@/components/ui';
export default function NetworkPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Navigation Bar */}
            <main className={PAGE_CONTAINER_CLASS}>
                {/* Page Header */}
                <Header
                    items={[{ label: 'Netzwerk' }]}
                />

                <div>
                    <p className="text-muted-foreground">
                        Netzwerk-Inhalt wird hier angezeigt.
                    </p>
                </div>
            </main>
        </div>
    );
}
