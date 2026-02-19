import React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

export interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  label?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  iconOnly?: boolean;
  menuItems?: MenuItem[];
  children?: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  label,
  icon,
  iconPosition = "left",
  iconOnly = false,
  menuItems,
  className,
  children,
  ...props
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
    accent: "bg-accent text-accent-foreground hover:bg-accent/90",
    outline: "border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground",
    ghost: "bg-transparent text-foreground hover:bg-muted",
  };
  
  // Different padding for icon-only vs regular buttons
  const sizes = iconOnly ? {
    sm: "p-1.5",
    md: "p-2",
    lg: "p-3",
  } : {
    sm: "px-3 py-1.5 text-sm gap-2",
    md: "px-4 py-2 gap-2",
    lg: "px-6 py-3 text-lg gap-2",
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  // Clone icon and add size prop if it's a React element
  const iconWithSize = icon && React.isValidElement(icon)
    ? React.cloneElement(icon as React.ReactElement<any>, { size: iconSizes[size] })
    : icon;

  // Determine content based on props
  let content;
  if (iconOnly && icon) {
    // Icon-only button
    content = iconWithSize;
  } else if (label) {
    // Button with label and optional icon
    content = (
      <>
        {iconWithSize && iconPosition === "left" && iconWithSize}
        {label}
        {iconWithSize && iconPosition === "right" && iconWithSize}
        {menuItems && <ChevronDown size={iconSizes[size]} className="ml-1" />}
      </>
    );
  } else {
    // Fallback to children
    content = children;
  }

  // If menuItems is provided, wrap button in Popover
  if (menuItems && menuItems.length > 0) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button
            className={cn(baseStyles, variants[variant], sizes[size], className)}
            {...props}
          >
            {content}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="end">
          <div className="flex flex-col gap-1">
            {menuItems.map((item, index) => {
              const itemIconWithSize = item.icon && React.isValidElement(item.icon)
                ? React.cloneElement(item.icon as React.ReactElement<any>, { size: 18 })
                : item.icon;
              
              return (
                <button
                  key={index}
                  onClick={item.onClick}
                  disabled={item.disabled}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors text-left cursor-pointer",
                    "hover:bg-muted focus:bg-muted focus:outline-none",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  )}
                >
                  {itemIconWithSize && <span className="flex-shrink-0">{itemIconWithSize}</span>}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {content}
    </button>
  );
}