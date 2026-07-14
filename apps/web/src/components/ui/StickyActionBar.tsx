"use client";

import { Button } from '@/components/ui';
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
}: StickyActionBarProps) {
    if (!show) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50">
            <div className="container mx-auto px-4 py-4 flex justify-end gap-3">
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
    );
}
