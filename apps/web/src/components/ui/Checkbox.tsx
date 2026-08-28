"use client";

import React, { useId } from "react";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/common";

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export function Checkbox({
  label,
  className,
  id,
  ...props
}: CheckboxProps) {
  // Was `Math.random()`, which produced a different id on the server than on
  // the client (hydration mismatch) and a fresh one on every re-render.
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="flex items-center gap-2">
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          id={inputId}
          className="peer sr-only"
          {...props}
        />
        <label
          htmlFor={inputId}
          className={cn(
            "w-5 h-5 border-2 border-border rounded bg-input-background cursor-pointer",
            "peer-checked:bg-primary peer-checked:border-primary",
            "peer-focus:ring-2 peer-focus:ring-primary/50",
            "transition-all duration-200",
            "flex items-center justify-center",
            // The check mark is a *child* of this label, not a sibling of the
            // input, so a plain `peer-checked:` on it never matches — the
            // modifier has to be applied here and reach down into the svg.
            "peer-checked:[&>svg]:opacity-100",
            className
          )}
        >
          <Icons.Check className="w-3 h-3 text-primary-foreground opacity-0" aria-hidden="true" />
        </label>
      </div>
      {label && (
        <label htmlFor={inputId} className="text-sm text-foreground cursor-pointer">
          {label}
        </label>
      )}
    </div>
  );
}
