"use client";

import { useGallery } from "./GalleryProvider";
import { usePixoraUI } from "./PixoraRoot";
import { downloadOriginal, shareLink } from "./lib/gallery";
import type { Photo } from "./lib/types";

// Favorite / share / download bar shown on hover over a thumbnail.
export default function PhotoActions({ photo }: { photo: Photo }) {
    const { isFavorite, toggleFavorite, ensureAuthorized } = useGallery();
    const { toast } = usePixoraUI();
    const fav = isFavorite(photo);

    return (
        <div className="photo-actions" onClick={(e) => e.stopPropagation()}>
            <button
                className={`photo-action-btn fav-btn ${fav ? "active" : ""}`}
                aria-label="Favorite"
                onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!(await ensureAuthorized())) return;
                    toggleFavorite(photo);
                }}
            >
                {fav ? "♥" : "♡"}
            </button>

            <button
                className="photo-action-btn share-btn"
                aria-label="Share"
                onClick={async (e) => {
                    e.stopPropagation();
                    const result = await shareLink(photo.original || photo.display, photo.name || "Photo");
                    if (result === "copied") toast("Link copied");
                }}
            >
                ⤴
            </button>

            <button
                className="photo-action-btn download-btn"
                aria-label="Download"
                onClick={async (e) => {
                    e.stopPropagation();
                    if (!(await ensureAuthorized())) return;
                    downloadOriginal(photo);
                }}
            >
                ⬇
            </button>
        </div>
    );
}
