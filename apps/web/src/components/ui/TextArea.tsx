"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useFieldIds } from "./fieldIds";

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function TextArea({
  label,
  error,
  helperText,
  className,
  id,
  "aria-describedby": ariaDescribedBy,
  ...props
}: TextAreaProps) {
  const { controlId, errorId, helperId, describedBy, invalid } = useFieldIds({
    id,
    error,
    helperText,
    describedBy: ariaDescribedBy,
  });

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={controlId} className="mb-2 block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <textarea
        id={controlId}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className={cn(
          "min-h-[100px] w-full resize-y rounded-md border-2 border-primary/30 bg-card px-4 py-2 shadow-sm",
          "hover:border-primary/55 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
          "transition-[border-color,box-shadow,background-color] duration-150",
          "read-only:border-[#c9d5e2] read-only:bg-[#eef3f8] read-only:shadow-none read-only:hover:border-[#c9d5e2] read-only:focus:ring-0",
          "disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:opacity-60",
          error && "border-destructive focus:ring-destructive/50",
          className
        )}
        {...props}
      />
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-sm text-destructive">{error}</p>
      )}
      {helperText && !error && (
        <p id={helperId} className="mt-1 text-sm text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
}
