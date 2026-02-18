"use client";

import { Button } from '@/components/immonext-design';

interface StickyActionBarProps {
    show: boolean;
    onGhost: () => void;
    onPrimary: () => void;
    ghostLabel: string;
    primaryLabel: string;
}

export function StickyActionBar({
    show,
    onGhost,
    onPrimary,
    ghostLabel,
    primaryLabel
}: StickyActionBarProps) {
    if (!show) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50">
            <div className="container mx-auto px-4 py-4 flex justify-end gap-3">
                <Button
                    variant="ghost"
                    onClick={onGhost}
                >
                    {ghostLabel}
                </Button>
                <Button
                    variant="primary"
                    onClick={onPrimary}
                >
                    {primaryLabel}
                </Button>
            </div>
        </div>
    );
}
