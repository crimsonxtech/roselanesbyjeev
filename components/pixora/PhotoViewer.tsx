"use client";

import { useCallback, useState } from "react";
import Lightbox from "./Lightbox";
import Slideshow from "./Slideshow";
import type { Photo } from "./lib/types";

export type ViewerState =
    | { kind: "closed" }
    | { kind: "lightbox"; photos: Photo[]; index: number }
    | { kind: "slideshow"; photos: Photo[]; startIndex: number; returnToLightbox: boolean };

const CLOSED: ViewerState = { kind: "closed" };

// State for the lightbox / slideshow. Use with <PhotoViewer />.
export function useViewer() {
    const [view, setView] = useState<ViewerState>(CLOSED);

    const openLightbox = useCallback(
        (photos: Photo[], index = 0) => setView({ kind: "lightbox", photos, index }),
        []
    );
    const openSlideshow = useCallback(
        (photos: Photo[], startIndex = 0) =>
            setView({ kind: "slideshow", photos, startIndex, returnToLightbox: false }),
        []
    );

    return { view, setView, openLightbox, openSlideshow };
}

// Renders whichever viewer is active. Starting a slideshow from the lightbox
// returns to that same photo in the lightbox when the slideshow is closed.
export default function PhotoViewer({
    view,
    setView,
}: {
    view: ViewerState;
    setView: (v: ViewerState) => void;
}) {
    if (view.kind === "lightbox") {
        return (
            <Lightbox
                photos={view.photos}
                startIndex={view.index}
                onClose={() => setView(CLOSED)}
                onSlideshow={(index) =>
                    setView({ kind: "slideshow", photos: view.photos, startIndex: index, returnToLightbox: true })
                }
            />
        );
    }

    if (view.kind === "slideshow") {
        return (
            <Slideshow
                photos={view.photos}
                startIndex={view.startIndex}
                onClose={() =>
                    setView(
                        view.returnToLightbox
                            ? { kind: "lightbox", photos: view.photos, index: view.startIndex }
                            : CLOSED
                    )
                }
            />
        );
    }

    return null;
}
