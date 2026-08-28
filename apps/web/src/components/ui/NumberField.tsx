"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useFieldIds } from "./fieldIds";

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
  readOnly,
  disabled,
  id,
  "aria-describedby": ariaDescribedBy,
  ...props
}: NumberFieldProps) {
  const { controlId, errorId, describedBy, invalid } = useFieldIds({
    id,
    error,
    describedBy: ariaDescribedBy,
  });

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={controlId} className="block mb-2 text-sm text-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="number"
          id={controlId}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className={cn(
            "w-full rounded-md border border-primary/30 bg-card px-4 py-2 shadow-sm",
            "hover:border-primary/55 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
            "transition-[border-color,box-shadow,background-color] duration-150",
            "read-only:border-primary/20 read-only:bg-primary/5 read-only:shadow-none read-only:hover:border-primary/20 read-only:focus:ring-0",
            "disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none disabled:hover:border-border",
            unit && "pr-12",
            error && "border-destructive focus:ring-destructive/50",
            className
          )}
          readOnly={readOnly}
          disabled={disabled}
          {...props}
        />
        {unit && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
            {unit}
          </span>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
