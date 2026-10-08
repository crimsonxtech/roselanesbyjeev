"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Download, Heart, LoaderCircle, Play, Share2 } from "lucide-react";
import { useGallery } from "./GalleryProvider";
import { usePixoraUI } from "./PixoraRoot";
import { useBodyScrollLock, useFlash } from "./viewerHooks";
import { downloadOriginal, formatDate, shareLink } from "./lib/gallery";
import type { Photo } from "./lib/types";

interface Props {
    photos: Photo[];
    startIndex: number;
    onClose: () => void;
    onSlideshow: (index: number) => void;
}

// Full-screen photo viewer: arrows / keyboard navigation, click-to-zoom,
// favorite, share, download, and a hand-off to the slideshow.
export default function Lightbox({ photos, startIndex, onClose, onSlideshow }: Props) {
    const { isFavorite, toggleFavorite, ensureAuthorized } = useGallery();
    const { toast } = usePixoraUI();
    const { flashing, flash } = useFlash();

    const [index, setIndex] = useState(startIndex);
    const [zoomed, setZoomed] = useState(false);
    const [downloading, setDownloading] = useState(false);

    useBodyScrollLock();

    const photo = photos[index];
    const showNav = photos.length > 1;

    const step = useCallback(
        (dir: number) => {
            setIndex((i) => (i + dir + photos.length) % photos.length);
            setZoomed(false);
        },
        [photos.length]
    );

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                if (zoomed) setZoomed(false);
                else onClose();
            }
            if (e.key === "ArrowLeft") step(-1);
            if (e.key === "ArrowRight") step(1);
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [zoomed, step, onClose]);

    if (!photo) return null;

    const onFavorite = async () => {
        if (!(await ensureAuthorized())) return;
        flash("favorite");
        toggleFavorite(photo);
    };

    const onDownload = async () => {
        if (!(await ensureAuthorized())) return;
        setDownloading(true);
        try {
            await downloadOriginal(photo);
        } finally {
            setDownloading(false);
        }
    };

    const onShare = async () => {
        flash("share");
        const result = await shareLink(photo.original || photo.display, photo.id || "Photo");
        if (result === "copied") toast("Link copied");
    };

    const f = (name: string) => (flashing === name ? "flash" : "");

    return (
        <div
            className="lb-overlay"
            onClick={(e) => {
                const target = e.target as HTMLElement;
                if (e.target === e.currentTarget || target.classList.contains("lb-stage")) onClose();
            }}
        >
            <div className="lb-topbar">
                <div className="lb-left">
                    <button className="lb-icon-btn lb-back" aria-label="Back (Esc)" onClick={onClose}>
                        <ArrowLeft />
                    </button>
                    <div className="lb-date">{photo.date ? formatDate(photo.date) : ""}</div>
                </div>

                <div className="lb-actions">
                    <button
                        className="lb-icon-btn lb-slideshow"
                        aria-label="Slideshow"
                        onClick={() => onSlideshow(index)}
                    >
                        <Play />
                    </button>

                    <button className={`lb-icon-btn lb-share ${f("share")}`} aria-label="Share" onClick={onShare}>
                        <Share2 />
                    </button>

                    <button
                        className={`lb-icon-btn lb-favorite ${isFavorite(photo) ? "active" : ""} ${f("favorite")}`}
                        aria-label="Favorite"
                        onClick={onFavorite}
                    >
                        <Heart />
                    </button>

                    <button
                        className={`lb-icon-btn lb-download ${downloading ? "loading" : ""}`}
                        aria-label="Download"
                        onClick={onDownload}
                    >
                        {downloading ? <LoaderCircle /> : <Download />}
                    </button>
                </div>
            </div>

            <div className="lb-stage">
                {showNav && (
                    <button className="lb-nav lb-prev" aria-label="Previous photo" onClick={() => step(-1)}>
                        <ChevronLeft />
                    </button>
                )}

                <div className="lb-frame">
                    <img
                        className={`lb-image ${zoomed ? "zoomed" : ""}`}
                        src={photo.display}
                        alt={photo.name || ""}
                        style={{ transformOrigin: "center" }}
                        onClick={() => setZoomed((z) => !z)}
                    />
                </div>

                {showNav && (
                    <button className="lb-nav lb-next" aria-label="Next photo" onClick={() => step(1)}>
                        <ChevronRight />
                    </button>
                )}
            </div>

            <div className="lb-caption">
                <p className="lb-title">{photo.name || photo.id || ""}</p>
            </div>
        </div>
    );
}
