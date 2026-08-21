"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Icons } from "../common";
import { useFieldIds } from "./fieldIds";

interface NumberInputProps {
  id?: string;
  label?: string;
  placeholder?: string;
  value?: number;
  onChange?: (value: number | undefined) => void;
  min?: number;
  max?: number;
  step?: number;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  showControls?: boolean;
  className?: string;
}

export function NumberInput({
  id,
  label,
  placeholder,
  value,
  onChange,
  min,
  max,
  step = 1,
  helperText,
  error,
  disabled = false,
  showControls = true,
  className,
}: NumberInputProps) {
  const { controlId, errorId, helperId, describedBy, invalid } = useFieldIds({ id, error, helperText });
  const [internalValue, setInternalValue] = React.useState<string>(
    value !== undefined ? String(value) : ""
  );

  React.useEffect(() => {
    if (value !== undefined) {
      setInternalValue(String(value));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);

    if (newValue === "" || newValue === "-") {
      onChange?.(undefined);
      return;
    }

    const numValue = parseFloat(newValue);
    if (!isNaN(numValue)) {
      onChange?.(numValue);
    }
  };

  const handleIncrement = () => {
    const currentValue = value !== undefined ? value : 0;
    const newValue = currentValue + step;
    if (max === undefined || newValue <= max) {
      onChange?.(newValue);
    }
  };

  const handleDecrement = () => {
    const currentValue = value !== undefined ? value : 0;
    const newValue = currentValue - step;
    if (min === undefined || newValue >= min) {
      onChange?.(newValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      handleIncrement();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      handleDecrement();
    }
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <label htmlFor={controlId} className="text-sm font-medium text-foreground">{label}</label>
      )}
      <div className="relative">
        <input
          type="number"
          id={controlId}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          value={internalValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={cn(
            "w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
            "transition-all duration-200",
            "placeholder:text-muted-foreground",
            showControls && "pr-10",
            disabled && "opacity-50 cursor-not-allowed bg-muted",
            error && "border-destructive focus:ring-destructive",
            "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          )}
        />
        {showControls && !disabled && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
            <button
              type="button"
              onClick={handleIncrement}
              aria-label={label ? `${label} erhöhen` : "Wert erhöhen"}
              aria-controls={controlId}
              disabled={max !== undefined && value !== undefined && value >= max}
              className={cn(
                "p-0.5 rounded hover:bg-muted transition-colors cursor-pointer",
                "disabled:opacity-30 disabled:cursor-not-allowed"
              )}
            >
              <Icons.ChevronUp size={14} className="text-muted-foreground" />
            </button>
            <button
              type="button"
              onClick={handleDecrement}
              aria-label={label ? `${label} verringern` : "Wert verringern"}
              aria-controls={controlId}
              disabled={min !== undefined && value !== undefined && value <= min}
              className={cn(
                "p-0.5 rounded hover:bg-muted transition-colors cursor-pointer",
                "disabled:opacity-30 disabled:cursor-not-allowed"
              )}
            >
              <Icons.ChevronDown size={14} className="text-muted-foreground" />
            </button>
          </div>
        )}
      </div>
      {(helperText || error) && (
        <p
          id={error ? errorId : helperId}
          role={error ? "alert" : undefined}
          className={cn(
            "text-xs",
            error ? "text-destructive" : "text-muted-foreground"
          )}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
}
