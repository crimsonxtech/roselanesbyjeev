import { NextResponse } from "next/server";
import { requireSession } from "@/lib/require-session";
import { SiteImageError, createSiteUploadUrl } from "@/lib/site-images";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!(await requireSession()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  try {
    return NextResponse.json(await createSiteUploadUrl(String(body?.contentType ?? "")));
  } catch (err) {
    if (err instanceof SiteImageError)
      return NextResponse.json({ error: err.message }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: "Could not start the upload" }, { status: 500 });
  }
}
