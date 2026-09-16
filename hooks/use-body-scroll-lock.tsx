"use client";

import * as React from "react";

/**
 * Locks page scroll while `active` is true — safe for iOS Safari.
 *
 * All real scrolling happens inside `#scroll-root` (see layout.tsx),
 * not on `window`/`body` — those are pinned to one viewport and never
 * scroll. So locking now means: freeze `#scroll-root` in place with
 * `position: fixed` (so there is nothing left to scroll or reflow), and
 * restore its exact scroll position on unlock. It also blocks stray
 * `touchmove` events anywhere outside an allowed scrollable region, as a
 * second line of defense against overscroll chaining.
 *
 * Supports nesting (e.g. a lightbox opened while another modal is open)
 * via a shared lock counter, so the outer lock isn't released early.
 *
 * @param active     Whether the lock should be engaged.
 * @param allowedRef Optional ref to an element that should still be
 *                    scrollable/touchable while locked (e.g. the
 *                    lightbox's own scrollable panel, or a form inside
 *                    a modal). Touches inside it are left alone.
 */
export function useBodyScrollLock(
  active: boolean,
  allowedRef?: React.RefObject<HTMLElement | null>,
) {
  React.useEffect(() => {
    if (!active) return;

    const scrollRoot = document.getElementById("scroll-root");
    const html = document.documentElement;

    if (!scrollRoot) return;

    lockCount += 1;

    if (lockCount === 1) {
      savedScrollY = scrollRoot.scrollTop || 0;

      /*
       * Usually a no-op here: portfolio-section.tsx calls
       * lockScrollbarReservation() itself, synchronously, before this
       * effect ever runs (see that function's doc comment for why the
       * timing matters). This call exists so OTHER, simpler consumers of
       * this hook get the same scrollbar-hiding behavior automatically,
       * without needing to know about the synchronous-timing subtlety.
       */
      lockScrollbarReservation();

      scrollRoot.style.position = "fixed";
      scrollRoot.style.top = `-${savedScrollY}px`;
      scrollRoot.style.left = "0";
      scrollRoot.style.right = "0";
      scrollRoot.style.width = "100%";
      scrollRoot.style.overflow = "hidden";

      // Defense in depth: stop overscroll/rubber-band chaining even if
      // something manages to move outside the fixed scroll root (e.g.
      // during the brief window while Safari animates its toolbar).
      html.style.overscrollBehaviorY = "none";
      (scrollRoot.style as CSSStyleDeclaration).overscrollBehaviorY = "none";
    }

    const preventBackgroundTouchMove = (event: TouchEvent) => {
      const target = event.target as Node;
      const allowedEl = allowedRef?.current;

      if (allowedEl && allowedEl.contains(target)) {
        // Let the designated scrollable area handle its own touches.
        return;
      }

      // Radix (Select, Popover, DropdownMenu, ...) portals its content
      // straight to <body> via SelectPrimitive.Portal, so it lives
      // outside allowedRef's subtree even though it's visually part of
      // the modal. Without this, swiping inside an open Select's
      // dropdown gets blocked by this same lock on any touch browser
      // (not just iOS) — the wheel-based desktop path never hits this
      // listener, which is why it "only breaks on mobile".
      if (
        target instanceof Element &&
        target.closest("[data-radix-popper-content-wrapper]")
      ) {
        return;
      }

      event.preventDefault();
    };

    document.addEventListener("touchmove", preventBackgroundTouchMove, {
      passive: false,
    });

    return () => {
      document.removeEventListener("touchmove", preventBackgroundTouchMove);

      lockCount = Math.max(0, lockCount - 1);

      if (lockCount === 0) {
        scrollRoot.style.position = "";
        scrollRoot.style.top = "";
        scrollRoot.style.left = "";
        scrollRoot.style.right = "";
        scrollRoot.style.width = "";
        scrollRoot.style.overflow = "";
        html.style.overscrollBehaviorY = "";
        (scrollRoot.style as CSSStyleDeclaration).overscrollBehaviorY = "";
        unlockScrollbarReservation();

        // The site enables smooth anchor scrolling globally. Unlocking a
        // modal must restore its saved position immediately, otherwise the
        // browser visibly scrolls from the top before the page settles.
        const previousScrollBehavior = scrollRoot.style.scrollBehavior;
        scrollRoot.style.scrollBehavior = "auto";
        scrollRoot.scrollTop = savedScrollY;
        scrollRoot.style.scrollBehavior = previousScrollBehavior;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
}

// Module-level so multiple locks (nested modals) share one counter and
// only the outermost open/close actually touches the DOM/scroll position.
let lockCount = 0;
let savedScrollY = 0;

// A separate, dedicated counter for the scrollbar-reservation toggle below.
// Kept independent of lockCount so it can be engaged eagerly/synchronously
// (see lockScrollbarReservation) ahead of the React effect that normally
// drives this hook, without disturbing that effect's own bookkeeping.
let scrollbarLockCount = 0;
let savedScrollRootOverflowY = "";
let savedScrollRootPaddingRight = "";

/**
 * Hides #scroll-root's own scrollbar and compensates with matching
 * padding-right so normal-flow content doesn't shift. Counter-based/
 * idempotent, so it's safe to call this directly and eagerly, in
 * addition to useBodyScrollLock above also calling it from its effect
 * for the same logical lock.
 *
 * Calling this SYNCHRONOUSLY, before any code measures or computes
 * against the viewport width, matters: position:fixed elements ignore
 * this function's padding-right compensation (fixed elements size
 * against the true viewport, not #scroll-root's padding box), so the
 * instant the scrollbar disappears, fixed content immediately grows
 * into the freed space. Any viewport-width math computed before this
 * runs (e.g. a FLIP animation's landing rect) will target the OLD,
 * narrower width and land to the left of where fixed content actually
 * ends up once this has taken effect.
 */
export function lockScrollbarReservation() {
  scrollbarLockCount += 1;
  if (scrollbarLockCount !== 1) return;

  const scrollRoot = document.getElementById("scroll-root");
  if (!scrollRoot) return;

  const scrollbarWidth = scrollRoot.offsetWidth - scrollRoot.clientWidth;
  savedScrollRootOverflowY = scrollRoot.style.overflowY;
  savedScrollRootPaddingRight = scrollRoot.style.paddingRight;
  scrollRoot.style.overflowY = "hidden";
  if (scrollbarWidth > 0) {
    scrollRoot.style.paddingRight = `${scrollbarWidth}px`;
  }
}

export function unlockScrollbarReservation() {
  scrollbarLockCount = Math.max(0, scrollbarLockCount - 1);
  if (scrollbarLockCount !== 0) return;

  const scrollRoot = document.getElementById("scroll-root");
  if (!scrollRoot) return;

  scrollRoot.style.overflowY = savedScrollRootOverflowY;
  scrollRoot.style.paddingRight = savedScrollRootPaddingRight;
}