"use client";

import React, { useId } from "react";
import { cn } from "@/lib/utils";

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label?: string;
  onCheckedChange?: (checked: boolean) => void;
}

export function Switch({
  label,
  className,
  id,
  checked,
  onCheckedChange,
  ...props
}: SwitchProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="flex items-center gap-2">
      {label && (
        <label htmlFor={inputId} className="text-sm text-foreground cursor-pointer select-none">
          {label}
        </label>
      )}
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          id={inputId}
          role="switch"
          className="peer sr-only"
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          {...props}
        />
        <label
          htmlFor={inputId}
          className={cn(
            "relative w-9 h-5 rounded-full bg-muted border-2 border-border cursor-pointer",
            "peer-checked:bg-primary peer-checked:border-primary",
            "peer-focus:ring-2 peer-focus:ring-primary/50",
            "peer-disabled:opacity-50 peer-disabled:cursor-not-allowed",
            "transition-colors duration-200",
            // The thumb is a *child* of this label, not a sibling of the
            // input, so a plain `peer-checked:` on it never matches — the
            // modifier has to be applied here and reach down into the span.
            "peer-checked:[&>span]:translate-x-4",
            className
          )}
        >
          <span
            className="absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-card shadow-sm transition-transform duration-200"
          />
        </label>
      </div>
    </div>
  );
}
