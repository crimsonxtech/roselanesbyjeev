import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { KanbanBoard } from "@/components/dashboard/kanban-board";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const quotes = await prisma.quote.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      events: { include: { services: true } },
      addOns: true,
    },
  });

  return (
    <div className="min-h-screen bg-[var(--primary-darkest)] p-6">
      <h1 className="mb-6 text-2xl font-semibold text-[var(--cream)]">
        Requests
      </h1>
      <KanbanBoard quotes={quotes} />
    </div>
  );
}