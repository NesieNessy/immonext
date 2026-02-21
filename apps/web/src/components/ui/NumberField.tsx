import React from "react";
import { cn } from "@/lib/utils";

interface NumberFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  unit?: string;
}

export function NumberField({
  label,
  error,
  unit,
  className,
  ...props
}: NumberFieldProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block mb-2 text-sm text-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="number"
          className={cn(
            "w-full px-4 py-2 bg-input-background border border-border rounded-lg",
            "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
            "transition-all duration-200",
            unit && "pr-12",
            error && "border-destructive focus:ring-destructive/50",
            className
          )}
          {...props}
        />
        {unit && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
            {unit}
          </span>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
