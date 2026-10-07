import ContactSection from "@/components/contact-section";
import AboutSection from "@/components/about-section";
import HeroSection from "@/components/hero-section";
import { SiteBackground } from "@/components/site-background";
import SiteHeader from "@/components/site-header";
import { TestimonialsSection } from "@/components/testimonials-section";
import { QuoteSection } from "@/components/quote-section";
import { PortfolioSection } from "@/components/portfolio-section";
import Footer from "@/components/footer";
import { prisma } from "@/lib/prisma";
import { toPortfolioDTO } from "@/lib/portfolio-dto";

// Dashboard edits call revalidatePath("/"), so changes show up immediately.
// This is only a safety net in case a revalidation is ever missed.
export const revalidate = 3600;

export default async function Page() {
  const [images, testimonials] = await Promise.all([
    prisma.portfolioImage.findMany({ orderBy: { position: "asc" } }),
    prisma.testimonial.findMany({ orderBy: { position: "asc" } }),
  ]);

  return (
    <>
      <SiteBackground />
      <SiteHeader />

      <main className="relative z-[1] min-h-screen">
        <HeroSection />
        {images.length > 0 && <PortfolioSection images={images.map(toPortfolioDTO)} />}
        <QuoteSection />
        {testimonials.length > 0 && (
          <TestimonialsSection
            testimonials={testimonials.map((t) => ({
              id: t.id,
              image: t.imageUrl,
              alt: t.name,
              quote: t.review,
              name: t.name,
              rating: t.rating,
            }))}
          />
        )}
        <AboutSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}