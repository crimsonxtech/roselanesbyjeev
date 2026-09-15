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
       * globals.css sets `html { overflow-y: scroll }` permanently, so a
       * scrollbar track is always reserved even here. Hide it while
       * locked, but compensate with matching padding-right on html so the
       * document's clientWidth doesn't change — an uncompensated removal
       * would shift all fixed-position centering (including the
       * lightbox's own open/close flight animation) by the scrollbar's
       * width for as long as the lock is active.
       */
      const scrollbarWidth = window.innerWidth - html.clientWidth;
      savedHtmlOverflowY = html.style.overflowY;
      savedHtmlPaddingRight = html.style.paddingRight;
      html.style.overflowY = "hidden";
      if (scrollbarWidth > 0) {
        html.style.paddingRight = `${scrollbarWidth}px`;
      }

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
        html.style.overflowY = savedHtmlOverflowY;
        html.style.paddingRight = savedHtmlPaddingRight;

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
let savedHtmlOverflowY = "";
let savedHtmlPaddingRight = "";