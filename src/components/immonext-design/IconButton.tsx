import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  variant?: "primary" | "secondary" | "accent" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function IconButton({
  icon: Icon,
  variant = "ghost",
  size = "md",
  className,
  ...props
}: IconButtonProps) {
  const baseStyles = "inline-flex items-center justify-center rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
    accent: "bg-accent text-accent-foreground hover:bg-accent/90",
    ghost: "bg-transparent text-foreground hover:bg-muted",
  };
  
  const sizes = {
    sm: "p-1.5",
    md: "p-2",
    lg: "p-3",
  };
  
  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      <Icon size={iconSizes[size]} />
    </button>
  );
}