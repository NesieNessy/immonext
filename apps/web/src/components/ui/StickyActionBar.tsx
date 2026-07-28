"use client";

import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import React from 'react';

interface StickyActionBarProps {
    show: boolean;
    onGhost: () => void;
    onPrimary: () => void;
    ghostLabel: string;
    primaryLabel: string;
    ghostIcon?: React.ReactNode;
    primaryIcon?: React.ReactNode;
    ghostDisabled?: boolean;
    primaryDisabled?: boolean;
    /** e.g. a "Schritt 1 von 2" label, shown at the start of the bar. */
    leftContent?: React.ReactNode;
}

export function StickyActionBar({
    show,
    onGhost,
    onPrimary,
    ghostLabel,
    primaryLabel,
    ghostIcon,
    primaryIcon,
    ghostDisabled = false,
    primaryDisabled = false,
    leftContent,
}: StickyActionBarProps) {
    if (!show) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50">
            <div className={cn("container mx-auto px-4 py-4 flex items-center gap-3", leftContent ? "justify-between" : "justify-end")}>
                {leftContent}
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        onClick={onGhost}
                        label={ghostLabel}
                        icon={ghostIcon}
                        disabled={ghostDisabled}
                    />
                    <Button
                        variant="primary"
                        onClick={onPrimary}
                        label={primaryLabel}
                        icon={primaryIcon}
                        disabled={primaryDisabled}
                    />
                </div>
            </div>
        </div>
    );
}
