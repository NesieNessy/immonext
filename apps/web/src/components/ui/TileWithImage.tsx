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
        {image ? (
          <img
            src={image}
            alt={imageAlt}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <svg
              className="w-16 h-16 text-muted-foreground/30"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v13.5A1.5 1.5 0 003.75 21zM16.5 8.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
          </div>
        )}
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
