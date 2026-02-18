import React from "react";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { format } from "date-fns";

interface CalendarFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  label?: string;
  error?: string;
  value?: Date;
  onChange?: (date: Date | undefined) => void;
}

export function CalendarField({
  label,
  error,
  value,
  onChange,
  className,
  ...props
}: CalendarFieldProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value ? format(value, "dd.MM.yyyy") : "");

  React.useEffect(() => {
    setInputValue(value ? format(value, "dd.MM.yyyy") : "");
  }, [value]);

  const handleSelect = (date: Date | undefined) => {
    onChange?.(date);
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Try to parse various date formats
    const parsedDate = parseFlexibleDate(newValue);
    if (parsedDate) {
      onChange?.(parsedDate);
    }
  };

  const handleBlur = () => {
    // If input is invalid, reset to the current value
    if (value) {
      setInputValue(format(value, "dd.MM.yyyy"));
    } else if (!inputValue) {
      setInputValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const parsedDate = parseFlexibleDate(inputValue);
      if (parsedDate) {
        onChange?.(parsedDate);
        setOpen(false);
      }
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block mb-2 text-sm text-foreground">
          {label}
        </label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild disabled={props.readOnly || props.disabled}>
          <div className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder={props.placeholder || "dd.mm.yyyy"}
              className={cn(
                "w-full px-4 py-2 bg-input-background border border-border rounded-lg cursor-text",
                !props.readOnly && !props.disabled && "pr-10",
                "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                "transition-all duration-200",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "read-only:cursor-default",
                error && "border-destructive focus:ring-destructive/50",
                className
              )}
              {...props}
            />
            {!props.readOnly && !props.disabled && (
              <button
                type="button"
                onClick={() => setOpen(!open)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <CalendarIcon size={20} />
              </button>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {error && (
        <p className="mt-1 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

// Helper function to parse flexible date formats
function parseFlexibleDate(input: string): Date | null {
  if (!input) return null;

  // Try various date formats
  const formats = [
    // DD.MM.YY or D.M.YY (primary format)
    { regex: /^(\d{1,2})\.(\d{1,2})\.(\d{2})$/, order: 'dmy2' },
    // DD.MM.YYYY or D.M.YYYY
    { regex: /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/, order: 'dmy4' },
    // MM/DD/YYYY or M/D/YYYY
    { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, order: 'mdy4' },
    // MM-DD-YYYY or M-D-YYYY
    { regex: /^(\d{1,2})-(\d{1,2})-(\d{4})$/, order: 'mdy4' },
    // DD/MM/YYYY or D/M/YYYY
    { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, order: 'dmy4' },
    // DD-MM-YYYY or D-M-YYYY
    { regex: /^(\d{1,2})-(\d{1,2})-(\d{4})$/, order: 'dmy4' },
    // YYYY/MM/DD or YYYY/M/D
    { regex: /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/, order: 'ymd' },
    // YYYY-MM-DD or YYYY-M-D
    { regex: /^(\d{4})-(\d{1,2})-(\d{1,2})$/, order: 'ymd' },
  ];

  for (const format of formats) {
    const match = input.match(format.regex);
    if (match) {
      let year: number, month: number, day: number;
      
      if (format.order === 'dmy2') {
        // DD.MM.YY format - assume 20xx for years
        day = parseInt(match[1], 10);
        month = parseInt(match[2], 10) - 1; // Month is 0-indexed
        const yearShort = parseInt(match[3], 10);
        year = yearShort < 100 ? 2000 + yearShort : yearShort;
      } else if (format.order === 'dmy4') {
        // DD.MM.YYYY or DD/MM/YYYY or DD-MM-YYYY format
        day = parseInt(match[1], 10);
        month = parseInt(match[2], 10) - 1; // Month is 0-indexed
        year = parseInt(match[3], 10);
      } else if (format.order === 'ymd') {
        // YYYY-MM-DD format
        year = parseInt(match[1], 10);
        month = parseInt(match[2], 10) - 1; // Month is 0-indexed
        day = parseInt(match[3], 10);
      } else {
        // MM/DD/YYYY format
        month = parseInt(match[1], 10) - 1; // Month is 0-indexed
        day = parseInt(match[2], 10);
        year = parseInt(match[3], 10);
      }

      const date = new Date(year, month, day);
      
      // Validate the date
      if (
        date.getFullYear() === year &&
        date.getMonth() === month &&
        date.getDate() === day
      ) {
        return date;
      }
    }
  }

  // Try natural language parsing (e.g., "January 15, 2024")
  const naturalDate = new Date(input);
  if (!isNaN(naturalDate.getTime())) {
    return naturalDate;
  }

  return null;
}