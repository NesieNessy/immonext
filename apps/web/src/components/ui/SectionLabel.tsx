export function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pb-2 border-b border-border">
            {children}
        </h3>
    );
}
