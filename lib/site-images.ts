import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2, R2_CONFIG, r2Key, getR2Object, putR2Object, deleteR2Object } from "@/lib/r2";
import { IMMUTABLE_CACHE } from "@/lib/media";
import { GALLERY_IMAGE } from "@/lib/portfolio";
import {
  SITE_MAIN_KEY_RE,
  SITE_ORIGINAL_KEY_RE,
  thumbKeyOf,
  type SiteImage,
} from "@/lib/site-content";

/**
 * Home photos use the same pipeline as the gallery: a small thumbnail for the
 * page, a large "display" WebP for the full-screen viewer (the gallery's own
 * display settings, so tuning GALLERY_IMAGE changes both), and the untouched
 * original kept in R2 so photos can be re-optimised later.
 *
 * heroMain  thumb 800px wide  -> shown ~394 css px wide, so 800 covers 2x screens
 * heroFloat thumb 400px wide  -> shown ~90-150 css px wide, so 400 covers 3x phones
 *
 * The thumbnails are served as-is (next/image `unoptimized`), so they are
 * encoded exactly once instead of being re-compressed by the image optimiser.
 *
 * about is shown in a 5:8 frame about 330px wide, so it is cropped to 5:8 at
 * 800x1280 around the face. One file, original not kept.
 */
export const SITE_IMAGE_PRESETS = {
  heroMain: { kind: "pair", thumbWidth: 800, thumbQuality: 80 },
  heroFloat: { kind: "pair", thumbWidth: 400, thumbQuality: 76 },
  about: { kind: "single", width: 800, height: 1280, quality: 80 },
} as const;

export type SitePreset = keyof typeof SITE_IMAGE_PRESETS;
export const isPreset = (v: unknown): v is SitePreset =>
  typeof v === "string" && Object.prototype.hasOwnProperty.call(SITE_IMAGE_PRESETS, v);

const MAX_BYTES = 60 * 1024 * 1024;
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export class SiteImageError extends Error {}

export async function createSiteUploadUrl(contentType: string) {
  const ext = EXT_BY_TYPE[contentType];
  if (!ext) throw new SiteImageError("Only JPG, PNG or WebP files are supported");

  const assetId = randomUUID();
  const originalKey = `site/${assetId}/original.${ext}`;
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

export type ProcessedSiteImage = {
  key: string;
  originalKey?: string;
  width: number;
  height: number;
};

/** Reads the uploaded original from R2 and writes the optimised WebP file(s). */
export async function processSiteImage(
  assetId: string,
  originalKey: string,
  preset: SitePreset,
): Promise<ProcessedSiteImage> {
  const match = SITE_ORIGINAL_KEY_RE.exec(originalKey);
  if (!match || match[1] !== assetId) throw new SiteImageError("Invalid upload");

  let bytes: Uint8Array;
  try {
    const obj = await getR2Object(originalKey);
    if ((obj.ContentLength ?? 0) > MAX_BYTES) throw new SiteImageError("Image is too large (max 60 MB)");
    bytes = await obj.Body!.transformToByteArray();
  } catch (err) {
    if (err instanceof SiteImageError) throw err;
    throw new SiteImageError("Uploaded file was not found. Try again.");
  }

  const p = SITE_IMAGE_PRESETS[preset];
  const base = sharp(bytes, { failOn: "error", limitInputPixels: 400_000_000 }).rotate();

  if (p.kind === "single") {
    let data: Buffer;
    let width: number;
    let height: number;
    try {
      const out = await base
        .resize({ width: p.width, height: p.height, fit: "cover", position: sharp.strategy.attention })
        .webp({ quality: p.quality, effort: 6, smartSubsample: true })
        .toBuffer({ resolveWithObject: true });
      data = out.data;
      width = out.info.width;
      height = out.info.height;
    } catch {
      throw new SiteImageError("That file isn't a valid image");
    }

    const key = `site/${assetId}/image.webp`;
    await putR2Object(key, data, "image/webp", IMMUTABLE_CACHE);
    await removeKey(originalKey);
    return { key, width, height };
  }

  let thumb: Buffer;
  let display: Buffer;
  let width: number;
  let height: number;
  try {
    const [thumbOut, displayOut] = await Promise.all([
      base
        .clone()
        .resize({ width: p.thumbWidth, withoutEnlargement: true })
        .sharpen({ sigma: 0.5 })
        .webp({ quality: p.thumbQuality, effort: 5, smartSubsample: true })
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
    throw new SiteImageError("That file isn't a valid image");
  }

  const key = `site/${assetId}/display.webp`;
  await Promise.all([
    putR2Object(thumbKeyOf(key), thumb, "image/webp", IMMUTABLE_CACHE),
    putR2Object(key, display, "image/webp", IMMUTABLE_CACHE),
  ]);
  return { key, originalKey, width, height };
}

async function removeKey(path: string) {
  try {
    await deleteR2Object(path);
  } catch (err) {
    console.error("Failed to delete R2 object", path, err);
  }
}

/** Deletes every file belonging to an image. Only ever touches files this feature created. */
export async function removeSiteAsset(image: Pick<SiteImage, "key" | "originalKey">) {
  if (!SITE_MAIN_KEY_RE.test(image.key)) return;
  const paths = new Set<string>([image.key, thumbKeyOf(image.key)]);
  if (image.originalKey && SITE_ORIGINAL_KEY_RE.test(image.originalKey)) paths.add(image.originalKey);
  await Promise.all([...paths].map(removeKey));
}

/** Clean-up after a failed upload: removes whatever was written for this asset id. */
export async function cleanupSiteUpload(assetId: string, originalKey: string) {
  if (!SITE_ORIGINAL_KEY_RE.test(originalKey)) return;
  await Promise.all(
    [originalKey, `site/${assetId}/image.webp`, `site/${assetId}/display.webp`, `site/${assetId}/thumb.webp`].map(removeKey),
  );
}
