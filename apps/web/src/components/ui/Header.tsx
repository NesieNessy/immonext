import { Icons } from "@/components/common";
import { cn } from "@/lib/utils";
import Link from "next/link";
import React from "react";

export interface BreadcrumbItem {
  label: string;
  /** Omit for the current page (rendered bold, not a link) and for
   *  ancestor segments that have no single natural destination. */
  href?: string;
  /** Intercept the click (e.g. to confirm discarding unsaved changes)
   *  before the Link navigates. Call `e.preventDefault()` to stop it. */
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

interface HeaderProps {
  items: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

function HeaderContent({ items, actions, className }: HeaderProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div className="flex items-center gap-3 min-w-0">
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
                    onClick={item.onClick}
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

/**
 * The single source of truth for the gap between the breadcrumb and the
 * page content below it — pages used to each hand-roll their own `mt-*` on
 * their first content div (values drifted between mt-3/mt-6/mt-8 across the
 * app). Change this one constant instead of touching every page.
 */
const CONTENT_GAP = "pb-4";

/**
 * The single source of truth for every page's top-level `<main>` container —
 * pages used to each hand-roll `"container mx-auto px-4 py-8"` (or slight
 * variants) themselves. All vertical spacing around the breadcrumb now comes
 * from Header's own padding above, so this is horizontal-only; change this
 * one constant instead of touching every page's `<main>`.
 */
export const PAGE_CONTAINER_CLASS = "container mx-auto px-4";

/**
 * Pinned right below the (also fixed) nav bar so the breadcrumb never
 * scrolls away, using the same fixed-positioning approach as
 * StickyActionBar at the bottom — not `position: sticky`, which depends on
 * getting the nearest scrolling ancestor exactly right and broke across the
 * app's varied per-page layouts. The invisible first copy is a spacer: it
 * reserves the real (content-dependent, possibly wrapped) height of the
 * bar in normal document flow so page content doesn't start underneath it.
 */
export function Header(props: HeaderProps) {
  return (
    <>
      {/* No container/px-4 here — the page's own <main> (also `.container
          px-4`) already provides that width, and matching it exactly (not
          nesting another layer of the same padding) keeps this spacer's
          text-wrapping, and therefore its height, identical to the fixed
          bar below. */}
      <div className={cn("invisible pt-3", CONTENT_GAP)} aria-hidden="true">
        <HeaderContent {...props} />
      </div>
      <div className="fixed top-16 inset-x-0 z-30 bg-background">
        <div className={cn(PAGE_CONTAINER_CLASS, "pt-3", CONTENT_GAP)}>
          <HeaderContent {...props} />
        </div>
      </div>
    </>
  );
}
