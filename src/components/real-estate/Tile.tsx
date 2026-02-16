import React from "react";
import { cn } from "@/lib/utils";

interface TileProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function Tile({
  title,
  description,
  icon,
  onClick,
  className,
  children,
}: TileProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "p-6 bg-card border border-border rounded-lg transition-all duration-200",
        onClick && "cursor-pointer hover:shadow-lg hover:border-primary/50",
        className
      )}
    >
      {icon && (
        <div className="mb-4 text-primary">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
      )}
      {children}
    </div>
  );
}
