import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-session";
import { toPortfolioDTO } from "@/lib/portfolio-dto";
import { PortfolioError, buildVariants, normalizeAlt, removeAsset } from "@/lib/portfolio";

export const runtime = "nodejs";
export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

/** Body: { alt } to rename, plus optional { replace: { assetId, originalKey } } to swap the photo. */
export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await requireSession()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.portfolioImage.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const alt = normalizeAlt(body?.alt);
  if (!alt)
    return NextResponse.json({ error: "Caption is required (80 characters max)" }, { status: 400 });

  const replace = body?.replace as { assetId?: string; originalKey?: string } | undefined;

  try {
    let data: { alt: string; assetId?: string; width?: number; height?: number; originalKey?: string } = { alt };

    if (replace?.assetId && replace.originalKey) {
      const { width, height } = await buildVariants(replace.assetId, replace.originalKey);
      data = { alt, assetId: replace.assetId, width, height, originalKey: replace.originalKey };
    }

    const updated = await prisma.portfolioImage.update({ where: { id }, data });
    if (data.assetId) await removeAsset(existing.assetId, existing.originalKey);
    revalidatePath("/");
    return NextResponse.json(toPortfolioDTO(updated));
  } catch (err) {
    if (replace?.assetId) await removeAsset(replace.assetId, replace.originalKey);
    if (err instanceof PortfolioError)
      return NextResponse.json({ error: err.message }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: "Could not update the photo" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await requireSession()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.portfolioImage.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Close the gap so positions stay 0..n-1
  await prisma.$transaction([
    prisma.portfolioImage.delete({ where: { id } }),
    prisma.portfolioImage.updateMany({
      where: { position: { gt: existing.position } },
      data: { position: { decrement: 1 } },
    }),
  ]);
  await removeAsset(existing.assetId, existing.originalKey);

  revalidatePath("/");
  return NextResponse.json({ ok: true });
}