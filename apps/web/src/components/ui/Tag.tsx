import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Variant map — semantic color pairs (bg / text)
// ---------------------------------------------------------------------------

export type TagVariant =
  | "default"
  | "muted"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "purple"
  | "violet"
  | "orange"
  | "teal";

const variantStyles: Record<TagVariant, string> = {
  default:  "bg-foreground/10 text-foreground",
  muted:    "bg-muted text-muted-foreground",
  primary:  "bg-primary/15 text-primary",
  success:  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  warning:  "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  danger:   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  info:     "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  purple:   "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  violet:   "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  orange:   "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  teal:     "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
};

export type TagSize = "sm" | "md";

const sizeStyles: Record<TagSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TagProps {
  label: string;
  variant?: TagVariant;
  size?: TagSize;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Tag({ label, variant = "default", size = "sm", className }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full whitespace-nowrap",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {label}
    </span>
  );
}
