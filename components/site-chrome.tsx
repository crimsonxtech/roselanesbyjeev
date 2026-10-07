"use client";

import { usePathname } from "next/navigation";
import { CustomCursor } from "@/components/custom-cursor";
import { DisableInteractions } from "@/components/disable-interactions";

/** Website-only behaviour (custom cursor, right-click/copy blocking). Off for the admin screens. */
export function SiteChrome() {
  const pathname = usePathname();
  if (pathname?.startsWith("/dashboard") || pathname?.startsWith("/login")) return null;

  return (
    <>
      <DisableInteractions />
      <CustomCursor />
    </>
  );
}