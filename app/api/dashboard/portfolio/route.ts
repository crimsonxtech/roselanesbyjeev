import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-session";
import { toPortfolioDTO } from "@/lib/portfolio-dto";
import { PortfolioError, buildVariants, normalizeAlt, removeAsset } from "@/lib/portfolio";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Called after the browser has PUT the original straight to R2. */
export async function POST(req: Request) {
  if (!(await requireSession()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const assetId = String(body?.assetId ?? "");
  const originalKey = String(body?.originalKey ?? "");
  const alt = normalizeAlt(body?.alt);
  if (!alt)
    return NextResponse.json({ error: "Caption is required (80 characters max)" }, { status: 400 });

  try {
    const { width, height } = await buildVariants(assetId, originalKey);
    const last = await prisma.portfolioImage.aggregate({ _max: { position: true } });
    const created = await prisma.portfolioImage.create({
      data: {
        assetId,
        alt,
        width,
        height,
        originalKey,
        position: (last._max.position ?? -1) + 1,
      },
    });
    revalidatePath("/");
    return NextResponse.json(toPortfolioDTO(created), { status: 201 });
  } catch (err) {
    await removeAsset(assetId, originalKey); // don't leave orphans behind
    if (err instanceof PortfolioError)
      return NextResponse.json({ error: err.message }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: "Could not save the photo" }, { status: 500 });
  }
}