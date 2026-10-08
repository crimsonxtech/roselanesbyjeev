import { NextResponse } from "next/server";
import { requireSession } from "@/lib/require-session";
import { mediaUrl } from "@/lib/media";
import { thumbKeyOf } from "@/lib/site-content";
import {
  SiteImageError,
  cleanupSiteUpload,
  isPreset,
  processSiteImage,
} from "@/lib/site-images";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Turns an uploaded original into the optimised WebP file(s). The page only stores them once you press Save. */
export async function POST(req: Request) {
  if (!(await requireSession()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const assetId = String(body?.assetId ?? "");
  const originalKey = String(body?.originalKey ?? "");
  const preset = body?.preset;
  if (!isPreset(preset))
    return NextResponse.json({ error: "Unknown image type" }, { status: 400 });

  try {
    const out = await processSiteImage(assetId, originalKey, preset);
    return NextResponse.json({
      key: out.key,
      url: mediaUrl(out.key),
      thumbUrl: mediaUrl(thumbKeyOf(out.key)),
      originalKey: out.originalKey,
      width: out.width,
      height: out.height,
    });
  } catch (err) {
    await cleanupSiteUpload(assetId, originalKey);
    if (err instanceof SiteImageError)
      return NextResponse.json({ error: err.message }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: "Could not process the image" }, { status: 500 });
  }
}
