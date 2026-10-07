import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { putR2Object, deleteR2Object } from "@/lib/r2";
import { IMMUTABLE_CACHE, mediaUrl } from "@/lib/media";

/**
 * Card is 330px wide (390px on hover) x 420px tall.
 * At 2x retina that is ~780x840, so we crop to 4:5 at 800x1000.
 * Quality 80 keeps faces/skin clean at roughly 70-130 KB per image.
 */
export const TESTIMONIAL_IMAGE = { width: 800, height: 1000, quality: 80 } as const;

export const REVIEW_MAX = 320; // the website card shows ~190px of text
export const NAME_MAX = 60;
export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

// Stored under R2_BASE_PATH by lib/r2.ts -> images.roselanesbyjeev.in/<base>/portfolio/testimonials/<uuid>.webp
const TESTIMONIAL_DIR = "portfolio/testimonials";

export type TestimonialDTO = {
  id: string;
  name: string;
  rating: number;
  review: string;
  imageUrl: string;
  position: number;
};

export function toDTO(t: TestimonialDTO): TestimonialDTO {
  const { id, name, rating, review, imageUrl, position } = t;
  return { id, name, rating, review, imageUrl, position };
}

export class ImageError extends Error {}

export function parseFields(form: FormData):
  | { name: string; rating: number; review: string }
  | { error: string } {
  const name = String(form.get("name") ?? "").trim();
  const review = String(form.get("review") ?? "").trim();
  const rating = Number(form.get("rating"));

  if (!name) return { error: "Name is required" };
  if (name.length > NAME_MAX) return { error: `Name must be ${NAME_MAX} characters or fewer` };
  if (!review) return { error: "Review is required" };
  if (review.length > REVIEW_MAX) return { error: `Review must be ${REVIEW_MAX} characters or fewer` };
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    return { error: "Rating must be between 1 and 5" };

  return { name, rating, review };
}

/** Converts any uploaded image to the testimonial WebP and uploads it to R2. */
export async function processAndUploadImage(file: File) {
  if (file.size > MAX_UPLOAD_BYTES) throw new ImageError("Image is too large (max 12 MB)");

  let webp: Buffer;
  try {
    webp = await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate() // respect EXIF orientation
      .resize(TESTIMONIAL_IMAGE.width, TESTIMONIAL_IMAGE.height, {
        fit: "cover",
        position: sharp.strategy.attention, // keeps faces in frame
      })
      .webp({ quality: TESTIMONIAL_IMAGE.quality, effort: 5 })
      .toBuffer();
  } catch {
    throw new ImageError("That file isn't a valid image");
  }

  const path = `${TESTIMONIAL_DIR}/${randomUUID()}.webp`;
  await putR2Object(path, webp, "image/webp", IMMUTABLE_CACHE);
  return { key: path, url: mediaUrl(path) };
}

/** Best-effort cleanup — never fail a request over an orphaned file. */
export async function removeImage(path: string) {
  try {
    await deleteR2Object(path);
  } catch (err) {
    console.error("Failed to delete R2 object", path, err);
  }
}