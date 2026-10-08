import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-session";
import { isSectionKey } from "@/lib/site-content";
import { parseSection, siteImages } from "@/lib/site-content-validate";
import { getSection } from "@/lib/site-content-server";
import { removeSiteAsset } from "@/lib/site-images";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ section: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  if (!(await requireSession()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { section } = await params;
  if (!isSectionKey(section)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = parseSection(section, await req.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const previous = await getSection(section);

  await prisma.siteContent.upsert({
    where: { section },
    create: { section, data: parsed.data as unknown as Prisma.InputJsonValue },
    update: { data: parsed.data as unknown as Prisma.InputJsonValue },
  });

  // Delete files that this save replaced (only ever files created from the dashboard).
  const stillUsed = new Set(siteImages(section, parsed.data).map((i) => i.key));
  await Promise.all(
    siteImages(section, previous)
      .filter((image) => image.key && !stillUsed.has(image.key))
      .map((image) => removeSiteAsset(image)),
  );

  revalidatePath("/");
  return NextResponse.json({ data: parsed.data });
}
