import { NextResponse } from "next/server";
import { requireSession } from "@/lib/require-session";
import { PortfolioError, createUploadUrl } from "@/lib/portfolio";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!(await requireSession()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  try {
    return NextResponse.json(await createUploadUrl(String(body?.contentType ?? "")));
  } catch (err) {
    if (err instanceof PortfolioError)
      return NextResponse.json({ error: err.message }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: "Could not start the upload" }, { status: 500 });
  }
}