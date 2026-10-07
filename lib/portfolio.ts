import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  r2,
  R2_CONFIG,
  r2Key,
  getR2Object,
  putR2Object,
  deleteR2Object,
} from "@/lib/r2";
import { IMMUTABLE_CACHE } from "@/lib/media";
import { galleryPath } from "@/lib/portfolio-dto";

/**
 * Photography-grade WebP settings.
 *
 * thumb   640px wide  q76  -> grid is ~300 css px wide on desktop (2x = 600px)
 *                             and ~190 css px on phones (3x = 570px)
 * display 2400px long q82  -> covers a 2x laptop (3024x1964) lightbox fit
 *
 * smartSubsample keeps chroma detail on edges (red fabric, jewellery, lashes)
 * that plain 4:2:0 subsampling smears. effort 6 squeezes ~5-8% more out of the
 * same quality. Embedded colour profiles (P3 / AdobeRGB) are converted to sRGB
 * so colours match in every browser.
 */
export const GALLERY_IMAGE = {
  thumb: { width: 640, quality: 76, effort: 5 },
  display: { longEdge: 2400, quality: 82, effort: 6 },
} as const;

export const ALT_MAX = 80;
export const ORIGINAL_MAX_BYTES = 60 * 1024 * 1024;

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const ORIGINAL_KEY_RE = /^portfolio\/gallery\/([0-9a-f-]{36})\/original\.(jpg|png|webp)$/;

export class PortfolioError extends Error {}

export function normalizeAlt(value: unknown): string | null {
  const alt = typeof value === "string" ? value.trim() : "";
  return alt && alt.length <= ALT_MAX ? alt : null;
}

/** Presigned PUT so the (large) original goes browser -> R2 directly. */
export async function createUploadUrl(contentType: string) {
  const ext = EXT_BY_TYPE[contentType];
  if (!ext) throw new PortfolioError("Only JPG, PNG or WebP files are supported");

  const assetId = randomUUID();
  const originalKey = galleryPath(assetId, `original.${ext}`);
  const uploadUrl = await getSignedUrl(
    r2,
    new PutObjectCommand({
      Bucket: R2_CONFIG.bucket,
      Key: r2Key(originalKey),
      ContentType: contentType,
    }),
    { expiresIn: 600 },
  );

  return { assetId, originalKey, uploadUrl };
}

/** Reads the uploaded original from R2 and writes the thumb + display WebPs. */
export async function buildVariants(assetId: string, originalKey: string) {
  const match = ORIGINAL_KEY_RE.exec(originalKey);
  if (!match || match[1] !== assetId) throw new PortfolioError("Invalid upload");

  let bytes: Uint8Array;
  try {
    const obj = await getR2Object(originalKey);
    if ((obj.ContentLength ?? 0) > ORIGINAL_MAX_BYTES)
      throw new PortfolioError("Image is too large (max 60 MB)");
    bytes = await obj.Body!.transformToByteArray();
  } catch (err) {
    if (err instanceof PortfolioError) throw err;
    throw new PortfolioError("Uploaded file was not found. Try again.");
  }

  let thumb: Buffer;
  let display: Buffer;
  let width: number;
  let height: number;
  try {
    const base = sharp(bytes, { failOn: "error", limitInputPixels: 400_000_000 }).rotate();

    const [thumbOut, displayOut] = await Promise.all([
      base
        .clone()
        .resize({ width: GALLERY_IMAGE.thumb.width, withoutEnlargement: true })
        .sharpen({ sigma: 0.5 })
        .webp({
          quality: GALLERY_IMAGE.thumb.quality,
          effort: GALLERY_IMAGE.thumb.effort,
          smartSubsample: true,
        })
        .toBuffer(),
      base
        .clone()
        .resize({
          width: GALLERY_IMAGE.display.longEdge,
          height: GALLERY_IMAGE.display.longEdge,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({
          quality: GALLERY_IMAGE.display.quality,
          effort: GALLERY_IMAGE.display.effort,
          smartSubsample: true,
        })
        .toBuffer({ resolveWithObject: true }),
    ]);

    thumb = thumbOut;
    display = displayOut.data;
    width = displayOut.info.width;
    height = displayOut.info.height;
  } catch {
    throw new PortfolioError("That file isn't a valid image");
  }

  await Promise.all([
    putR2Object(galleryPath(assetId, "thumb.webp"), thumb, "image/webp", IMMUTABLE_CACHE),
    putR2Object(galleryPath(assetId, "display.webp"), display, "image/webp", IMMUTABLE_CACHE),
  ]);

  return { width, height };
}

/** Best-effort: remove every file for an asset. Never throws. */
export async function removeAsset(assetId: string, originalKey?: string | null) {
  const paths = [galleryPath(assetId, "thumb.webp"), galleryPath(assetId, "display.webp")];
  if (originalKey) paths.push(originalKey);
  const results = await Promise.allSettled(paths.map((p) => deleteR2Object(p)));
  results.forEach((r, i) => {
    if (r.status === "rejected") console.error("Failed to delete R2 object", paths[i], r.reason);
  });
}