"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronDown, Home, Network, Search, Settings, User } from "lucide-react";
import { Icons } from "../common";

// Icon mapping
const iconMap = {
  home: Home,
  existingProperties: Icons.ExistingProperties,
  quickCheck: Icons.QuickCheck,
  detailCheck: Icons.DetailCheck,
  propertyValuation: Icons.PropertyValuation,
  documents: Icons.Documents,
  network: Network,
  settings: Settings,
  search: Search,
  user: User,
};

type IconName = keyof typeof iconMap;

interface Logo {
  iconName: IconName;
  text: string;
  href: string;
}

interface NavigationBarProps {
  items: NavItem[];
  logo?: Logo;
  actions?: ActionButton[];
}

interface NavItem {
  label: string;
  href?: string;
  iconName?: IconName;
  onClick?: () => void;
  active?: boolean;
  subItems?: SubNavItem[];
}

interface SubNavItem {
  label: string;
  href?: string;
  iconName?: IconName;
  onClick?: () => void;
}

interface ActionButton {
  iconName: IconName;
  onClick?: () => void;
  ariaLabel?: string;
}

export function NavigationBar({ items, logo, actions }: NavigationBarProps) {
  const [openDropdown, setOpenDropdown] = React.useState<number | null>(null);

  return (
    <nav className={cn("w-full bg-card border-b border-border")}>
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            {logo && (
              <Link href={logo.href} className="flex-shrink-0">
                <div className="flex items-center gap-2">
                  {logo.iconName && React.createElement(iconMap[logo.iconName], { size: 24, className: "text-primary" })}
                  <span className="text-xl font-bold text-foreground">{logo.text}</span>
                </div>
              </Link>
            )}
            <div className="flex items-center gap-1">
              {items.map((item, index) => {
                const Icon = item.iconName ? iconMap[item.iconName] : null;
                const hasSubItems = item.subItems && item.subItems.length > 0;
                const isOpen = openDropdown === index;

                return (
                  <div key={index} className="relative">
                    {hasSubItems || !item.href ? (
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
                        {Icon && <Icon size={20} className={item.active ? "" : "text-primary"} />}
                        <span>{item.label}</span>
                        {hasSubItems && <ChevronDown size={16} className={cn("transition-transform", isOpen && "rotate-180")} />}
                      </button>
                    ) : (
                      <Link
                        href={item.href || '#'}
                        className={cn(
                          "px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 cursor-pointer",
                          item.active
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground hover:bg-muted"
                        )}
                      >
                        {Icon && <Icon size={20} className={item.active ? "" : "text-primary"} />}
                        <span>{item.label}</span>
                      </Link>
                    )}

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
                            const SubIcon = subItem.iconName ? iconMap[subItem.iconName] : null;
                            const SubItemContent = (
                              <>
                                {SubIcon && (
                                  <SubIcon size={20} className="text-primary mt-0.5 flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-foreground">{subItem.label}</div>
                                </div>
                              </>
                            );

                            if (subItem.href) {
                              return (
                                <Link
                                  key={subIndex}
                                  href={subItem.href}
                                  onClick={() => setOpenDropdown(null)}
                                  className="w-full px-4 py-3 flex items-start gap-3 hover:bg-muted transition-colors text-left cursor-pointer"
                                >
                                  {SubItemContent}
                                </Link>
                              );
                            }

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
                                {SubItemContent}
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
          {actions && actions.length > 0 && (
            <div className="flex items-center gap-2">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  aria-label={action.ariaLabel}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  {action.iconName && React.createElement(iconMap[action.iconName], { size: 20, className: "text-primary" })}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}