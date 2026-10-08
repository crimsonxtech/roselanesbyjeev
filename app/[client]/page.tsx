import { Suspense } from "react";
import type { Metadata } from "next";
import PixoraRoot from "../../components/pixora/PixoraRoot";
import GalleryProvider from "../../components/pixora/GalleryProvider";
import GalleryHome from "../../components/pixora/GalleryHome";
import { safeDecode } from "../../components/pixora/lib/params";

export const metadata: Metadata = {
    title: "Roselanes by Jeev | Pixora",
};

type Params = Promise<{ client: string }>;

// roselanesbyjeev.in/{client}  →  loads {R2}/{prefix}/{client}/temp.json
export default function ClientGalleryPage({ params }: { params: Params }) {
    // Reading params at request time must sit inside <Suspense> (Next 15/16).
    return (
        <Suspense fallback={null}>
            <ClientGallery params={params} />
        </Suspense>
    );
}

async function ClientGallery({ params }: { params: Params }) {
    const { client } = await params;

    return (
        <PixoraRoot>
            <GalleryProvider client={safeDecode(client)} showPreloader>
                <GalleryHome />
            </GalleryProvider>
        </PixoraRoot>
    );
}
