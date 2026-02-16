import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon, ChevronDown } from "lucide-react";

interface SubNavItem {
  label: string;
  icon?: LucideIcon;
  onClick?: () => void;
  description?: string;
}

interface NavItem {
  label: string;
  icon?: LucideIcon;
  onClick?: () => void;
  active?: boolean;
  subItems?: SubNavItem[];
}

interface NavigationBarProps {
  items: NavItem[];
  logo?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function NavigationBar({ items, logo, actions, className }: NavigationBarProps) {
  const [openDropdown, setOpenDropdown] = React.useState<number | null>(null);

  return (
    <nav className={cn("w-full bg-card border-b border-border", className)}>
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            {logo && <div className="flex-shrink-0">{logo}</div>}
            <div className="flex items-center gap-1">
              {items.map((item, index) => {
                const Icon = item.icon;
                const hasSubItems = item.subItems && item.subItems.length > 0;
                const isOpen = openDropdown === index;

                return (
                  <div key={index} className="relative">
                    <button
                      onClick={() => {
                        if (hasSubItems) {
                          setOpenDropdown(isOpen ? null : index);
                        } else if (item.onClick) {
                          item.onClick();
                        }
                      }}
                      onMouseEnter={() => {
                        if (hasSubItems) {
                          setOpenDropdown(index);
                        }
                      }}
                      className={cn(
                        "px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 cursor-pointer",
                        item.active
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      {Icon && <Icon size={20} />}
                      <span>{item.label}</span>
                      {hasSubItems && <ChevronDown size={16} className={cn("transition-transform", isOpen && "rotate-180")} />}
                    </button>

                    {hasSubItems && isOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setOpenDropdown(null)}
                        />
                        <div
                          className="absolute left-0 top-full mt-2 w-64 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-20"
                          onMouseLeave={() => setOpenDropdown(null)}
                        >
                          {item.subItems!.map((subItem, subIndex) => {
                            const SubIcon = subItem.icon;
                            return (
                              <button
                                key={subIndex}
                                onClick={() => {
                                  if (subItem.onClick) {
                                    subItem.onClick();
                                  }
                                  setOpenDropdown(null);
                                }}
                                className="w-full px-4 py-3 flex items-start gap-3 hover:bg-muted transition-colors text-left cursor-pointer"
                              >
                                {SubIcon && (
                                  <SubIcon size={20} className="text-primary mt-0.5 flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-foreground">{subItem.label}</div>
                                  {subItem.description && (
                                    <div className="text-sm text-muted-foreground mt-0.5">{subItem.description}</div>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>
    </nav>
  );
}