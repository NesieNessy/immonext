import React from "react";
import { cn } from "@/lib/utils";
import { Check, X, Edit2 } from "lucide-react";

interface Column {
  key: string;
  label: string;
  width?: string;
  editable?: boolean;
  type?: "text" | "number" | "select";
  options?: { value: string; label: string }[];
}

interface TableProps {
  columns: Column[];
  data: Record<string, any>[];
  onRowClick?: (row: Record<string, any>, index: number) => void;
  onCellEdit?: (rowIndex: number, columnKey: string, newValue: any) => void;
  editable?: boolean;
  className?: string;
}

export function Table({ columns, data, onRowClick, onCellEdit, editable = false, className }: TableProps) {
  const [editingCell, setEditingCell] = React.useState<{ rowIndex: number; columnKey: string } | null>(null);
  const [editValue, setEditValue] = React.useState<string>("");

  const startEditing = (rowIndex: number, columnKey: string, currentValue: any) => {
    setEditingCell({ rowIndex, columnKey });
    setEditValue(String(currentValue || ""));
  };

  const cancelEditing = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const saveEditing = () => {
    if (editingCell && onCellEdit) {
      const column = columns.find(col => col.key === editingCell.columnKey);
      let finalValue: any = editValue;
      
      if (column?.type === "number") {
        finalValue = parseFloat(editValue) || 0;
      }
      
      onCellEdit(editingCell.rowIndex, editingCell.columnKey, finalValue);
    }
    setEditingCell(null);
    setEditValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      saveEditing();
    } else if (e.key === "Escape") {
      cancelEditing();
    }
  };

  const isEditing = (rowIndex: number, columnKey: string) => {
    return editingCell?.rowIndex === rowIndex && editingCell?.columnKey === columnKey;
  };

  return (
    <div className={cn("w-full overflow-x-auto border border-border rounded-lg", className)}>
      <table className="w-full">
        <thead className="bg-muted">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                style={{ width: column.width }}
                className="px-6 py-3 text-left text-sm font-medium text-foreground"
              >
                {column.label}
                {editable && column.editable && (
                  <Edit2 size={12} className="inline-block ml-2 text-muted-foreground" />
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-card divide-y divide-border">
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={cn(
                "transition-colors",
                onRowClick && !editable && "cursor-pointer hover:bg-muted/50"
              )}
            >
              {columns.map((column) => {
                const isCurrentlyEditing = isEditing(rowIndex, column.key);
                const isColumnEditable = editable && column.editable;

                return (
                  <td
                    key={column.key}
                    className={cn(
                      "px-6 py-4 text-sm text-foreground",
                      isColumnEditable && "group relative"
                    )}
                    onClick={() => {
                      if (!isColumnEditable) {
                        onRowClick?.(row, rowIndex);
                      }
                    }}
                  >
                    {isCurrentlyEditing ? (
                      <div className="flex items-center gap-2">
                        {column.type === "select" && column.options ? (
                          <select
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            className="flex-1 px-2 py-1 border border-primary rounded focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                          >
                            {column.options.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={column.type === "number" ? "number" : "text"}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            className="flex-1 px-2 py-1 border border-primary rounded focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                          />
                        )}
                        <button
                          onClick={saveEditing}
                          className="p-1 rounded hover:bg-secondary/20 text-secondary transition-colors cursor-pointer"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="p-1 rounded hover:bg-destructive/20 text-destructive transition-colors cursor-pointer"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span>{row[column.key]}</span>
                        {isColumnEditable && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditing(rowIndex, column.key, row[column.key]);
                            }}
                            className="opacity-0 group-hover:opacity-100 ml-2 p-1 rounded hover:bg-primary/20 text-primary transition-all cursor-pointer"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
