"use client";

import "./pixora.css";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import Cursor from "./Cursor";

// Wraps every Pixora page. Everything the gallery renders (including the
// lightbox, slideshow and modals) lives INSIDE this div, which is what the
// scoped stylesheet targets — so nothing leaks into the rest of the site.

interface UIContextValue {
    toast: (message: string) => void;
}

const UIContext = createContext<UIContextValue>({ toast: () => {} });
export const usePixoraUI = () => useContext(UIContext);

export default function PixoraRoot({ children }: { children: React.ReactNode }) {
    const [toastState, setToastState] = useState<{ text: string; visible: boolean } | null>(null);
    const timers = useRef<number[]>([]);

    // Enables the page-level bits (scrollbar styling, smooth scroll) only
    // while a gallery page is mounted.
    useEffect(() => {
        document.documentElement.classList.add("pixora-active");
        return () => document.documentElement.classList.remove("pixora-active");
    }, []);

    useEffect(() => {
        const list = timers.current;
        return () => list.forEach(clearTimeout);
    }, []);

    const toast = useCallback((text: string) => {
        timers.current.forEach(clearTimeout);
        timers.current = [
            window.setTimeout(() => setToastState({ text, visible: true }), 20),
            window.setTimeout(() => setToastState({ text, visible: false }), 1620),
            window.setTimeout(() => setToastState(null), 1920),
        ];
        setToastState({ text, visible: false });
    }, []);

    const value = useMemo(() => ({ toast }), [toast]);

    return (
        <UIContext.Provider value={value}>
            <div className="pixora-root">
                <Cursor />
                {children}
                {toastState && (
                    <div className={`lb-toast ${toastState.visible ? "visible" : ""}`}>
                        {toastState.text}
                    </div>
                )}
            </div>
        </UIContext.Provider>
    );
}
