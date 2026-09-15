"use client";

import * as React from "react";

/**
 * Site-wide interaction guard.
 *
 * - Disables the right-click / long-press context menu, so "Save Image As",
 *   "Copy Image", "Inspect", etc. aren't offered on the page. Form fields
 *   (input / textarea / contenteditable) are left alone so paste-via-
 *   right-click still works while filling out the quote/contact forms.
 * - Disables manual zoom: ctrl/cmd + mouse-wheel or trackpad pinch,
 *   ctrl/cmd + "+" / "-" / "=" / "0", and Safari's native pinch
 *   gesture events (gesturestart/gesturechange).
 *
 * This only stops *manual* zoom gestures. Pair it with a viewport meta
 * tag (see below) so mobile browsers don't offer pinch-zoom either.
 *
 * Mount this once near the root of the app, e.g. in app/layout.tsx:
 *
 *   import { DisableInteractions } from "@/components/disable-interactions";
 *   ...
 *   <body>
 *     <DisableInteractions />
 *     {children}
 *   </body>
 *
 * It renders nothing.
 */
export function DisableInteractions() {
  React.useEffect(() => {
    const isFormField = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      return (
        target.closest("input, textarea, [contenteditable='true']") !== null
      );
    };

    const preventContextMenu = (event: MouseEvent) => {
      if (isFormField(event.target)) return;
      event.preventDefault();
    };

    const preventCtrlWheelZoom = (event: WheelEvent) => {
      if (event.ctrlKey) {
        event.preventDefault();
      }
    };

    const preventZoomShortcuts = (event: KeyboardEvent) => {
      const isModifier = event.ctrlKey || event.metaKey;
      if (isModifier && ["+", "-", "=", "_", "0"].includes(event.key)) {
        event.preventDefault();
      }
    };

    // Safari / iOS emit these non-standard gesture events for
    // trackpad and touchscreen pinch — this is what actually
    // stops pinch-zoom on iOS Safari.
    const preventGestureZoom = (event: Event) => {
      event.preventDefault();
    };

    document.addEventListener("contextmenu", preventContextMenu);
    window.addEventListener("wheel", preventCtrlWheelZoom, {
      passive: false,
    });
    window.addEventListener("keydown", preventZoomShortcuts);
    document.addEventListener(
      "gesturestart",
      preventGestureZoom as EventListener
    );
    document.addEventListener(
      "gesturechange",
      preventGestureZoom as EventListener
    );

    return () => {
      document.removeEventListener("contextmenu", preventContextMenu);
      window.removeEventListener("wheel", preventCtrlWheelZoom);
      window.removeEventListener("keydown", preventZoomShortcuts);
      document.removeEventListener(
        "gesturestart",
        preventGestureZoom as EventListener
      );
      document.removeEventListener(
        "gesturechange",
        preventGestureZoom as EventListener
      );
    };
  }, []);

  return null;
}

export default DisableInteractions;