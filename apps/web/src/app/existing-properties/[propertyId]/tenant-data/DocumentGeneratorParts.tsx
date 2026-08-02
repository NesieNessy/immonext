"use client";

import { AlertTriangle, Check } from 'lucide-react';

export function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

export function initials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '–';
}

export function Pill({ ok, label }: { ok: boolean; label: string }) {
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
            ok ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
        }`}>
            {ok ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
            {label}
        </span>
    );
}

export function Field({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className="mt-1 text-sm text-foreground">{value}</p>
        </div>
    );
}

export function DataCard({
    icon: Icon,
    title,
    source,
    children,
}: {
    icon: React.ElementType;
    title: string;
    source: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-3 bg-muted/30">
                <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">{title}</span>
                </div>
                <span className="text-xs text-muted-foreground">Quelle: {source}</span>
            </div>
            <div className="p-4">{children}</div>
        </div>
    );
}
