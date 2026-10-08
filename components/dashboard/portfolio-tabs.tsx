"use client";

import Link, { useLinkStatus } from "next/link";
import { Spinner } from "./spinner";

const VIEWS = [
  { key: "home", label: "Home", href: "/dashboard?section=portfolio&view=home" },
  { key: "gallery", label: "Gallery", href: "/dashboard?section=portfolio&view=gallery" },
  { key: "testimonials", label: "Testimonials", href: "/dashboard?section=portfolio&view=testimonials" },
  { key: "about", label: "About", href: "/dashboard?section=portfolio&view=about" },
  { key: "contact", label: "Contact", href: "/dashboard?section=portfolio&view=contact" },
] as const;

function Pending() {
  const { pending } = useLinkStatus();
  return pending ? <Spinner className="h-3 w-3" /> : null;
}

export function PortfolioTabs({ active }: { active: "home" | "gallery" | "testimonials" | "about" | "contact" }) {
  return (
    <nav aria-label="Portfolio views" className="mb-6 inline-flex gap-1 rounded-md border border-neutral-800 p-1">
      {VIEWS.map((v) => (
        <Link
          key={v.key}
          href={v.href}
          aria-current={v.key === active ? "page" : undefined}
          className={`inline-flex items-center gap-2 rounded px-3 py-1 text-xs font-medium transition-colors ${
            v.key === active ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-neutral-300"
          }`}
        >
          {v.label}
          <Pending />
        </Link>
      ))}
    </nav>
  );
}