import { prisma } from "@/lib/prisma";
import { getR2Object } from "@/lib/r2";
import { galleryPath } from "@/lib/portfolio-dto";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

function slug(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "photo";
}

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const row = await prisma.portfolioImage.findUnique({ where: { id } });
  if (!row) return new Response("Not found", { status: 404 });

  // Older images have no stored original, so fall back to the display version.
  const path = row.originalKey ?? galleryPath(row.assetId, "display.webp");

  try {
    const obj = await getR2Object(path);
    if (!obj.Body) return new Response("Not found", { status: 404 });

    const ext = path.split(".").pop() ?? "jpg";
    const filename = `roselanes-${slug(row.alt)}-${row.assetId.slice(0, 8)}.${ext}`;

    const headers: Record<string, string> = {
      "Content-Type": obj.ContentType ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "public, max-age=3600",
    };
    if (obj.ContentLength) headers["Content-Length"] = String(obj.ContentLength);

    return new Response(obj.Body.transformToWebStream() as unknown as ReadableStream, { headers });
  } catch (err) {
    console.error("Download failed", path, err);
    return new Response("File not available", { status: 404 });
  }
}