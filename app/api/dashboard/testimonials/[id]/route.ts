import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-session";
import {
  ImageError,
  parseFields,
  processAndUploadImage,
  removeImage,
  toDTO,
} from "@/lib/testimonials";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await requireSession()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.testimonial.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const form = await req.formData();
  const fields = parseFields(form);
  if ("error" in fields)
    return NextResponse.json({ error: fields.error }, { status: 400 });

  // Image is optional on edit: only replace when a new file is sent.
  const file = form.get("image");
  let uploaded: { key: string; url: string } | null = null;
  if (file instanceof File && file.size > 0) {
    try {
      uploaded = await processAndUploadImage(file);
    } catch (err) {
      if (err instanceof ImageError)
        return NextResponse.json({ error: err.message }, { status: 400 });
      console.error(err);
      return NextResponse.json({ error: "Image upload failed" }, { status: 500 });
    }
  }

  try {
    const updated = await prisma.testimonial.update({
      where: { id },
      data: {
        ...fields,
        ...(uploaded ? { imageUrl: uploaded.url, imageKey: uploaded.key } : {}),
      },
    });
    if (uploaded) await removeImage(existing.imageKey);
    revalidatePath("/");
    return NextResponse.json(toDTO(updated));
  } catch (err) {
    console.error(err);
    if (uploaded) await removeImage(uploaded.key);
    return NextResponse.json({ error: "Could not update testimonial" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await requireSession()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.testimonial.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Close the gap so positions stay 0..n-1
  await prisma.$transaction([
    prisma.testimonial.delete({ where: { id } }),
    prisma.testimonial.updateMany({
      where: { position: { gt: existing.position } },
      data: { position: { decrement: 1 } },
    }),
  ]);
  await removeImage(existing.imageKey);

  revalidatePath("/");
  return NextResponse.json({ ok: true });
}