import React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export function Checkbox({
  label,
  className,
  id,
  ...props
}: CheckboxProps) {
  const inputId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
  
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
            className
          )}
        >
          <Check className="w-3 h-3 text-primary-foreground opacity-0 peer-checked:opacity-100" />
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
