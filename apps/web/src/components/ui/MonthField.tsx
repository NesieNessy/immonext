"use client";

import { CalendarDays, X } from "lucide-react";

const MONTH_OPTIONS = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];
const CURRENT_YEAR = new Date().getFullYear();
const MONTH_FIELD_YEARS = Array.from({ length: 6 }, (_, index) => CURRENT_YEAR + index);

interface MonthFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helperText?: string;
  optional?: boolean;
}

export function MonthField({
  label,
  value,
  onChange,
  error,
  helperText,
  optional = false,
}: MonthFieldProps) {
  const [selectedYear = "", selectedMonth = ""] = value.split("-");
  const updatePart = (part: "month" | "year", nextValue: string) => {
    if (!nextValue) {
      onChange("");
      return;
    }
    const nextYear = part === "year" ? nextValue : selectedYear || String(new Date().getFullYear());
    const nextMonth = part === "month" ? nextValue : selectedMonth || "01";
    onChange(`${nextYear}-${nextMonth}`);
  };

  return (
    <div className="w-full">
      <label className="mb-2 block text-sm font-medium text-foreground">{label}</label>
      <div className={`flex min-h-10 items-center rounded-md border-2 bg-card shadow-sm transition-[border-color,box-shadow] focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 ${error ? "border-destructive" : "border-primary/30 hover:border-primary/55"}`}>
        <CalendarDays className="ml-3 shrink-0 text-muted-foreground" size={17} aria-hidden="true" />
        <select
          aria-label={`${label}: Monat`}
          className="min-w-0 flex-1 appearance-none bg-transparent px-2 py-2 text-foreground outline-none"
          value={selectedMonth}
          onChange={(event) => updatePart("month", event.target.value)}
        >
          <option value="">Monat</option>
          {MONTH_OPTIONS.map((month, index) => (
            <option key={month} value={String(index + 1).padStart(2, "0")}>{month}</option>
          ))}
        </select>
        <div className="h-6 w-px bg-border" aria-hidden="true" />
        <select
          aria-label={`${label}: Jahr`}
          className="w-20 appearance-none bg-transparent px-2 py-2 text-foreground outline-none"
          value={selectedYear}
          onChange={(event) => updatePart("year", event.target.value)}
        >
          <option value="">Jahr</option>
          {MONTH_FIELD_YEARS.map((year) => <option key={year} value={year}>{year}</option>)}
        </select>
        {optional && value && (
          <button
            type="button"
            className="mr-1 grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Monatsangabe löschen"
            aria-label={`${label} löschen`}
            onClick={() => onChange("")}
          >
            <X size={16} />
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
      {helperText && !error && <p className="mt-1 text-sm text-muted-foreground">{helperText}</p>}
    </div>
  );
}
