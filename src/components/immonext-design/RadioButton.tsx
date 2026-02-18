import React from "react";
import { cn } from "@/lib/utils";

interface RadioButtonProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export function RadioButton({
  label,
  className,
  id,
  ...props
}: RadioButtonProps) {
  const inputId = id || `radio-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className="flex items-center gap-2">
      <div className="relative inline-flex items-center">
        <input
          type="radio"
          id={inputId}
          className="peer sr-only"
          {...props}
        />
        <label
          htmlFor={inputId}
          className={cn(
            "w-5 h-5 border-2 border-border rounded-full bg-input-background cursor-pointer",
            "peer-checked:border-primary peer-checked:bg-primary",
            "peer-focus:ring-2 peer-focus:ring-primary/50",
            "transition-all duration-200",
            "flex items-center justify-center",
            className
          )}
        >
          <div className="w-2.5 h-2.5 bg-primary-foreground rounded-full opacity-0 peer-checked:opacity-100" />
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