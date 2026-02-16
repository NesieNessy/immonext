import React from "react";
import { cn } from "@/lib/utils";

interface TileWithImageProps {
  title: string;
  description?: string;
  image: string;
  imageAlt?: string;
  badge?: string;
  onClick?: () => void;
  className?: string;
  actions?: React.ReactNode;
}

export function TileWithImage({
  title,
  description,
  image,
  imageAlt = "",
  badge,
  onClick,
  className,
  actions,
}: TileWithImageProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-card border border-border rounded-lg overflow-hidden transition-all duration-200",
        onClick && "cursor-pointer hover:shadow-lg hover:border-primary/50",
        className
      )}
    >
      <div className="relative h-48 bg-muted">
        <img
          src={image}
          alt={imageAlt}
          className="w-full h-full object-cover"
        />
        {badge && (
          <div className="absolute top-3 right-3 px-3 py-1 bg-accent text-accent-foreground rounded-full text-sm font-medium">
            {badge}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mb-4">{description}</p>
        )}
        {actions && (
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
