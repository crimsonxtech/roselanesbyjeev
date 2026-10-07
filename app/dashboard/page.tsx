import "./dashboard.css";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { KanbanBoard } from "@/components/dashboard/kanban-board";
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";
import { PortfolioTabs } from "@/components/dashboard/portfolio-tabs";
import { PortfolioManager } from "@/components/dashboard/portfolio-manager";
import { TestimonialsManager } from "@/components/dashboard/testimonials-manager";
import { toDTO } from "@/lib/testimonials";
import { toPortfolioDTO } from "@/lib/portfolio-dto";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string; view?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { section, view } = await searchParams;
  const active = section === "portfolio" ? "portfolio" : "studio";
  const portfolioView = view === "testimonials" ? "testimonials" : "gallery";

  return (
    <div data-dashboard className="min-h-screen bg-neutral-950 p-6 text-neutral-100">
      <DashboardTabs active={active} />
      {active === "studio" ? <StudioSection /> : <PortfolioSection view={portfolioView} />}
    </div>
  );
}

async function StudioSection() {
  const quotes = await prisma.quote.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      events: { include: { services: true } },
      addOns: true,
    },
  });

  return (
    <>
      <h1 className="mb-6 text-xl font-semibold">Requests</h1>
      <KanbanBoard quotes={quotes} />
    </>
  );
}

async function PortfolioSection({ view }: { view: "gallery" | "testimonials" }) {
  return (
    <>
      <PortfolioTabs active={view} />
      {view === "gallery" ? <GalleryView /> : <TestimonialsView />}
    </>
  );
}

async function GalleryView() {
  const images = await prisma.portfolioImage.findMany({ orderBy: { position: "asc" } });
  return (
    <>
      <h1 className="mb-6 text-xl font-semibold">Gallery</h1>
      <PortfolioManager initial={images.map(toPortfolioDTO)} />
    </>
  );
}

async function TestimonialsView() {
  const testimonials = await prisma.testimonial.findMany({ orderBy: { position: "asc" } });
  return (
    <>
      <h1 className="mb-6 text-xl font-semibold">Testimonials</h1>
      <TestimonialsManager initial={testimonials.map(toDTO)} />
    </>
  );
}