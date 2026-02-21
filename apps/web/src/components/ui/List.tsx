import React from "react";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

interface ListItem {
  id: string | number;
  content: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
}

interface ListProps {
  items: ListItem[];
  className?: string;
  onAddItem?: (value: string) => void;
  addButtonText?: string;
  addInputPlaceholder?: string;
  showAddButton?: boolean;
}

export function List({ 
  items, 
  className, 
  onAddItem, 
  addButtonText = "Add Item",
  addInputPlaceholder = "Enter new item...",
  showAddButton = false 
}: ListProps) {
  const [isAdding, setIsAdding] = React.useState(false);
  const [newItemValue, setNewItemValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const handleAddClick = () => {
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setNewItemValue("");
  };

  const handleSave = () => {
    if (newItemValue.trim() && onAddItem) {
      onAddItem(newItemValue.trim());
      setNewItemValue("");
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <div className={cn("w-full border border-border rounded-lg divide-y divide-border", className)}>
      {items.map((item) => (
        <div
          key={item.id}
          onClick={item.onClick}
          className={cn(
            "px-4 py-3 flex items-center gap-3 bg-card transition-colors",
            item.onClick && "cursor-pointer hover:bg-muted/50"
          )}
        >
          {item.icon && (
            <div className="flex-shrink-0 text-muted-foreground">
              {item.icon}
            </div>
          )}
          <div className="flex-1">{item.content}</div>
        </div>
      ))}
      
      {showAddButton && (
        <>
          {isAdding ? (
            <div className="px-4 py-3 flex items-center gap-3 bg-card">
              <input
                ref={inputRef}
                type="text"
                value={newItemValue}
                onChange={(e) => setNewItemValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={addInputPlaceholder}
                className="flex-1 px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
              <button
                onClick={handleSave}
                disabled={!newItemValue.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Add
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddClick}
              className="w-full px-4 py-3 flex items-center justify-center gap-2 bg-card hover:bg-muted/50 transition-colors text-primary cursor-pointer"
            >
              <Plus size={20} />
              <span>{addButtonText}</span>
            </button>
          )}
        </>
      )}
    </div>
  );
}
