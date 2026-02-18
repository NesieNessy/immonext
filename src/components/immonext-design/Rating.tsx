import React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingProps {
  value: number;
  onChange?: (value: number) => void;
  max?: number;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Rating({
  value,
  onChange,
  max = 5,
  readonly = false,
  size = "md",
  className,
}: RatingProps) {
  const [hoverValue, setHoverValue] = React.useState<number | null>(null);

  const sizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  const handleClick = (index: number) => {
    if (!readonly && onChange) {
      onChange(index + 1);
    }
  };

  return (
    <div className={cn("flex gap-1", className)}>
      {Array.from({ length: max }).map((_, index) => {
        const filled = (hoverValue ?? value) > index;
        return (
          <button
            key={index}
            type="button"
            onClick={() => handleClick(index)}
            onMouseEnter={() => !readonly && setHoverValue(index + 1)}
            onMouseLeave={() => !readonly && setHoverValue(null)}
            disabled={readonly}
            className={cn(
              "transition-all duration-200",
              !readonly && "cursor-pointer hover:scale-110",
              readonly && "cursor-default"
            )}
          >
            <Star
              size={sizes[size]}
              className={cn(
                "transition-colors",
                filled ? "fill-accent text-accent" : "text-muted-foreground"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
