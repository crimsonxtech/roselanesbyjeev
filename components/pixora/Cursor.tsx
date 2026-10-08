"use client";

import { useEffect, useRef } from "react";

// Custom ring + dot cursor. Only active on devices with a real mouse
// (the CSS hides it on touch anyway).
export default function Cursor() {
    const ringRef = useRef<HTMLDivElement>(null);
    const dotRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

        const ring = ringRef.current;
        const dot = dotRef.current;
        if (!ring || !dot) return;

        const onMove = (e: MouseEvent) => {
            ring.style.left = `${e.clientX}px`;
            ring.style.top = `${e.clientY}px`;
            dot.style.left = `${e.clientX}px`;
            dot.style.top = `${e.clientY}px`;
        };
        const show = () => {
            ring.classList.remove("hidden");
            dot.classList.remove("hidden");
        };
        const hide = () => {
            ring.classList.add("hidden");
            dot.classList.add("hidden");
        };
        const down = () => dot.classList.add("active");
        const up = () => dot.classList.remove("active");

        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseenter", show);
        document.addEventListener("mouseleave", hide);
        document.addEventListener("mousedown", down);
        document.addEventListener("mouseup", up);

        return () => {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseenter", show);
            document.removeEventListener("mouseleave", hide);
            document.removeEventListener("mousedown", down);
            document.removeEventListener("mouseup", up);
        };
    }, []);

    return (
        <>
            <div ref={ringRef} className="cursor" />
            <div ref={dotRef} className="cursor-dot" />
        </>
    );
}
