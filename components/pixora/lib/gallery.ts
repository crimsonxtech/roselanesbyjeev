// Plain (non-React) helpers: data loading, favorites storage, PIN auth,
// download / share. Browser-only — only call these from client components.

import { PIXORA_CONFIG } from "./config";
import type { Gallery, Photo } from "./types";

// ── Loading ──────────────────────────────────────────────────────────

export async function loadGallery(client: string): Promise<Gallery> {
    if (!client) throw new Error("Missing event.");

    const url =
        `${PIXORA_CONFIG.R2_BASE_URL}/${PIXORA_CONFIG.PREFIX}/` +
        `${encodeURIComponent(client)}/${PIXORA_CONFIG.GALLERY_FILE}`;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load gallery.");

    return (await res.json()) as Gallery;
}

// ── Photos & favorites ───────────────────────────────────────────────

// Highlights + every photo of every album section, flattened.
export function getAllPhotos(gallery: Gallery): Photo[] {
    const all: Photo[] = [...(gallery.highlights ?? [])];

    (gallery.albums ?? []).forEach((album) =>
        (album.sections ?? []).forEach((section) =>
            (section.photos ?? []).forEach((photo) => all.push(photo))
        )
    );

    return all;
}

// The JSON has no guaranteed `id`, so fall back to the URLs.
export function photoKey(photo: Photo): string {
    return photo.id || photo.original || photo.display || photo.thumb;
}

const FAV_STORAGE_KEY = "favoriteOverrides";

export type FavoriteOverrides = Record<string, boolean>;

export function readFavoriteOverrides(): FavoriteOverrides {
    try {
        return JSON.parse(localStorage.getItem(FAV_STORAGE_KEY) || "{}");
    } catch {
        return {};
    }
}

export function writeFavoriteOverrides(map: FavoriteOverrides) {
    try {
        localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(map));
    } catch {
        /* storage full / blocked — ignore */
    }
}

// Tells the backend to rewrite the gallery JSON in R2. The server must
// verify the PIN itself — the client-side gate can be bypassed.
export async function syncFavoriteToServer(
    client: string,
    photo: Photo,
    favorite: boolean,
    pin: Gallery["pin"]
) {
    const endpoint = PIXORA_CONFIG.FAVORITES_ENDPOINT;
    if (!endpoint) return; // no backend configured: favorites stay in this browser only

    const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            event: client,
            photoKey: photoKey(photo),
            favorite,
            pin: pin ?? null,
        }),
    });

    if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail.error || `Server rejected favorite update (${res.status})`);
    }
}

// ── Formatting ───────────────────────────────────────────────────────

export function formatDate(value?: string): string {
    if (!value) return "";
    const date = new Date(value);
    if (isNaN(date.getTime())) return "";

    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

// ── Download & share ─────────────────────────────────────────────────

function triggerDownload(href: string, filename: string) {
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
}

// Downloads the full-resolution original, keeping the filename from the URL.
export async function downloadOriginal(photo: Photo) {
    const src = photo.original || photo.display;
    const filename = decodeURIComponent(src.split("/").pop()!.split("?")[0]);

    try {
        const response = await fetch(src);
        if (!response.ok) throw new Error("Failed to fetch image");

        const url = URL.createObjectURL(await response.blob());
        triggerDownload(url, filename);
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error("Download failed:", err);
        triggerDownload(src, filename); // fallback
    }
}

export async function shareLink(
    url: string,
    title = ""
): Promise<"shared" | "cancelled" | "copied"> {
    if (navigator.share) {
        try {
            await navigator.share({ title, url });
            return "shared";
        } catch (err) {
            if ((err as Error).name === "AbortError") return "cancelled";
            // otherwise fall through to clipboard
        }
    }

    await navigator.clipboard.writeText(url);
    return "copied";
}

// Zips photos in the browser and downloads one file. Needs permissive CORS
// on the R2 bucket (same requirement as before).
export async function downloadZip(
    photos: Photo[],
    zipName = "photos.zip",
    onProgress: (done: number, total: number) => void = () => {}
) {
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();

    for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        const url = photo.original || photo.display;

        try {
            const res = await fetch(url);
            const blob = await res.blob();
            const ext = url.split(".").pop()!.split("?")[0] || "jpg";
            zip.file(`${photo.name || "photo-" + (i + 1)}.${ext}`, blob);
        } catch (err) {
            console.warn("Could not fetch for zip (likely CORS):", url, err);
        }

        onProgress(i + 1, photos.length);
    }

    const blob = await zip.generateAsync({ type: "blob" });
    const href = URL.createObjectURL(blob);
    triggerDownload(href, zipName);
    URL.revokeObjectURL(href);
}

// ── PIN authorization ────────────────────────────────────────────────
// One "authorized" flag per gallery in localStorage backs both gates:
// the full-page gate (passwordProtected) and the action gate (favorite /
// download). Unlocking either one unlocks both.

const authKey = (g: Gallery) => `gallery-auth-${g.projectName}`;

export function isAuthorized(gallery: Gallery): boolean {
    if (!gallery.pin) return true;
    try {
        return localStorage.getItem(authKey(gallery)) === "true";
    } catch {
        return false;
    }
}

export function authorize(gallery: Gallery) {
    try {
        localStorage.setItem(authKey(gallery), "true");
    } catch {
        /* ignore */
    }
}

export function logoutGallery(gallery: Gallery) {
    try {
        localStorage.removeItem(authKey(gallery));
    } catch {
        /* ignore */
    }
}

export function pinMatches(entered: string, gallery: Gallery): boolean {
    const value = entered.trim();
    return value !== "" && Number(value) === Number(gallery.pin);
}

export function needsPin(gallery: Gallery): boolean {
    return !!gallery.pin && !isAuthorized(gallery);
}
