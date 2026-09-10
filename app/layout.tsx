import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Roselanes by Jeev — Contact",
  description: "Contact Roselanes by Jeev",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
