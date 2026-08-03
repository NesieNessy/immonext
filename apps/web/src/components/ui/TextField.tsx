import React from "react";
import { cn } from "@/lib/utils";

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  suffix?: string;
}

export function TextField({
  label,
  error,
  helperText,
  suffix,
  className,
  readOnly,
  disabled,
  ...props
}: TextFieldProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="mb-2 block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          className={cn(
            "w-full rounded-md border-2 border-primary/30 bg-card px-4 py-2 shadow-sm",
            "hover:border-primary/55 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
            "transition-[border-color,box-shadow,background-color] duration-150",
            "read-only:border-[#c9d5e2] read-only:bg-[#eef3f8] read-only:shadow-none read-only:hover:border-[#c9d5e2] read-only:focus:ring-0",
            "disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:opacity-60",
            error && "border-destructive focus:ring-destructive/50",
            suffix && "pr-12",
            className
          )}
          readOnly={readOnly}
          disabled={disabled}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-destructive">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
}
