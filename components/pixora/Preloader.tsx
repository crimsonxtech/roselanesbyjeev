"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";

const MIN_VISIBLE_MS = 500; // avoid a jarring flash on fast loads
const FADE_MS = 800; // matches the CSS transition in pixora.css
const SAFETY_MS = 6000; // never leave visitors stuck behind the spinner

// Full-screen loader. Stays up until `ready` flips to true, then fades out.
export default function Preloader({ ready }: { ready: boolean }) {
    const shownAt = useRef(0);
    const [hidden, setHidden] = useState(false); // adds the fade-out class
    const [removed, setRemoved] = useState(false); // unmounts after the fade

    useEffect(() => {
        shownAt.current = Date.now();
    }, []);

    useEffect(() => {
        if (!ready) return;
        const wait = Math.max(0, MIN_VISIBLE_MS - (Date.now() - shownAt.current));
        const t = setTimeout(() => setHidden(true), wait);
        return () => clearTimeout(t);
    }, [ready]);

    useEffect(() => {
        const t = setTimeout(() => setHidden(true), SAFETY_MS);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        if (!hidden) return;
        const t = setTimeout(() => setRemoved(true), FADE_MS);
        return () => clearTimeout(t);
    }, [hidden]);

    if (removed) return null;

    return (
        <div id="preloader" className={hidden ? "hide" : ""}>
            <div className="loader-glass">
                <svg className="loader-ring" viewBox="0 0 120 120">
                    <circle className="track" cx="60" cy="60" r="52" />
                    <circle className="arc arc-left" cx="60" cy="60" r="52" />
                    <circle className="arc arc-right" cx="60" cy="60" r="52" />
                </svg>
                <img src="/pixora/assets/loader.png" alt="loading" />
            </div>
        </div>
    );
}
