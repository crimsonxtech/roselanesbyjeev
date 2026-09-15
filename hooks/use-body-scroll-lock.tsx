"use client";

import * as React from "react";

/**
 * Locks page scroll while `active` is true — safe for iOS Safari.
 *
 * `body.style.overflow = "hidden"` alone does NOT stop scrolling on iOS
 * Safari: the page can still be dragged via touch (rubber-band/bounce),
 * and because Safari's address bar grows/shrinks as you scroll, the
 * layout viewport height changes mid-gesture and briefly reveals the
 * page underneath a fixed-position overlay.
 *
 * This hook uses the standard workaround: freeze the body in place with
 * `position: fixed` (so there is nothing left to scroll or reflow), and
 * restore the exact scroll position on unlock. It also blocks stray
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

    const { body, documentElement: html } = document;

    lockCount += 1;

    if (lockCount === 1) {
      savedScrollY = window.scrollY || window.pageYOffset || 0;

      /*
       * Usually a no-op here: portfolio-section.tsx calls
       * lockScrollbarReservation() itself, synchronously, before this
       * effect ever runs (see that function's doc comment for why the
       * timing matters). This call exists so OTHER, simpler consumers of
       * this hook get the same scrollbar-hiding behavior automatically,
       * without needing to know about the synchronous-timing subtlety.
       */
      lockScrollbarReservation();

      body.style.position = "fixed";
      body.style.top = `-${savedScrollY}px`;
      body.style.left = "0";
      body.style.right = "0";
      body.style.width = "100%";
      body.style.overflow = "hidden";

      // Defense in depth: stop overscroll/rubber-band chaining even if
      // something manages to move outside the fixed body (e.g. during
      // the brief window while Safari animates its toolbar).
      html.style.overscrollBehaviorY = "none";
      (body.style as CSSStyleDeclaration).overscrollBehaviorY = "none";
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
        body.style.position = "";
        body.style.top = "";
        body.style.left = "";
        body.style.right = "";
        body.style.width = "";
        body.style.overflow = "";
        html.style.overscrollBehaviorY = "";
        (body.style as CSSStyleDeclaration).overscrollBehaviorY = "";
        unlockScrollbarReservation();

        // The site enables smooth anchor scrolling globally. Unlocking a
        // modal must restore its saved position immediately, otherwise the
        // browser visibly scrolls from the top before the page settles.
        const previousScrollBehavior = html.style.scrollBehavior;
        html.style.scrollBehavior = "auto";
        window.scrollTo(0, savedScrollY);
        html.style.scrollBehavior = previousScrollBehavior;
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
let savedHtmlOverflowY = "";
let savedHtmlPaddingRight = "";

/**
 * Hides the permanently-reserved page scrollbar (`html { overflow-y: scroll
 * }` in globals.css) and compensates with matching padding-right so
 * normal-flow content doesn't shift. Counter-based/idempotent, so it's safe
 * to call this directly and eagerly, in addition to useBodyScrollLock below
 * also calling it from its effect for the same logical lock.
 *
 * Calling this SYNCHRONOUSLY, before any code measures or computes against
 * the viewport width, matters: position:fixed elements ignore this
 * function's padding-right compensation (fixed elements size against the
 * true viewport, not html's padding box), so the instant the scrollbar
 * disappears, fixed content immediately grows into the freed space. Any
 * viewport-width math computed before this runs (e.g. a FLIP animation's
 * landing rect) will target the OLD, narrower width and land to the left
 * of where fixed content actually ends up once this has taken effect.
 */
export function lockScrollbarReservation() {
  scrollbarLockCount += 1;
  if (scrollbarLockCount !== 1) return;

  const html = document.documentElement;
  const scrollbarWidth = window.innerWidth - html.clientWidth;
  savedHtmlOverflowY = html.style.overflowY;
  savedHtmlPaddingRight = html.style.paddingRight;
  html.style.overflowY = "hidden";
  if (scrollbarWidth > 0) {
    html.style.paddingRight = `${scrollbarWidth}px`;
  }
}

export function unlockScrollbarReservation() {
  scrollbarLockCount = Math.max(0, scrollbarLockCount - 1);
  if (scrollbarLockCount !== 0) return;

  const html = document.documentElement;
  html.style.overflowY = savedHtmlOverflowY;
  html.style.paddingRight = savedHtmlPaddingRight;
}