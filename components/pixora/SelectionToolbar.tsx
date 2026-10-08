"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { Download, Heart, LoaderCircle, X } from "lucide-react";

interface Props {
    selectionMode: boolean;
    selectedCount: number;
    allFavorited: boolean;
    downloading: boolean;
    onStart: () => void;
    onCancel: () => void;
    onFavorite: () => void;
    onDownload: () => void;
}

// "Select" button that expands into  ✕ · N selected · ♥ · ⬇  with a smooth
// width animation (same FLIP technique as the original album.js).
export default function SelectionToolbar({
    selectionMode,
    selectedCount,
    allFavorited,
    downloading,
    onStart,
    onCancel,
    onFavorite,
    onDownload,
}: Props) {
    const ref = useRef<HTMLDivElement>(null);
    const widthRef = useRef(0); // last known width, tracked continuously
    const prevMode = useRef(selectionMode);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        widthRef.current = el.getBoundingClientRect().width;
        const ro = new ResizeObserver(() => (widthRef.current = el.getBoundingClientRect().width));
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // Runs right after React swaps the contents, before paint.
    useLayoutEffect(() => {
        if (prevMode.current === selectionMode) return;
        prevMode.current = selectionMode;
        if (ref.current) animateToolbarWidth(ref.current, widthRef.current);
    }, [selectionMode]);

    return (
        <div className="selection-toolbar" ref={ref}>
            {!selectionMode ? (
                <button className="select-toggle-btn" onClick={onStart}>
                    Select
                </button>
            ) : (
                <>
                    <button className="cancel-selection-btn" onClick={onCancel} aria-label="Cancel selection">
                        <X />
                    </button>

                    <span className="selection-count">{selectedCount} selected</span>

                    <button
                        id="favoriteSelectedBtn"
                        className={`toolbar-btn ${allFavorited ? "active" : ""}`}
                        onClick={onFavorite}
                        aria-label="Favorite selected"
                    >
                        <Heart />
                    </button>

                    <button
                        id="downloadSelectedBtn"
                        className={`toolbar-btn ${downloading ? "loading" : ""}`}
                        disabled={downloading}
                        onClick={onDownload}
                        aria-label="Download selected"
                    >
                        {downloading ? <LoaderCircle /> : <Download />}
                    </button>
                </>
            )}
        </div>
    );
}

// Locks the old width, measures the new natural width, then transitions
// between the two. wrap is forced to nowrap during the animation so buttons
// never pile onto a second row mid-way on mobile.
function animateToolbarWidth(toolbar: HTMLElement, startWidth: number) {
    const originalWrap = toolbar.style.flexWrap;
    toolbar.style.flexWrap = "nowrap";
    toolbar.style.width = `${startWidth}px`;
    void toolbar.offsetWidth; // flush so the lock applies before measuring

    toolbar.style.width = "auto";
    const naturalWidth = toolbar.getBoundingClientRect().width;
    const maxWidth = toolbar.parentElement ? toolbar.parentElement.clientWidth : naturalWidth;
    const endWidth = Math.min(naturalWidth, maxWidth);

    toolbar.style.width = `${startWidth}px`;
    void toolbar.offsetWidth;

    requestAnimationFrame(() => {
        toolbar.style.width = `${endWidth}px`;
    });

    const release = () => {
        toolbar.style.width = "";
        toolbar.style.flexWrap = originalWrap;
        toolbar.removeEventListener("transitionend", onDone);
        window.clearTimeout(fallback);
    };
    const onDone = (e: TransitionEvent) => {
        if (e.propertyName === "width") release();
    };
    toolbar.addEventListener("transitionend", onDone);
    // If the width didn't actually change, no transitionend fires.
    const fallback = window.setTimeout(release, 600);
}
