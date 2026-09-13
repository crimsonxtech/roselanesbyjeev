import type { Metadata } from "next";
import "./globals.css";
import { CustomCursor } from "@/components/custom-cursor";
import { ScrollRevealProvider } from "@/hooks/ScrollRevealProvider";

export const metadata: Metadata = {
  title: "Roselanes by Jeev | Pixtack",
  description: "Luxe Wedding and Lifestyle Photography",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <CustomCursor />
        <ScrollRevealProvider />
        {children}
      </body>
    </html>
  );
}
