import { Icons } from "@/components/common";
import { cn } from "@/lib/utils";
import Link from "next/link";
import React from "react";

export interface BreadcrumbItem {
  label: string;
  /** Omit for the current page (rendered bold, not a link) and for
   *  ancestor segments that have no single natural destination. */
  href?: string;
}

interface HeaderProps {
  items: BreadcrumbItem[];
  actions?: React.ReactNode;
  /** e.g. a small property thumbnail, shown before the breadcrumb trail. */
  image?: React.ReactNode;
  className?: string;
}

export function Header({ items, actions, image, className }: HeaderProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div className="flex items-center gap-3 min-w-0">
        {image}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 min-w-0 flex-wrap">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <React.Fragment key={index}>
                {index > 0 && (
                  <Icons.ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                )}
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors truncate"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className={cn(
                      "truncate",
                      isLast ? "text-lg font-semibold text-foreground" : "text-sm text-muted-foreground"
                    )}
                  >
                    {item.label}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
