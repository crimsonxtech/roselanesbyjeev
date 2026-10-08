"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Locks page scroll while an overlay (lightbox / slideshow) is open.
export function useBodyScrollLock() {
    useEffect(() => {
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = previous;
        };
    }, []);
}

// Briefly adds a `flash` class to a button (restartable) for tap feedback.
export function useFlash() {
    const [flashing, setFlashing] = useState<string | null>(null);
    const timer = useRef<number | undefined>(undefined);

    useEffect(() => () => window.clearTimeout(timer.current), []);

    const flash = useCallback((name: string) => {
        window.clearTimeout(timer.current);
        setFlashing(null);
        requestAnimationFrame(() => {
            setFlashing(name);
            timer.current = window.setTimeout(() => setFlashing(null), 180);
        });
    }, []);

    return { flashing, flash };
}
