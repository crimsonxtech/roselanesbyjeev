"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useGallery } from "./GalleryProvider";
import JustifiedGrid from "./JustifiedGrid";
import PhotoViewer, { useViewer } from "./PhotoViewer";
import ScrollTopButton from "./ScrollTopButton";
import SelectionToolbar from "./SelectionToolbar";
import { useContentProtection } from "./useContentProtection";
import { downloadOriginal, downloadZip } from "./lib/gallery";

// Album page (/{client}/{albumId}) — also serves /{client}/favorites.
// Must be rendered inside <PixoraRoot> and <GalleryProvider>.
export default function AlbumView({ albumId }: { albumId: string }) {
    const { client, gallery, isFavorite, addFavorite, getFavorites, ensureAuthorized } = useGallery();
    const viewer = useViewer();

    useContentProtection();

    const isFavoritesView = albumId === "favorites";
    const album = isFavoritesView ? undefined : (gallery.albums ?? []).find((a) => a.id === albumId);

    // Favorites page: snapshot on load, same as the original.
    const [favoriteSnapshot] = useState(() => (isFavoritesView ? getFavorites() : []));

    const sections = useMemo(() => album?.sections ?? [], [album]);
    const [sectionIndex, setSectionIndex] = useState(0);
    const hideTabs = sections.length === 1 && sections[0].name === "default";

    const albumName = isFavoritesView ? "Favorites" : album?.name ?? "";
    const currentPhotos = useMemo(
        () => (isFavoritesView ? favoriteSnapshot : sections[sectionIndex]?.photos ?? []),
        [isFavoritesView, favoriteSnapshot, sections, sectionIndex]
    );
    const allAlbumPhotos = useMemo(
        () => (isFavoritesView ? favoriteSnapshot : sections.flatMap((s) => s.photos ?? [])),
        [isFavoritesView, favoriteSnapshot, sections]
    );
    const countLabel = `${isFavoritesView ? favoriteSnapshot.length : album?.photoCount ?? allAlbumPhotos.length} Photos`;

    // Bulk-select state
    const [selectionMode, setSelectionMode] = useState(false);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [downloading, setDownloading] = useState(false);

    const selectedPhotos = useMemo(
        () => [...selected].map((i) => currentPhotos[i]).filter(Boolean),
        [selected, currentPhotos]
    );
    const allFavorited = selectedPhotos.length > 0 && selectedPhotos.every(isFavorite);

    const exitSelection = () => {
        setSelectionMode(false);
        setSelected(new Set());
    };

    // Esc leaves selection mode (but not while the lightbox/slideshow owns Esc)
    useEffect(() => {
        if (!selectionMode || viewer.view.kind !== "closed") return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                exitSelection();
            }
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [selectionMode, viewer.view.kind]);

    const scrollToPhotos = () =>
        document.getElementById("photosHeading")?.scrollIntoView({ behavior: "smooth", block: "start" });

    // Switching tabs: swap the grid first, THEN scroll, so the page has
    // already settled to its final height (avoids a mid-scroll jump on mobile).
    const pendingScroll = useRef(false);
    useEffect(() => {
        if (pendingScroll.current) {
            pendingScroll.current = false;
            scrollToPhotos();
        }
    }, [sectionIndex]);

    const selectTab = (i: number) => {
        exitSelection();
        if (i === sectionIndex) return scrollToPhotos();
        pendingScroll.current = true;
        setSectionIndex(i);
    };

    const onPhotoClick = (index: number) => {
        if (!selectionMode) return viewer.openLightbox(currentPhotos, index);

        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    };

    const favoriteSelection = async () => {
        if (!(await ensureAuthorized())) return;
        selectedPhotos.forEach((photo) => addFavorite(photo));
    };

    const downloadSelection = async () => {
        if (!(await ensureAuthorized())) return;
        if (!selectedPhotos.length) return;

        setDownloading(true);
        try {
            if (selectedPhotos.length === 1) await downloadOriginal(selectedPhotos[0]);
            else await downloadZip(selectedPhotos, `${albumName}.zip`);
        } finally {
            setDownloading(false);
        }
    };

    if (!isFavoritesView && !album) {
        return <h2 style={{ textAlign: "center", marginTop: 60 }}>Album not found</h2>;
    }

    const coverImage = album?.coverImage;

    return (
        <>
            <Link id="backBtn" href={`/${encodeURIComponent(client)}`}>
                ←
            </Link>

            <div className="hero-wrapper">
                <header id="hero" className="album-hero">
                    <div
                        id="heroBg"
                        className="hero-bg"
                        style={coverImage ? { backgroundImage: `url("${coverImage}")` } : undefined}
                    />
                    <div className="overlay" />

                    <div className="hero-content">
                        {/* Top-right slideshow button */}
                        <button
                            id="playBtn"
                            className="play-btn"
                            aria-label="Play slideshow"
                            onClick={() => allAlbumPhotos.length && viewer.openSlideshow(allAlbumPhotos)}
                        >
                            ▶
                        </button>

                        {/* Bottom content */}
                        <div className="hero-bottom">
                            <h1 id="albumTitle">{albumName}</h1>

                            <button id="viewPhotosBtn" className="hero-btn" onClick={scrollToPhotos}>
                                View Photos
                            </button>
                        </div>
                    </div>
                </header>
            </div>

            <div className="gallery-container" id="photosHeading">
                <div className={`gallery-toolbar ${selectionMode ? "selecting" : ""}`}>
                    {currentPhotos.length > 0 && (
                        <SelectionToolbar
                            selectionMode={selectionMode}
                            selectedCount={selected.size}
                            allFavorited={allFavorited}
                            downloading={downloading}
                            onStart={() => setSelectionMode(true)}
                            onCancel={exitSelection}
                            onFavorite={favoriteSelection}
                            onDownload={downloadSelection}
                        />
                    )}

                    {!isFavoritesView && (
                        <div id="sectionTabs" style={{ display: hideTabs ? "none" : "flex" }}>
                            {sections.map((section, i) => (
                                <button
                                    key={section.name + i}
                                    className={i === sectionIndex ? "active" : ""}
                                    onClick={() => selectTab(i)}
                                >
                                    {section.name}
                                </button>
                            ))}
                        </div>
                    )}

                    <p id="albumCount">{countLabel}</p>
                </div>

                <div className="section-header photos-heading" />

                {/* key: rebuild the grid when switching sections */}
                <JustifiedGrid
                    key={isFavoritesView ? "favorites" : sectionIndex}
                    photos={currentPhotos}
                    selectionMode={selectionMode}
                    selected={selected}
                    onPhotoClick={onPhotoClick}
                />
            </div>

            <PhotoViewer view={viewer.view} setView={viewer.setView} />
            <ScrollTopButton />
        </>
    );
}
