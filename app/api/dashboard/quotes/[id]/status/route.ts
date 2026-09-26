import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { QuoteStatus } from "@/generated/prisma/client";

const VALID_STATUSES: QuoteStatus[] = [
  "NEW",
  "WAITLISTED",
  "REJECTED",
  "ACCEPTED",
  "CONFIRMED",
  "IN_PROGRESS",
  "FINISHED",
];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const status = body?.status;

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const quote = await prisma.quote.update({ where: { id }, data: { status } });
    return NextResponse.json({ success: true, quote });
  } catch (error) {
    console.error("Failed to update quote status:", error);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}