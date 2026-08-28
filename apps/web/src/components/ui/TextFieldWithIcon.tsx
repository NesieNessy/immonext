"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { useFieldIds } from "./fieldIds";

interface TextFieldWithIconProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon: LucideIcon;
  iconPosition?: "left" | "right";
}

export function TextFieldWithIcon({
  label,
  error,
  icon: Icon,
  iconPosition = "left",
  className,
  readOnly,
  disabled,
  id,
  "aria-describedby": ariaDescribedBy,
  ...props
}: TextFieldWithIconProps) {
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
        {iconPosition === "left" && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true">
            <Icon size={20} />
          </div>
        )}
        <input
          id={controlId}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className={cn(
            "w-full appearance-none rounded-md border border-primary/30 bg-card px-4 py-2 shadow-sm",
            "hover:border-primary/55 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
            "transition-[border-color,box-shadow,background-color] duration-150",
            "read-only:border-primary/20 read-only:bg-primary/5 read-only:shadow-none read-only:hover:border-primary/20 read-only:focus:ring-0",
            "disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none disabled:hover:border-border",
            iconPosition === "left" && "pl-10",
            iconPosition === "right" && "pr-10",
            error && "border-destructive focus:ring-destructive/50",
            className
          )}
          readOnly={readOnly}
          disabled={disabled}
          {...props}
        />
        {iconPosition === "right" && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true">
            <Icon size={20} />
          </div>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
