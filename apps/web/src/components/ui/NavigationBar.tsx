"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronDown, Home, LogOut, Menu, Network, Search, Settings, User, X } from "lucide-react";
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
  logout: LogOut,
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
  href?: string;
  active?: boolean;
}

export function NavigationBar({ items, logo, actions }: NavigationBarProps) {
  const [openDropdown, setOpenDropdown] = React.useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [mobileExpanded, setMobileExpanded] = React.useState<number | null>(null);

  // When the drawer opens, auto-expand whichever group contains the active page.
  React.useEffect(() => {
    if (!mobileMenuOpen) return;
    const activeIndex = items.findIndex((item) => item.active && item.subItems?.length);
    setMobileExpanded(activeIndex >= 0 ? activeIndex : null);
  }, [mobileMenuOpen, items]);

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
            <div className="hidden md:flex items-center gap-1">
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
          <div className="flex items-center gap-2">
            {actions && actions.length > 0 && actions.map((action, index) => (
              <div key={index} className="relative">
                {action.href ? (
                  <Link
                    href={action.href}
                    aria-label={action.ariaLabel}
                    className={cn(
                      "p-2 rounded-lg transition-colors block",
                      action.active
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    {action.iconName && React.createElement(iconMap[action.iconName], {
                      size: 20,
                      className: action.active ? "" : "text-primary"
                    })}
                  </Link>
                ) : (
                  <button
                    onClick={action.onClick}
                    aria-label={action.ariaLabel}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      action.active
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    {action.iconName && React.createElement(iconMap[action.iconName], {
                      size: 20,
                      className: action.active ? "" : "text-primary"
                    })}
                  </button>
                )}
              </div>
            ))}

            {/* Mobile-only hamburger — reveals `items` in a right-side drawer */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Navigation öffnen"
              className="md:hidden p-2 rounded-lg transition-colors hover:bg-muted"
            >
              <Menu size={20} className="text-primary" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-card shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-border">
              <span className="text-lg font-semibold text-foreground">Navigation</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Navigation schließen"
                className="p-2 rounded-full border border-border hover:bg-muted transition-colors"
              >
                <X size={18} className="text-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
              {logo && (
                <Link
                  href={logo.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border hover:bg-muted transition-colors"
                >
                  {logo.iconName && React.createElement(iconMap[logo.iconName], { size: 20, className: "text-primary" })}
                  <span className="font-medium text-foreground">{logo.text}</span>
                </Link>
              )}

              {items.map((item, index) => {
                const Icon = item.iconName ? iconMap[item.iconName] : null;
                const hasSubItems = item.subItems && item.subItems.length > 0;

                if (hasSubItems) {
                  const isExpanded = mobileExpanded === index;
                  return (
                    <div key={index} className="flex flex-col gap-1">
                      <button
                        onClick={() => setMobileExpanded(isExpanded ? null : index)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-xl border border-border transition-colors cursor-pointer",
                          item.active ? "bg-muted" : "hover:bg-muted"
                        )}
                      >
                        {Icon && <Icon size={20} className="text-primary" />}
                        <span className="flex-1 text-left font-medium text-foreground">{item.label}</span>
                        <ChevronDown size={16} className={cn("transition-transform", isExpanded && "rotate-180")} />
                      </button>
                      {isExpanded && (
                        <div className="flex flex-col gap-1">
                          {item.subItems!.map((subItem, subIndex) => {
                            const SubIcon = subItem.iconName ? iconMap[subItem.iconName] : null;
                            const subContent = (
                              <>
                                {SubIcon && <SubIcon size={18} className="text-primary" />}
                                <span className="font-medium text-foreground">{subItem.label}</span>
                              </>
                            );
                            return subItem.href ? (
                              <Link
                                key={subIndex}
                                href={subItem.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-accent/15 hover:bg-accent/25 transition-colors"
                              >
                                {subContent}
                              </Link>
                            ) : (
                              <button
                                key={subIndex}
                                onClick={() => {
                                  subItem.onClick?.();
                                  setMobileMenuOpen(false);
                                }}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-accent/15 hover:bg-accent/25 transition-colors text-left cursor-pointer"
                              >
                                {subContent}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                const content = (
                  <>
                    {Icon && <Icon size={20} className={item.active ? "" : "text-primary"} />}
                    <span className="font-medium">{item.label}</span>
                  </>
                );

                return item.href ? (
                  <Link
                    key={index}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl border border-border transition-colors",
                      item.active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    )}
                  >
                    {content}
                  </Link>
                ) : (
                  <button
                    key={index}
                    onClick={() => {
                      item.onClick?.();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border hover:bg-muted transition-colors text-left cursor-pointer"
                  >
                    {content}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
