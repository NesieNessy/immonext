"use client";

import * as React from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";

// Simple button variant styles
const buttonVariants = (props: { variant?: string }) => {
  const base = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50";
  if (props.variant === "outline") return `${base} border border-input bg-background hover:bg-accent hover:text-accent-foreground`;
  if (props.variant === "ghost") return `${base} hover:bg-accent hover:text-accent-foreground`;
  return base;
};

const currentYear = new Date().getFullYear();

// react-day-picker v9 renamed almost every classNames key from v8 (e.g.
// head_row -> weekdays, cell -> day, day -> day_button, day_selected ->
// selected as a modifier on the cell, not the button) — this component was
// still using the old v8 key names, which DayPicker silently ignored, so the
// calendar rendered with none of its intended layout/selection styling.
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "dropdown",
  startMonth = new Date(currentYear - 100, 0),
  endMonth = new Date(currentYear + 15, 11),
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      startMonth={startMonth}
      endMonth={endMonth}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-4",
        month_caption: "flex justify-center pt-1 relative items-center w-full",
        caption_label: "flex items-center gap-1 rounded-md px-1.5 py-0.5 text-sm font-medium hover:bg-muted select-none",
        dropdowns: "flex items-center gap-1.5",
        dropdown_root: "relative inline-flex items-center",
        dropdown: "absolute inset-0 z-10 opacity-0 cursor-pointer",
        months_dropdown: "text-sm font-medium",
        years_dropdown: "text-sm font-medium",
        nav: "flex items-center justify-between absolute inset-x-1 top-1",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-50 hover:opacity-100",
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-50 hover:opacity-100",
        ),
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
        week: "flex w-full mt-2",
        day: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
          "[&.range_end]:rounded-r-md [&.range_start]:rounded-l-md [&.selected]:rounded-md",
          props.mode === "range" && "[&.range_middle]:rounded-none",
        ),
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-8 p-0 font-normal aria-selected:opacity-100",
        ),
        range_start: "range_start [&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground",
        range_end: "range_end [&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground",
        range_middle: "range_middle [&>button]:bg-accent [&>button]:text-accent-foreground",
        selected: "selected [&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground [&>button]:focus:bg-primary [&>button]:focus:text-primary-foreground",
        today: "[&>button]:bg-accent [&>button]:text-accent-foreground",
        outside: "text-muted-foreground [&>button]:text-muted-foreground",
        disabled: "text-muted-foreground opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }: { orientation?: string }) => {
          // Also used (with orientation="down") for the month/year dropdown
          // triggers, not just the prev/next nav buttons — previously always
          // rendered a right-pointing arrow there since only "left" was handled.
          if (orientation === "left") return <ChevronLeft className="size-4" />;
          if (orientation === "down") return <ChevronDown className="size-4" />;
          return <ChevronRight className="size-4" />;
        },
      }}
      {...props}
    />
  );
}

export { Calendar };
