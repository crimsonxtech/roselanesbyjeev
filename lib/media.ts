// Safe to import anywhere on the server (no S3 client, no sharp).
const HOST = (process.env.R2_PUBLIC_URL ?? "https://images.roselanesbyjeev.in").replace(/\/$/, "");
const BASE = (process.env.R2_BASE_PATH ?? "").replace(/^\/+|\/+$/g, "");

export const IMMUTABLE_CACHE = "public, max-age=31536000, immutable";

/** Public CDN URL for a path relative to R2_BASE_PATH. */
export function mediaUrl(path: string) {
  return `${HOST}/${BASE ? `${BASE}/` : ""}${path.replace(/^\/+/, "")}`;
}