// Pixora gallery config. Everything can be overridden with env vars
// (put them in .env.local), the values below are your current ones.

export const PIXORA_CONFIG = {
    // Public base URL of the R2 bucket / custom domain
    R2_BASE_URL:
        process.env.NEXT_PUBLIC_PIXORA_R2_BASE_URL ?? "https://cdn.roselanesbyjeev.in",

    // Folder inside the bucket: {R2_BASE_URL}/{PREFIX}/{client}/{GALLERY_FILE}
    PREFIX: process.env.NEXT_PUBLIC_PIXORA_PREFIX ?? "roselanesbyjeev",
    GALLERY_FILE: process.env.NEXT_PUBLIC_PIXORA_GALLERY_FILE ?? "temp.json",

    // Optional. A POST endpoint that writes the favorite flag back to R2
    // (your old Cloudflare Pages Function at /api/favorite). Leave empty and
    // favorites are simply remembered in the visitor's browser.
    FAVORITES_ENDPOINT: process.env.NEXT_PUBLIC_PIXORA_FAVORITES_ENDPOINT ?? "",
};
