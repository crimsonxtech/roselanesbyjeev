import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  if (!body.name || !body.phone || !body.email || !body.budget) {
    return NextResponse.json(
      { success: false, error: "Name, phone, email and budget are required." },
      { status: 400 }
    );
  }

  if (!Array.isArray(body.events) || body.events.length === 0) {
    return NextResponse.json(
      { success: false, error: "At least one event is required." },
      { status: 400 }
    );
  }

  try {
    const quote = await prisma.$transaction(async (tx) => {
      const current = await tx.quote.findUnique({
        where: { id },
        include: { events: true },
      });

      if (!current) throw new Error("Quote not found.");

      const incomingIds = body.events
        .map((event: { id?: string }) => event.id)
        .filter(Boolean);

      // Remove events deleted by the admin. Existing event records are
      // updated below so their productionStage is preserved.
      await tx.quoteEvent.deleteMany({
        where: {
          quoteId: id,
          ...(incomingIds.length
            ? { id: { notIn: incomingIds } }
            : {}),
        },
      });

      for (const event of body.events) {
        const eventData = {
          label: String(event.label || "Custom Event").trim(),
          date: String(event.date || ""),
          timeOfDay: String(event.timeOfDay || ""),
          venue: String(event.venue || "").trim(),
        };

        if (event.id) {
          await tx.quoteEvent.update({
            where: { id: event.id },
            data: {
              ...eventData,
              services: {
                deleteMany: {},
                create: (Array.isArray(event.services) ? event.services : []).map(
                  (service: { name: string; qty: number }) => ({
                    name: String(service.name || "").trim(),
                    qty: Math.max(1, Math.min(5, Number(service.qty) || 1)),
                  })
                ),
              },
            },
          });
        } else {
          await tx.quoteEvent.create({
            data: {
              quoteId: id,
              ...eventData,
              services: {
                create: (Array.isArray(event.services) ? event.services : []).map(
                  (service: { name: string; qty: number }) => ({
                    name: String(service.name || "").trim(),
                    qty: Math.max(1, Math.min(5, Number(service.qty) || 1)),
                  })
                ),
              },
            },
          });
        }
      }

      await tx.quoteAddOn.deleteMany({ where: { quoteId: id } });

      await tx.quoteAddOn.createMany({
        data: (Array.isArray(body.addOns) ? body.addOns : [])
          .filter((addon: { name: string }) => String(addon.name || "").trim())
          .map((addon: { name: string; qty: number }) => ({
            quoteId: id,
            name: String(addon.name).trim(),
            qty: Math.max(1, Math.min(5, Number(addon.qty) || 1)),
          })),
      });

      return tx.quote.update({
        where: { id },
        data: {
          name: String(body.name).trim(),
          phone: String(body.phone).trim(),
          email: String(body.email).trim(),
          budget: String(body.budget).trim(),
          message: String(body.message || "").trim(),
        },
        include: {
          events: { include: { services: true } },
          addOns: true,
        },
      });
    });

    return NextResponse.json({ success: true, quote });
  } catch (error) {
    console.error("QUOTE EDIT ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update quote.",
      },
      { status: 500 }
    );
  }
}
