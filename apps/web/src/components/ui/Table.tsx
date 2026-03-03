"use client";

import { Icons } from "@/components/common";
import { cn } from "@/lib/utils";
import React from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SortDirection = "asc" | "desc" | null;

export interface TableColumn<T = Record<string, unknown>> {
  key: string;
  label: string;
  width?: string;
  sortable?: boolean;
  /** Show a filter input below this column header */
  filterable?: boolean;
  /** Custom cell renderer. Receives the raw value and the full row object. */
  renderCell?: (value: unknown, row: T) => React.ReactNode;
  /** Alignment for header + cells */
  align?: "left" | "center" | "right";
}

/** @deprecated Use TableColumn instead */
interface Column {
  key: string;
  label: string;
  width?: string;
  editable?: boolean;
  type?: "text" | "number" | "select";
  options?: { value: string; label: string }[];
}

export interface TableProps<T extends Record<string, unknown> = Record<string, unknown>> {
  columns: TableColumn<T>[];
  data: T[];
  /** Enables checkbox column */
  selectable?: boolean;
  selectedIds?: Set<string | number>;
  getRowId?: (row: T) => string | number;
  onSelectionChange?: (ids: Set<string | number>) => void;
  /** Row click handler */
  onRowClick?: (row: T, index: number) => void;
  /** Sort state */
  sortKey?: string;
  sortDirection?: SortDirection;
  onSort?: (key: string) => void;
  /** Per-column filter values: { [columnKey]: filterString } */
  columnFilters?: Record<string, string>;
  onColumnFilterChange?: (key: string, value: string) => void;
  /** Footer left text, e.g. "5 Einträge" */
  footerLeft?: React.ReactNode;
  /** Footer right text */
  footerRight?: React.ReactNode;
  /** Show footer bar — defaults to true */
  showFooter?: boolean;
  /** Optional extra class names per row — receives the row object and index */
  getRowClassName?: (row: T, index: number) => string | undefined;
  className?: string;
  emptyMessage?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function SortIcon({
  columnKey,
  sortKey,
  sortDirection,
}: {
  columnKey: string;
  sortKey?: string;
  sortDirection?: SortDirection;
}) {
  if (sortKey !== columnKey || !sortDirection) {
    return <Icons.ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />;
  }
  return sortDirection === "asc" ? (
    <Icons.ChevronUp className="w-3.5 h-3.5 shrink-0" />
  ) : (
    <Icons.ChevronDown className="w-3.5 h-3.5 shrink-0" />
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Table<T extends Record<string, unknown> = Record<string, unknown>>({
  columns,
  data,
  selectable = false,
  selectedIds,
  getRowId,
  onSelectionChange,
  onRowClick,
  sortKey,
  sortDirection,
  onSort,
  columnFilters = {},
  onColumnFilterChange,
  footerLeft,
  footerRight,
  showFooter = true,
  className,
  emptyMessage = "Keine Einträge vorhanden.",
  getRowClassName,
}: TableProps<T>) {

  const hasFilterRow = columns.some((c) => c.filterable);

  // ── Checkbox helpers ──────────────────────────────────────────────────
  const allSelected =
    data.length > 0 && selectedIds && getRowId
      ? data.every((row) => selectedIds.has(getRowId(row)))
      : false;

  const someSelected =
    !allSelected && selectedIds && getRowId
      ? data.some((row) => selectedIds.has(getRowId(row)))
      : false;

  const toggleAll = () => {
    if (!onSelectionChange || !getRowId) return;
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(data.map((row) => getRowId(row))));
    }
  };

  const toggleRow = (row: T) => {
    if (!onSelectionChange || !getRowId || !selectedIds) return;
    const id = getRowId(row);
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectionChange(next);
  };

  const isSelected = (row: T) =>
    selectable && selectedIds && getRowId ? selectedIds.has(getRowId(row)) : false;

  // ── Alignment helper ──────────────────────────────────────────────────
  const alignClass = (align?: "left" | "center" | "right") => {
    if (align === "center") return "text-center";
    if (align === "right") return "text-right";
    return "text-left";
  };

  return (
    <div className={cn("w-full flex flex-col border border-border rounded-xl overflow-hidden", className)}>
      {/* ── Scrollable table area ────────────────────────────────────── */}
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            {/* ── Sort / label row ──────────────────────────────────── */}
            <tr className="bg-[hsl(var(--foreground))] text-[hsl(var(--background))]">
              {selectable && (
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={toggleAll}
                    aria-label="Alle auswählen"
                    className="w-4 h-4 rounded border-white/40 accent-white cursor-pointer"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={cn(
                    "px-4 py-3 text-sm font-semibold whitespace-nowrap",
                    alignClass(col.align),
                    col.sortable &&
                      "cursor-pointer select-none hover:opacity-80 transition-opacity"
                  )}
                  onClick={() => col.sortable && onSort?.(col.key)}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {col.label}
                    {col.sortable && (
                      <SortIcon
                        columnKey={col.key}
                        sortKey={sortKey}
                        sortDirection={sortDirection}
                      />
                    )}
                  </span>
                </th>
              ))}
            </tr>

            {/* ── Filter row — only rendered if at least one column has filterable ── */}
            {hasFilterRow && (
              <tr className="bg-muted/60 border-b border-border">
                {selectable && <th className="w-12 px-4 py-2" />}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn("px-2 py-2", alignClass(col.align))}
                  >
                    {col.filterable ? (
                      <div className="relative">
                        <input
                          type="text"
                          value={columnFilters[col.key] ?? ""}
                          onChange={(e) =>
                            onColumnFilterChange?.(col.key, e.target.value)
                          }
                          placeholder="Filter…"
                          className={cn(
                            "w-full px-2 py-1 pr-6 text-xs bg-background border border-border rounded-md",
                            "focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary",
                            "text-foreground placeholder:text-muted-foreground transition-colors"
                          )}
                          onClick={(e) => e.stopPropagation()}
                        />
                        {columnFilters[col.key] && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onColumnFilterChange?.(col.key, "");
                            }}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            aria-label="Filter leeren"
                          >
                            <Icons.Close className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ) : null}
                  </th>
                ))}
              </tr>
            )}
          </thead>

          {/* ── Body ──────────────────────────────────────────────── */}
          <tbody className="bg-card divide-y divide-border">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-4 py-10 text-center text-sm text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={cn(
                    "transition-colors",
                    isSelected(row) && "bg-primary/5",
                    onRowClick && "cursor-pointer hover:bg-muted/50",
                    getRowClassName?.(row, rowIndex)
                  )}
                  onClick={() => onRowClick?.(row, rowIndex)}
                >
                  {selectable && (
                    <td
                      className="w-12 px-4 py-4"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRow(row);
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected(row)}
                        onChange={() => toggleRow(row)}
                        aria-label="Zeile auswählen"
                        className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                      />
                    </td>
                  )}
                  {columns.map((col) => {
                    const raw = row[col.key];
                    return (
                      <td
                        key={col.key}
                        className={cn(
                          "px-4 py-4 text-sm text-foreground whitespace-nowrap",
                          alignClass(col.align)
                        )}
                      >
                        {col.renderCell ? col.renderCell(raw, row) : String(raw ?? "—")}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      {showFooter && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-card text-xs text-muted-foreground">
          <span>{footerLeft}</span>
          <span>{footerRight}</span>
        </div>
      )}
    </div>
  );
}
