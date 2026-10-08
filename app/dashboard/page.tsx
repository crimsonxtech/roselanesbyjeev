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
import { HeroEditor } from "@/components/dashboard/hero-editor";
import { AboutEditor } from "@/components/dashboard/about-editor";
import { ContactEditor } from "@/components/dashboard/contact-editor";
import { toDTO } from "@/lib/testimonials";
import { toPortfolioDTO } from "@/lib/portfolio-dto";
import { getSection } from "@/lib/site-content-server";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string; view?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { section, view } = await searchParams;

  const active =
    section === "portfolio" ? "portfolio" : "studio";

  const portfolioView =
    view === "gallery"
      ? "gallery"
      : view === "testimonials"
        ? "testimonials"
        : view === "about"
          ? "about"
          : view === "contact"
            ? "contact"
            : "home";

  return (
    <div
      data-dashboard
      className="min-h-screen bg-neutral-950 p-6 text-neutral-100"
    >
      <DashboardTabs active={active} />

      {active === "studio" && <StudioSection />}

      {active === "portfolio" && (
        <PortfolioSection view={portfolioView} />
      )}
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

async function PortfolioSection({
  view,
}: {
  view: "home" | "gallery" | "testimonials" | "about" | "contact";
}) {
  return (
    <>
      <PortfolioTabs active={view} />

      {view === "home" && <HomeView />}
      {view === "gallery" && <GalleryView />}
      {view === "testimonials" && <TestimonialsView />}
      {view === "about" && <AboutView />}
      {view === "contact" && <ContactView />}
    </>
  );
}

async function HomeView() {
  const hero = await getSection("hero");

  return (
    <>
      <h1 className="mb-6 text-xl font-semibold">Home page</h1>
      <HeroEditor initial={hero} />
    </>
  );
}

async function GalleryView() {
  const images = await prisma.portfolioImage.findMany({
    orderBy: { position: "asc" },
  });

  return (
    <>
      <h1 className="mb-6 text-xl font-semibold">Gallery</h1>
      <PortfolioManager initial={images.map(toPortfolioDTO)} />
    </>
  );
}

async function TestimonialsView() {
  const testimonials = await prisma.testimonial.findMany({
    orderBy: { position: "asc" },
  });

  return (
    <>
      <h1 className="mb-6 text-xl font-semibold">Testimonials</h1>
      <TestimonialsManager initial={testimonials.map(toDTO)} />
    </>
  );
}

async function AboutView() {
  const about = await getSection("about");

  return (
    <>
      <h1 className="mb-6 text-xl font-semibold">About</h1>
      <AboutEditor initial={about} />
    </>
  );
}

async function ContactView() {
  const contact = await getSection("contact");

  return (
    <>
      <h1 className="mb-6 text-xl font-semibold">Contact</h1>
      <ContactEditor initial={contact} />
    </>
  );
}