import { Suspense } from "react";
import type { Metadata } from "next";
import PixoraRoot from "../../../components/pixora/PixoraRoot";
import GalleryProvider from "../../../components/pixora/GalleryProvider";
import AlbumView from "../../../components/pixora/AlbumView";
import { safeDecode } from "../../../components/pixora/lib/params";

export const metadata: Metadata = {
    title: "Roselanes by Jeev | Pixora",
};

type Params = Promise<{ client: string; album: string }>;

// roselanesbyjeev.in/{client}/{album}   (album id "favorites" = all favorites)
export default function AlbumPage({ params }: { params: Params }) {
    return (
        <Suspense fallback={null}>
            <ClientAlbum params={params} />
        </Suspense>
    );
}

async function ClientAlbum({ params }: { params: Params }) {
    const { client, album } = await params;
    const albumId = safeDecode(album);

    return (
        <PixoraRoot>
            <GalleryProvider client={safeDecode(client)} errorTitle="Unable to load album">
                <AlbumView key={albumId} albumId={albumId} />
            </GalleryProvider>
        </PixoraRoot>
    );
}
