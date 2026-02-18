import React from "react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  image?: React.ReactNode;
  className?: string;
}

export function Header({ title, subtitle, actions, image, className }: HeaderProps) {
  return (
    <div className={cn("flex items-center justify-between border-b border-border pb-4", className)}>
      <div className="flex items-center gap-4">
        {image}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
