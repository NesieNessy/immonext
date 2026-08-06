"use client";

import type { ReactNode } from 'react';

/**
 * Marks its children to escape `PropertyValuationLayout`'s animated
 * step-transition wrapper.
 *
 * That wrapper sets `will-change: transform` on the page content for the
 * step-enter animation. Per the CSS spec, `will-change: transform` makes an
 * element a containing block for its `position: fixed` descendants, exactly
 * as an actual `transform` would — so a modal using `fixed inset-0` inside
 * it is anchored to that (scrolling, sub-viewport-sized) wrapper instead of
 * the browser window. It neither stays centered on screen nor covers the
 * top navigation bar, which sits outside the wrapper entirely.
 *
 * `PropertyValuationLayout` recognizes this component by identity (the same
 * way it already singles out `StickyActionBar`) and renders it as a direct
 * sibling of the animated wrapper, where `position: fixed` means what it
 * says. Wrap any modal/overlay rendered from a detail-check step page in
 * this — a plain `fixed inset-0` div left unwrapped will silently break
 * the same way this one did.
 */
export function FixedOverlay({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
