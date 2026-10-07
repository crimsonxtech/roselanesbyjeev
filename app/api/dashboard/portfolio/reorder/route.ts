import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-session";

export const runtime = "nodejs";

export async function PUT(req: Request) {
  if (!(await requireSession()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const ids: unknown = body?.ids;
  if (!Array.isArray(ids) || ids.some((i) => typeof i !== "string"))
    return NextResponse.json({ error: "ids must be a string array" }, { status: 400 });

  const total = await prisma.portfolioImage.count();
  if (new Set(ids).size !== ids.length || ids.length !== total)
    return NextResponse.json(
      { error: "List is out of date, refresh and try again" },
      { status: 409 }
    );

  await prisma.$transaction(
    (ids as string[]).map((id, position) =>
      prisma.portfolioImage.update({ where: { id }, data: { position } })
    )
  );

  revalidatePath("/");
  return NextResponse.json({ ok: true });
}