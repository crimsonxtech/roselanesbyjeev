"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import Preloader from "./Preloader";
import PinGate from "./PinGate";
import PinModal from "./PinModal";
import type { Gallery, Photo } from "./lib/types";
import {
    authorize,
    getAllPhotos,
    isAuthorized,
    loadGallery,
    needsPin,
    photoKey,
    readFavoriteOverrides,
    syncFavoriteToServer,
    writeFavoriteOverrides,
    type FavoriteOverrides,
} from "./lib/gallery";

interface GalleryContextValue {
    client: string;
    gallery: Gallery;
    isFavorite: (photo: Photo) => boolean;
    /** Flips the favorite flag (and remembers / syncs it). */
    toggleFavorite: (photo: Photo) => void;
    /** Favorites a photo (no-op if it already is one). */
    addFavorite: (photo: Photo) => void;
    /** Every currently favorited photo (de-duplicated). */
    getFavorites: () => Photo[];
    /** Resolves true if the action may proceed (no PIN needed / PIN entered). */
    ensureAuthorized: () => Promise<boolean>;
}

const GalleryContext = createContext<GalleryContextValue | null>(null);

export function useGallery() {
    const ctx = useContext(GalleryContext);
    if (!ctx) throw new Error("useGallery must be used inside <GalleryProvider>");
    return ctx;
}

type Status = "loading" | "error" | "locked" | "ready";

// Result of loading one client's gallery.
type LoadResult =
    | { client: string; gallery: Gallery; locked: boolean }
    | { client: string; error: string };

// Loads {R2}/{prefix}/{client}/temp.json, handles the loading screen, errors
// and the full-page PIN gate, and shares the gallery + favorites with children.
export default function GalleryProvider({
    client,
    showPreloader = false,
    errorTitle = "Gallery Not Found",
    children,
}: {
    client: string;
    showPreloader?: boolean;
    errorTitle?: string;
    children: React.ReactNode;
}) {
    const [result, setResult] = useState<LoadResult | null>(null);
    const [overrides, setOverrides] = useState<FavoriteOverrides>({});
    const [pinRequest, setPinRequest] = useState<{ resolve: (ok: boolean) => void } | null>(null);

    useEffect(() => {
        let cancelled = false;

        loadGallery(client)
            .then((g) => {
                if (cancelled) return;
                setOverrides(readFavoriteOverrides());
                setResult({ client, gallery: g, locked: !!g.passwordProtected && !isAuthorized(g) });
            })
            .catch((err: Error) => {
                if (cancelled) return;
                console.error(err);
                setResult({ client, error: err.message });
            });

        return () => {
            cancelled = true;
        };
    }, [client]);

    // A result for a different client (we just navigated) counts as "loading".
    const current = result && result.client === client ? result : null;
    const gallery = current && "gallery" in current ? current.gallery : null;
    const errorMsg = current && "error" in current ? current.error : "";

    const status: Status = !current
        ? "loading"
        : "error" in current
          ? "error"
          : current.locked
            ? "locked"
            : "ready";

    const isFavorite = useCallback(
        (photo: Photo) => {
            const key = photoKey(photo);
            return key in overrides ? overrides[key] : !!photo.favorite;
        },
        [overrides]
    );

    const toggleFavorite = useCallback(
        (photo: Photo) => {
            if (!gallery) return;
            const key = photoKey(photo);
            const next = !isFavorite(photo);

            setOverrides((prev) => ({ ...prev, [key]: next }));
            // merge into what's already stored so bulk favoriting loses nothing
            writeFavoriteOverrides({ ...readFavoriteOverrides(), [key]: next });

            syncFavoriteToServer(client, photo, next, gallery.pin).catch((err: Error) =>
                console.warn("Favorite not synced to server:", err.message)
            );
        },
        [client, gallery, isFavorite]
    );

    const addFavorite = useCallback(
        (photo: Photo) => {
            if (!isFavorite(photo)) toggleFavorite(photo);
        },
        [isFavorite, toggleFavorite]
    );

    const getFavorites = useCallback(() => {
        if (!gallery) return [];
        const seen = new Set<string>();
        return getAllPhotos(gallery).filter((p) => {
            const key = photoKey(p);
            if (seen.has(key) || !isFavorite(p)) return false;
            seen.add(key);
            return true;
        });
    }, [gallery, isFavorite]);

    const ensureAuthorized = useCallback(() => {
        if (!gallery || !needsPin(gallery)) return Promise.resolve(true);
        return new Promise<boolean>((resolve) => setPinRequest({ resolve }));
    }, [gallery]);

    const finishPin = useCallback(
        (ok: boolean) => {
            if (ok && gallery) authorize(gallery);
            pinRequest?.resolve(ok);
            setPinRequest(null);
        },
        [gallery, pinRequest]
    );

    const value = useMemo<GalleryContextValue | null>(
        () =>
            gallery
                ? { client, gallery, isFavorite, toggleFavorite, addFavorite, getFavorites, ensureAuthorized }
                : null,
        [client, gallery, isFavorite, toggleFavorite, addFavorite, getFavorites, ensureAuthorized]
    );

    return (
        <>
            {showPreloader && <Preloader ready={status !== "loading"} />}

            {status === "error" && (
                <div style={{ textAlign: "center", marginTop: 120, padding: 24 }}>
                    <h2>{errorTitle}</h2>
                    <p>{errorMsg}</p>
                </div>
            )}

            {status === "locked" && gallery && (
                <PinGate
                    gallery={gallery}
                    onUnlock={() => {
                        authorize(gallery);
                        setResult({ client, gallery, locked: false });
                    }}
                />
            )}

            {status === "ready" && value && (
                <GalleryContext.Provider value={value}>
                    {children}
                    {pinRequest && <PinModal gallery={value.gallery} onFinish={finishPin} />}
                </GalleryContext.Provider>
            )}
        </>
    );
}
