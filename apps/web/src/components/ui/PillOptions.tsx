import { cn } from "@/lib/utils";

export interface PillOption {
    value: string;
    label: string;
}

interface PillOptionsProps {
    options: PillOption[];
    value: string;
    onChange: (value: string) => void;
    /** "sm" (default) matches a dense option list like a category picker;
     *  "md" matches a 2-way mode toggle. */
    size?: "sm" | "md";
    className?: string;
}

const sizeStyles = {
    sm: "px-3 py-1.5",
    md: "px-4 py-2",
};

export function PillOptions({ options, value, onChange, size = "sm", className }: PillOptionsProps) {
    return (
        <div className={cn("flex flex-wrap gap-2", className)}>
            {options.map((opt) => (
                <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange(opt.value)}
                    className={cn(
                        "rounded-full text-sm font-medium border transition-colors cursor-pointer",
                        sizeStyles[size],
                        value === opt.value
                            ? "bg-primary/10 border-primary text-primary"
                            : "border-border text-foreground hover:bg-muted"
                    )}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}
