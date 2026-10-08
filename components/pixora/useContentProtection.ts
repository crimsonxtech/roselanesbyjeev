"use client";

import { useEffect } from "react";

// Casual deterrents from the original album.js: no right-click menu, no
// dragging images out, no text selection, and the usual DevTools / view-source /
// save shortcuts are swallowed. This can't truly stop a determined person
// (the images are public URLs) — it only discourages casual saving.
// Listeners exist only while the component using this hook is mounted, so
// the rest of the website is unaffected.
export function useContentProtection() {
    useEffect(() => {
        const inField = (t: EventTarget | null) =>
            t instanceof HTMLElement && !!t.closest("input, textarea");

        const onContextMenu = (e: Event) => e.preventDefault();

        const onDragStart = (e: Event) => {
            if ((e.target as HTMLElement | null)?.tagName === "IMG") e.preventDefault();
        };

        const onSelectStart = (e: Event) => {
            if (!inField(e.target)) e.preventDefault();
        };

        const onKeyDown = (e: KeyboardEvent) => {
            if (inField(e.target)) return;
            const k = e.key.toLowerCase();
            if (
                e.key === "F12" ||
                (e.ctrlKey && ["u", "s", "c", "i", "j"].includes(k)) ||
                (e.ctrlKey && e.shiftKey && ["i", "j", "c"].includes(k))
            ) {
                e.preventDefault();
            }
        };

        document.addEventListener("contextmenu", onContextMenu);
        document.addEventListener("dragstart", onDragStart);
        document.addEventListener("selectstart", onSelectStart);
        document.addEventListener("keydown", onKeyDown);

        return () => {
            document.removeEventListener("contextmenu", onContextMenu);
            document.removeEventListener("dragstart", onDragStart);
            document.removeEventListener("selectstart", onSelectStart);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, []);
}
