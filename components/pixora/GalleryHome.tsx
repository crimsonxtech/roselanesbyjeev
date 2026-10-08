"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useGallery } from "./GalleryProvider";
import PhotoActions from "./PhotoActions";
import PhotoViewer, { useViewer } from "./PhotoViewer";
import ScrollTopButton from "./ScrollTopButton";

// Client landing page (/{client}): cover hero, album cards, favorites.
// Must be rendered inside <PixoraRoot> and <GalleryProvider>.
export default function GalleryHome() {
    const { client, gallery, getFavorites } = useGallery();
    const router = useRouter();
    const viewer = useViewer();

    const albums = gallery.albums ?? [];

    // Snapshot on load (like the original): hearts update live, but the
    // list itself doesn't shuffle under the visitor's cursor.
    const [favorites] = useState(() => getFavorites());

    const openAlbum = (id: string) =>
        router.push(`/${encodeURIComponent(client)}/${encodeURIComponent(id)}`);

    return (
        <>
            <div className="hero-wrapper">
                <header id="hero">
                    <div
                        id="heroBg"
                        className="hero-bg"
                        style={{ backgroundImage: `url(${gallery.coverImage})` }}
                    />
                    <div className="overlay" />

                    <Link href="/" className="hero-logo" aria-label="Rose Lanes by Jeev">
                        <img src="/pixora/assets/logo.png" alt="Rose Lanes by Jeev" />
                    </Link>

                    <div className="hero-content">
                        <div className="hero-bottom">
                            <h1 id="coupleName">{gallery.coupleNames || gallery.projectName}</h1>

                            <button
                                id="viewGalleryBtn"
                                className="hero-btn"
                                onClick={() =>
                                    document
                                        .getElementById("albumsSection")
                                        ?.scrollIntoView({ behavior: "smooth", block: "start" })
                                }
                            >
                                View Gallery
                            </button>
                        </div>
                    </div>
                </header>
            </div>

            <main>
                <section id="albumsSection">
                    <div className="section-header">
                        <h2>Albums</h2>
                        <span id="albumsCount">{albums.length} Albums</span>
                    </div>

                    <div id="albums" className="card-row">
                        {albums.map((album) => (
                            <div
                                key={album.id}
                                className="album-card"
                                role="link"
                                tabIndex={0}
                                onClick={() => openAlbum(album.id)}
                                onKeyDown={(e) => e.key === "Enter" && openAlbum(album.id)}
                            >
                                <img
                                    loading="lazy"
                                    src={album.thumbnail || album.coverImage || ""}
                                    alt=""
                                />
                                <div className="album-card-fade" />
                                <div className="album-card-name">{album.name}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {favorites.length > 0 && (
                    <section id="favoritesSection">
                        <div className="section-header">
                            <h2>Favorites</h2>
                            <span id="favoritesCount">{favorites.length} Photos</span>
                        </div>

                        <div id="favorites" className="favorites-grid">
                            {favorites.map((photo, index) => (
                                <div
                                    key={photo.id || photo.thumb}
                                    className="photo favorite-card"
                                    onClick={() => viewer.openLightbox(favorites, index)}
                                >
                                    <img loading="lazy" src={photo.thumb} alt="" />
                                    <PhotoActions photo={photo} />
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </main>

            <PhotoViewer view={viewer.view} setView={viewer.setView} />
            <ScrollTopButton />
        </>
    );
}
