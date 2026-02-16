import React from "react";
import { cn } from "@/lib/utils";

type TypographyVariant = 
  | "h1" 
  | "h2" 
  | "h3" 
  | "h4" 
  | "h5" 
  | "h6" 
  | "body-large"
  | "body"
  | "body-small"
  | "caption"
  | "overline"
  | "label";

type TypographyWeight = "regular" | "medium" | "semibold" | "bold";

type HtmlElementType = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "label" | "div";

interface TypographyProps {
  variant?: TypographyVariant;
  weight?: TypographyWeight;
  color?: "primary" | "secondary" | "muted" | "accent" | "default";
  className?: string;
  children: React.ReactNode;
  as?: HtmlElementType;
}

const variantStyles: Record<TypographyVariant, string> = {
  h1: "text-4xl leading-tight",
  h2: "text-3xl leading-tight",
  h3: "text-2xl leading-snug",
  h4: "text-xl leading-snug",
  h5: "text-lg leading-normal",
  h6: "text-base leading-normal",
  "body-large": "text-lg leading-relaxed",
  body: "text-base leading-relaxed",
  "body-small": "text-sm leading-relaxed",
  caption: "text-xs leading-normal",
  overline: "text-xs uppercase tracking-wide leading-normal",
  label: "text-sm leading-normal",
};

const weightStyles: Record<TypographyWeight, string> = {
  regular: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
};

const colorStyles = {
  primary: "text-primary",
  secondary: "text-secondary",
  muted: "text-muted-foreground",
  accent: "text-accent",
  default: "text-foreground",
};

const defaultElements: Record<TypographyVariant, HtmlElementType> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
  "body-large": "p",
  body: "p",
  "body-small": "p",
  caption: "span",
  overline: "span",
  label: "label",
};

export function Typography({
  variant = "body",
  weight = "regular",
  color = "default",
  className,
  children,
  as,
}: TypographyProps) {
  const Component = (as || defaultElements[variant]) as React.ElementType;

  return (
    <Component
      className={cn(
        variantStyles[variant],
        weightStyles[weight],
        colorStyles[color],
        className
      )}
    >
      {children}
    </Component>
  );
}
