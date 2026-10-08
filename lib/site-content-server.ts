import { prisma } from "@/lib/prisma";
import { resolveSection } from "@/lib/site-content-validate";
import type { SectionKey, SiteContentMap } from "@/lib/site-content";

export async function getSection<K extends SectionKey>(section: K): Promise<SiteContentMap[K]> {
  const row = await prisma.siteContent.findUnique({ where: { section } });
  return resolveSection(section, row?.data);
}

/** One query for the public home page. Anything never edited uses the built-in defaults. */
export async function getSiteContent(): Promise<SiteContentMap> {
  const rows = await prisma.siteContent.findMany();
  const bySection = new Map<string, unknown>(rows.map((r) => [r.section, r.data]));
  return {
    hero: resolveSection("hero", bySection.get("hero")),
    about: resolveSection("about", bySection.get("about")),
    contact: resolveSection("contact", bySection.get("contact")),
  };
}
