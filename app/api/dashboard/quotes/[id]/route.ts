import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Snapshot = {
  name: string;
  phone: string;
  email: string;
  additionalEmail: string;
  budget: string;
  message: string;
  events: {
    id: string;
    label: string;
    date: string;
    timeOfDay: string;
    venue: string;
    services: { name: string; qty: number }[];
  }[];
  addOns: { name: string; qty: number }[];
};

const byName = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name);

function clampQty(value: unknown) {
  return Math.max(1, Math.min(5, Number(value) || 1));
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = await params;
  const body = await request.json();

  if (!body.name || !body.phone || !body.email || !body.budget) {
    return NextResponse.json(
      {
        success: false,
        error: "Name, phone, email and budget are required.",
      },
      { status: 400 }
    );
  }

  if (!Array.isArray(body.events) || body.events.length === 0) {
    return NextResponse.json(
      {
        success: false,
        error: "At least one event is required.",
      },
      { status: 400 }
    );
  }

  const email = String(body.email || "").trim().toLowerCase();
  const additionalEmail = String(body.additionalEmail || "")
    .trim()
    .toLowerCase();

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    return NextResponse.json(
      {
        success: false,
        error: "Please enter a valid email address.",
      },
      { status: 400 }
    );
  }

  if (additionalEmail) {
    if (!emailPattern.test(additionalEmail)) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter a valid additional email address.",
        },
        { status: 400 }
      );
    }

    if (additionalEmail === email) {
      return NextResponse.json(
        {
          success: false,
          error: "Additional email must be different from the main email.",
        },
        { status: 400 }
      );
    }

    if (additionalEmail.length > 254) {
      return NextResponse.json(
        {
          success: false,
          error: "Additional email address is too long.",
        },
        { status: 400 }
      );
    }
  }

  // Normalise the incoming payload once, so the same values are used for
  // both the change detection and the database writes.
  const incomingEvents = body.events.map(
    (event: {
      id?: string;
      label?: string;
      date?: string;
      timeOfDay?: string;
      venue?: string;
      services?: { name: string; qty: number }[];
    }) => ({
      id: event.id as string | undefined,
      label: String(event.label || "Custom Event").trim(),
      date: String(event.date || ""),
      timeOfDay: String(event.timeOfDay || ""),
      venue: String(event.venue || "").trim(),
      services: (Array.isArray(event.services) ? event.services : []).map(
        (service) => ({
          name: String(service.name || "").trim(),
          qty: clampQty(service.qty),
        })
      ),
    })
  );

  const incomingAddOns = (Array.isArray(body.addOns) ? body.addOns : [])
    .filter((addon: { name: string }) => String(addon.name || "").trim())
    .map((addon: { name: string; qty: number }) => ({
      name: String(addon.name).trim(),
      qty: clampQty(addon.qty),
    }));

  try {
    const quote = await prisma.$transaction(
      async (tx) => {
        // Load the current quote so we can tell whether this save
        // actually changed anything.
        const current = await tx.quote.findUnique({
          where: { id },
          include: {
            events: { include: { services: true } },
            addOns: true,
          },
        });

        if (!current) {
          throw new Error("Quote not found.");
        }

        // ---- Change detection -------------------------------------------
        const hasNewEvent = incomingEvents.some(
          (event: { id?: string }) => !event.id
        );

        const before: Snapshot = {
          name: current.name,
          phone: current.phone,
          email: current.email,
          additionalEmail: current.additionalEmail ?? "",
          budget: current.budget,
          message: current.message ?? "",
          events: current.events
            .map((ev) => ({
              id: ev.id,
              label: ev.label,
              date: ev.date ?? "",
              timeOfDay: ev.timeOfDay ?? "",
              venue: ev.venue ?? "",
              services: ev.services
                .map((s) => ({ name: s.name, qty: s.qty }))
                .sort(byName),
            }))
            .sort((a, b) => a.id.localeCompare(b.id)),
          addOns: current.addOns
            .map((a) => ({ name: a.name, qty: a.qty }))
            .sort(byName),
        };

        const after: Snapshot = {
          name: String(body.name).trim(),
          phone: String(body.phone).trim(),
          email,
          additionalEmail,
          budget: String(body.budget).trim(),
          message: String(body.message || "").trim(),
          events: incomingEvents
            .map((ev: (typeof incomingEvents)[number]) => ({
              id: ev.id ?? "",
              label: ev.label,
              date: ev.date,
              timeOfDay: ev.timeOfDay,
              venue: ev.venue,
              services: [...ev.services].sort(byName),
            }))
            .sort((a: { id: string }, b: { id: string }) =>
              a.id.localeCompare(b.id)
            ),
          addOns: [...incomingAddOns].sort(byName),
        };

        const changed =
          hasNewEvent || JSON.stringify(before) !== JSON.stringify(after);

        // ---- Writes -----------------------------------------------------
        const incomingIds = incomingEvents
          .map((event: { id?: string }) => event.id)
          .filter(Boolean);

        // Remove events deleted by the admin.
        // Existing events are updated below so their productionStage
        // is preserved.
        await tx.quoteEvent.deleteMany({
          where: {
            quoteId: id,
            ...(incomingIds.length
              ? { id: { notIn: incomingIds } }
              : {}),
          },
        });

        // Update/create events.
        for (const event of incomingEvents) {
          const eventData = {
            label: event.label,
            date: event.date,
            timeOfDay: event.timeOfDay,
            venue: event.venue,
          };

          if (event.id) {
            await tx.quoteEvent.update({
              where: { id: event.id },
              data: {
                ...eventData,
                services: {
                  deleteMany: {},
                  create: event.services,
                },
              },
            });
          } else {
            await tx.quoteEvent.create({
              data: {
                quoteId: id,
                ...eventData,
                services: {
                  create: event.services,
                },
              },
            });
          }
        }

        // Replace add-ons.
        await tx.quoteAddOn.deleteMany({
          where: { quoteId: id },
        });

        if (incomingAddOns.length > 0) {
          await tx.quoteAddOn.createMany({
            data: incomingAddOns.map(
              (addon: { name: string; qty: number }) => ({
                quoteId: id,
                name: addon.name,
                qty: addon.qty,
              })
            ),
          });
        }

        // Update the main quote.
        // If anything changed, clear confirmationSentAt so the quotation
        // email becomes "pending" again and can be re-sent with the changes.
        return tx.quote.update({
          where: { id },
          data: {
            name: after.name,
            phone: after.phone,
            email,
            additionalEmail: additionalEmail || null,
            budget: after.budget,
            message: after.message,
            ...(changed ? { confirmationSentAt: null } : {}),
          },
          include: {
            events: {
              include: {
                services: true,
              },
            },
            addOns: true,
          },
        });
      },
      {
        // Prisma's default is 5000 ms.
        // This quote editor can perform many DB operations,
        // so allow up to 15 seconds for the transaction.
        timeout: 15000,
      }
    );

    return NextResponse.json({
      success: true,
      quote,
    });
  } catch (error) {
    console.error("QUOTE EDIT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update quote.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.quote.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!existing) {
        throw new Error("Quote not found.");
      }

      // Delete children first so this works even if the schema
      // doesn't have onDelete: Cascade on every relation.
      // Event services are removed with their events (the PATCH handler
      // above already relies on this).
      await tx.quoteEvent.deleteMany({ where: { quoteId: id } });
      await tx.quoteAddOn.deleteMany({ where: { quoteId: id } });
      await tx.quote.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("QUOTE DELETE ERROR:", error);

    const message =
      error instanceof Error ? error.message : "Failed to delete quote.";

    return NextResponse.json(
      { success: false, error: message },
      { status: message === "Quote not found." ? 404 : 500 }
    );
  }
}