import ContactSection from "@/components/contact-section";
import AboutSection from "@/components/about-section";
import HeroSection from "@/components/hero-section";
import { SiteBackground } from "@/components/site-background";
import SiteHeader from "@/components/site-header";
import { TestimonialsSection } from "@/components/testimonials-section";
import { QuoteSection } from "@/components/quote-section";
import { PortfolioSection } from "@/components/portfolio-section"; 
import Footer from "@/components/footer";

export default function Page() {
  return (
    <>
      <SiteBackground />
      <SiteHeader />
 
        <main className="relative z-[1] min-h-screen">
          <HeroSection />
          <PortfolioSection />
          <QuoteSection />
          <TestimonialsSection />
          <AboutSection />
          <ContactSection />
        </main> 
        <Footer />
    </>
  );
}
