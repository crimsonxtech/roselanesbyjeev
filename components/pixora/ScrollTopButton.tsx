"use client";

import { useEffect, useState } from "react";

// Floating "back to top" button, fades in after scrolling past `threshold`.
export default function ScrollTopButton({ threshold = 480 }: { threshold?: number }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const onScroll = () => setVisible(window.scrollY > threshold);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, [threshold]);

    return (
        <button
            className={`scroll-top-btn ${visible ? "visible" : ""}`}
            aria-label="Scroll to top"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
            ↑
        </button>
    );
}
