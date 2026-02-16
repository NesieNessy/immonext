import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

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
  ...props
}: TextFieldWithIconProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block mb-2 text-sm text-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        {iconPosition === "left" && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Icon size={20} />
          </div>
        )}
        <input
          className={cn(
            "w-full px-4 py-2 bg-input-background border border-border rounded-lg",
            "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
            "transition-all duration-200",
            iconPosition === "left" && "pl-10",
            iconPosition === "right" && "pr-10",
            error && "border-destructive focus:ring-destructive/50",
            className
          )}
          {...props}
        />
        {iconPosition === "right" && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Icon size={20} />
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
