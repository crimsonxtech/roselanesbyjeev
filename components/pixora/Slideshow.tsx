"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, Pause, Play, Shuffle } from "lucide-react";
import { useBodyScrollLock, useFlash } from "./viewerHooks";
import { formatDate } from "./lib/gallery";
import type { Photo } from "./lib/types";

const FADE_MS = 400; // must match the CSS transition on .ss-image

const SPEEDS = [
    { value: 2, label: "Fast", text: "⚡ Fast" },
    { value: 4, label: "Normal", text: "✓ Normal" },
    { value: 7, label: "Slow", text: "🐢 Slow" },
];

// Fisher–Yates shuffle (returns a new array).
function shuffled(list: number[]): number[] {
    const o = [...list];
    for (let i = o.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [o[i], o[j]] = [o[j], o[i]];
    }
    return o;
}

interface Props {
    photos: Photo[];
    startIndex?: number;
    onClose: () => void;
}

// Fullscreen slideshow: autoplay, prev/next, shuffle, speed menu. Tapping
// empty space hides/shows the controls.
export default function Slideshow({ photos, startIndex = 0, onClose }: Props) {
    const natural = useMemo(() => photos.map((_, i) => i), [photos]);

    const [order, setOrder] = useState<number[]>(natural);
    const [current, setCurrent] = useState(startIndex);
    const [shuffleOn, setShuffleOn] = useState(false);
    const [speed, setSpeed] = useState(4);
    const [playing, setPlaying] = useState(true);
    const [controlsVisible, setControlsVisible] = useState(true);
    const [menuOpen, setMenuOpen] = useState(false);
    const [menuPos, setMenuPos] = useState({ left: 8, bottom: 80 });

    const [shown, setShown] = useState<Photo | null>(null);
    const [fadingOut, setFadingOut] = useState(false);

    const rootRef = useRef<HTMLDivElement>(null);
    const speedBtnRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const firstSlide = useRef(true);

    const { flashing, flash } = useFlash();
    useBodyScrollLock();

    const goTo = useCallback(
        (dir: number) => {
            if (!order.length) return;
            setCurrent((c) => (c + dir + order.length) % order.length);
        },
        [order.length]
    );

    // Preload + decode the next image, fade the old one out, swap, fade in.
    useEffect(() => {
        const photo = photos[order[current]];
        if (!photo) return;

        let cancelled = false;
        let timer: number | undefined;

        const img = new Image();
        img.src = photo.display;
        const ready = img.decode ? img.decode().catch(() => {}) : Promise.resolve();

        ready.then(() => {
            if (cancelled) return;

            if (firstSlide.current) {
                firstSlide.current = false;
                setShown(photo);
                return;
            }

            setFadingOut(true);
            timer = window.setTimeout(() => {
                if (cancelled) return;
                setShown(photo);
                setFadingOut(false);
            }, FADE_MS);
        });

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [current, order, photos]);

    // Autoplay — restarts whenever the slide, speed or play state changes.
    useEffect(() => {
        if (!playing || !order.length) return;
        const t = window.setTimeout(() => goTo(1), speed * 1000);
        return () => window.clearTimeout(t);
    }, [playing, speed, current, order.length, goTo]);

    // Keyboard: Esc / arrows / space.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowLeft") goTo(-1);
            if (e.key === "ArrowRight") goTo(1);
            if (e.key === " ") {
                e.preventDefault();
                setPlaying((p) => !p);
            }
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose, goTo]);

    // The speed dropdown is position:fixed (so it's never clipped by the
    // scrollable controls bar) — place it above the button, kept on-screen.
    const positionMenu = useCallback(() => {
        const btn = speedBtnRef.current;
        if (!btn) return;
        const rect = btn.getBoundingClientRect();
        const menuWidth = menuRef.current?.offsetWidth || 180;
        const left = Math.max(Math.min(rect.left, window.innerWidth - menuWidth - 8), 8);
        setMenuPos({ left, bottom: window.innerHeight - rect.top + 10 });
    }, []);

    useEffect(() => {
        if (!menuOpen) return;
        window.addEventListener("resize", positionMenu);
        return () => window.removeEventListener("resize", positionMenu);
    }, [menuOpen, positionMenu]);

    // Click anywhere else inside the slideshow closes the speed menu.
    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            const t = e.target as HTMLElement;
            if (!rootRef.current?.contains(t)) return;
            if (!t.closest(".ss-speed") && !t.closest(".ss-speed-menu")) setMenuOpen(false);
        };
        document.addEventListener("click", onDocClick);
        return () => document.removeEventListener("click", onDocClick);
    }, []);

    const toggleShuffle = () => {
        if (!shuffleOn) {
            setOrder(shuffled(natural));
            setCurrent(0);
        } else {
            const realIndex = order[current];
            setOrder(natural);
            setCurrent(realIndex);
        }
        setShuffleOn((s) => !s);
    };

    const f = (name: string) => (flashing === name ? "flash" : "");
    const caption = shown ? [shown.id, formatDate(shown.date)].filter(Boolean).join(" · ") : "";
    const speedLabel = SPEEDS.find((s) => s.value === speed)?.label ?? "Normal";

    return (
        <div
            ref={rootRef}
            className={`ss-overlay ${controlsVisible ? "" : "ss-controls-hidden"}`}
            onClick={() => setControlsVisible((v) => !v)}
        >
            <img className={`ss-image ${fadingOut ? "ss-fade-out" : ""}`} alt="" src={shown?.display} />

            <div className="ss-topbar">
                <button className={`ss-icon-btn ss-back ${f("back")}`} aria-label="Back" onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}>
                    <ArrowLeft />
                </button>
                <div className="ss-caption">{caption}</div>
            </div>

            <div className="ss-controls">
                <button
                    className={`ss-icon-btn ss-prev ${f("prev")}`}
                    aria-label="Previous"
                    onClick={(e) => {
                        e.stopPropagation();
                        flash("prev");
                        goTo(-1);
                    }}
                >
                    <ChevronLeft />
                </button>

                <button
                    className={`ss-icon-btn ss-play ${f("play")}`}
                    aria-label={playing ? "Pause" : "Play"}
                    onClick={(e) => {
                        e.stopPropagation();
                        flash("play");
                        setPlaying((p) => !p);
                    }}
                >
                    {playing ? <Pause /> : <Play />}
                </button>

                <button
                    className={`ss-icon-btn ss-next ${f("next")}`}
                    aria-label="Next"
                    onClick={(e) => {
                        e.stopPropagation();
                        flash("next");
                        goTo(1);
                    }}
                >
                    <ChevronRight />
                </button>

                <button
                    className={`ss-icon-btn ss-shuffle ${shuffleOn ? "active" : ""} ${f("shuffle")}`}
                    aria-label="Shuffle"
                    onClick={(e) => {
                        e.stopPropagation();
                        flash("shuffle");
                        toggleShuffle();
                    }}
                >
                    <Shuffle />
                </button>

                <div className="ss-speed">
                    <button
                        ref={speedBtnRef}
                        className={`ss-speed-btn ${menuOpen ? "open" : ""}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!menuOpen) positionMenu();
                            setMenuOpen((o) => !o);
                        }}
                    >
                        <span>{speedLabel}</span>
                        <ChevronDown />
                    </button>
                </div>
            </div>

            {/* Rendered as a direct child of the overlay on purpose: the controls
                bar uses backdrop-filter, which would otherwise trap/clip this
                fixed-position menu. */}
            <div
                ref={menuRef}
                className={`ss-speed-menu ${menuOpen ? "open" : ""}`}
                style={{ left: menuPos.left, bottom: menuPos.bottom }}
            >
                {SPEEDS.map((s) => (
                    <button
                        key={s.value}
                        className={s.value === speed ? "active" : ""}
                        onClick={(e) => {
                            e.stopPropagation();
                            setSpeed(s.value);
                            setMenuOpen(false);
                        }}
                    >
                        {s.text}
                    </button>
                ))}
            </div>
        </div>
    );
}
