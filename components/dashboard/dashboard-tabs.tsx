"use client";

import Link, { useLinkStatus } from "next/link";
import { Spinner } from "./spinner";

const TABS = [
  { key: "studio", label: "Studio", href: "/dashboard" },
  { key: "portfolio", label: "Portfolio", href: "/dashboard?section=portfolio" },
] as const;

function Pending() {
  const { pending } = useLinkStatus();
  return pending ? <Spinner className="h-3.5 w-3.5" /> : null;
}

export function DashboardTabs({ active }: { active: "studio" | "portfolio" }) {
  return (
    <nav aria-label="Dashboard sections" className="mb-8 flex gap-6 border-b border-neutral-800">
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={`-mb-px inline-flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors ${
              isActive
                ? "border-white text-white"
                : "border-transparent text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {tab.label}
            <Pending />
          </Link>
        );
      })}
    </nav>
  );
}
