import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CustomCursor } from "@/components/custom-cursor";
import { ScrollRevealProvider } from "@/hooks/ScrollRevealProvider";
import { DisableInteractions } from "@/components/disable-interactions";

export const metadata: Metadata = {
  title: "Roselanes by Jeev | Pixtack",
  description: "Luxe Wedding and Lifestyle Photography",
};

/* Keep Safari's browser chrome and the display-cutout area in the brand colour. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  /* Safari browser UI cannot show a gradient; use the artwork's dark top tone
     so the status/search chrome blends into the page rather than appearing
     as a separate bright strip. */
  themeColor: "#5c0c24",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <DisableInteractions />
        <CustomCursor />
        <ScrollRevealProvider />
        {children}
      </body>
    </html>
  );
}