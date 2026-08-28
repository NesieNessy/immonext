"use client";

import { Icons } from '@/components/ui';

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
            ok ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'
        }`}>
            {ok ? <Icons.Check className="w-3 h-3" /> : <Icons.AlertTriangle className="w-3 h-3" />}
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

/** Card shell shared by the tenant-data feature: icon + title header (bar of
 *  "Quelle: X" or custom actions on the right), a body, and an optional
 *  footer bar for primary actions — keeps every card in this area visually
 *  consistent instead of each screen hand-rolling its own header/footer. */
export function DataCard({
    icon: Icon,
    title,
    source,
    actions,
    footer,
    children,
}: {
    icon: React.ElementType;
    title: string;
    source?: string;
    actions?: React.ReactNode;
    footer?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between gap-3 flex-wrap px-4 py-3 bg-muted/30">
                <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-foreground" />
                    <span className="text-sm font-semibold text-foreground">{title}</span>
                </div>
                {actions ?? (source && <span className="text-xs text-muted-foreground">Quelle: {source}</span>)}
            </div>
            <div className="p-4">{children}</div>
            {footer && (
                <div className="flex items-center justify-end gap-2 flex-wrap px-4 py-3 border-t border-border bg-muted/10">
                    {footer}
                </div>
            )}
        </div>
    );
}
