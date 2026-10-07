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

export async function POST(req: Request) {
  if (!(await requireSession()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const fields = parseFields(form);
  if ("error" in fields)
    return NextResponse.json({ error: fields.error }, { status: 400 });

  const file = form.get("image");
  if (!(file instanceof File) || file.size === 0)
    return NextResponse.json({ error: "Image is required" }, { status: 400 });

  let uploaded: { key: string; url: string };
  try {
    uploaded = await processAndUploadImage(file);
  } catch (err) {
    if (err instanceof ImageError)
      return NextResponse.json({ error: err.message }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: "Image upload failed" }, { status: 500 });
  }

  try {
    const last = await prisma.testimonial.aggregate({ _max: { position: true } });
    const created = await prisma.testimonial.create({
      data: {
        ...fields,
        imageUrl: uploaded.url,
        imageKey: uploaded.key,
        position: (last._max.position ?? -1) + 1,
      },
    });
    revalidatePath("/");
    return NextResponse.json(toDTO(created), { status: 201 });
  } catch (err) {
    console.error(err);
    await removeImage(uploaded.key); // don't leave an orphan behind
    return NextResponse.json({ error: "Could not save testimonial" }, { status: 500 });
  }
}