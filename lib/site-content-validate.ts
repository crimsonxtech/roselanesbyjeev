import { mediaUrl } from "@/lib/media";
import {
  DEFAULTS,
  MAX_PURPOSES,
  PURPOSE_ID_RE,
  SITE_MAIN_KEY_RE,
  SITE_ORIGINAL_KEY_RE,
  thumbKeyOf,
  type AboutContent,
  type ContactContent,
  type ContactPurpose,
  type HeroContent,
  type SectionKey,
  type SiteContentMap,
  type SiteImage,
} from "@/lib/site-content";

export class ValidationError extends Error {}

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : {};

/** Missing fields fall back to the default, so old saved data keeps working when fields are added later. */
function str(o: Obj, key: string, label: string, def: string, max: number, required = true): string {
  const raw = o[key];
  if (raw === undefined) return def;
  if (typeof raw !== "string") throw new ValidationError(`${label} must be text`);
  const v = raw.trim();
  if (required && !v) throw new ValidationError(`${label} is required`);
  if (v.length > max) throw new ValidationError(`${label} must be ${max} characters or fewer`);
  return v;
}

/** Like str, but an empty value means "use the default", so a button can never end up blank. */
function textOrDefault(o: Obj, key: string, label: string, def: string, max: number): string {
  const raw = o[key];
  if (raw === undefined) return def;
  if (typeof raw !== "string") throw new ValidationError(`${label} must be text`);
  const v = raw.trim();
  if (!v) return def;
  if (v.length > max) throw new ValidationError(`${label} must be ${max} characters or fewer`);
  return v;
}

/** For list items that have no default to fall back on. */
function given(o: Obj, key: string, label: string, max: number, required = true): string {
  const raw = o[key];
  if (raw === undefined || raw === null) {
    if (required) throw new ValidationError(`${label} is required`);
    return "";
  }
  return str(o, key, label, "", max, required);
}

function int(o: Obj, key: string, label: string, def: number, min: number, max: number): number {
  const raw = o[key];
  if (raw === undefined) return def;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < min || n > max)
    throw new ValidationError(`${label} must be a whole number between ${min} and ${max}`);
  return n;
}

function image(raw: unknown, def: SiteImage, label: string): SiteImage {
  const o = obj(raw);
  const key = str(o, "key", `${label} file`, def.key, 200, false);
  const alt = str(o, "alt", `${label} description`, def.alt, 120, false);

  if (key) {
    const main = SITE_MAIN_KEY_RE.exec(key);
    if (!main) throw new ValidationError(`${label}: invalid image`);

    let originalKey: string | undefined;
    const origRaw = o.originalKey;
    if (origRaw !== undefined && origRaw !== null && origRaw !== "") {
      const orig = typeof origRaw === "string" ? SITE_ORIGINAL_KEY_RE.exec(origRaw) : null;
      if (!orig || orig[1] !== main[1]) throw new ValidationError(`${label}: invalid image`);
      originalKey = origRaw as string;
    }

    return {
      key,
      url: mediaUrl(key), // never trust a client-supplied URL
      thumbUrl: mediaUrl(thumbKeyOf(key)),
      ...(originalKey ? { originalKey } : {}),
      width: int(o, "width", `${label} width`, def.width, 1, 12000),
      height: int(o, "height", `${label} height`, def.height, 1, 12000),
      alt,
    };
  }

  // Original (pre-dashboard) image: only the known default is allowed.
  return { key: "", url: def.url, thumbUrl: def.url, width: def.width, height: def.height, alt };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9][0-9 ()-]{5,18}$/;
const INSTAGRAM_RE = /^https:\/\/(www\.)?instagram\.com\/[^\s]*$/i;

export function parseHero(input: unknown): HeroContent {
  const o = obj(input);
  const d = DEFAULTS.hero;

  const statsIn = o.stats === undefined ? d.stats : o.stats;
  if (!Array.isArray(statsIn) || statsIn.length !== 3)
    throw new ValidationError("Exactly 3 statistics are required");

  const imagesIn = o.images === undefined ? d.images : o.images;
  if (!Array.isArray(imagesIn) || imagesIn.length !== 4)
    throw new ValidationError("Exactly 4 photos are required");

  const slot = ["Main photo", "Top-left photo", "Bottom-left photo", "Right photo"];

  return {
    tagline: str(o, "tagline", "Tagline", d.tagline, 70),
    headlineItalic: str(o, "headlineItalic", "Headline (small word)", d.headlineItalic, 12),
    headlineBrand: str(o, "headlineBrand", "Headline (highlighted word)", d.headlineBrand, 20),
    headlineLine2: str(o, "headlineLine2", "Headline (second line)", d.headlineLine2, 20),
    stats: statsIn.map((s, i) => {
      const so = obj(s);
      return {
        value: int(so, "value", `Statistic ${i + 1} number`, d.stats[i].value, 0, 99999),
        label: str(so, "label", `Statistic ${i + 1} label`, d.stats[i].label, 20),
      };
    }),
    primaryCta: textOrDefault(o, "primaryCta", "First button", d.primaryCta, 24),
    secondaryCta: textOrDefault(o, "secondaryCta", "Second button", d.secondaryCta, 28),
    images: imagesIn.map((img, i) => image(img, d.images[i], slot[i])),
  };
}

export function parseAbout(input: unknown): AboutContent {
  const o = obj(input);
  const d = DEFAULTS.about;
  return {
    headingItalic: str(o, "headingItalic", "Heading (first word)", d.headingItalic, 20),
    headingBrand: str(o, "headingBrand", "Heading (highlighted word)", d.headingBrand, 30),
    image: image(o.image === undefined ? d.image : o.image, d.image, "Founder photo"),
    founderName: str(o, "founderName", "Founder name", d.founderName, 40),
    founderTitle: str(o, "founderTitle", "Founder title", d.founderTitle, 60),
    intro: str(o, "intro", "Introduction", d.intro, 700),
    story: str(o, "story", "Story", d.story, 800),
    quote: str(o, "quote", "Quote", d.quote, 220),
    primaryCta: textOrDefault(o, "primaryCta", "First button", d.primaryCta, 24),
    secondaryCta: textOrDefault(o, "secondaryCta", "Second button", d.secondaryCta, 28),
  };
}

function parsePurposes(raw: unknown, def: ContactPurpose[]): ContactPurpose[] {
  const list = raw === undefined ? def : raw;
  if (!Array.isArray(list) || list.length < 1)
    throw new ValidationError("Keep at least one option in the Purpose dropdown");
  if (list.length > MAX_PURPOSES)
    throw new ValidationError(`The Purpose dropdown can have up to ${MAX_PURPOSES} options`);

  const seen = new Set<string>();
  return list.map((item, i) => {
    const o = obj(item);
    const n = i + 1;
    const id = given(o, "id", `Option ${n} id`, 40);
    if (!PURPOSE_ID_RE.test(id) || seen.has(id)) throw new ValidationError(`Option ${n} is invalid`);
    seen.add(id);
    return {
      id,
      name: given(o, "name", `Option ${n} name`, 30),
      label: given(o, "label", `Option ${n} message heading`, 80),
      placeholder: given(o, "placeholder", `Option ${n} message placeholder`, 160, false),
    };
  });
}

export function parseContact(input: unknown): ContactContent {
  const o = obj(input);
  const d = DEFAULTS.contact;

  const email = str(o, "email", "Email", d.email, 254);
  if (!EMAIL_RE.test(email)) throw new ValidationError("Enter a valid email address");

  const phone = str(o, "phone", "Phone number", d.phone, 20);
  if (!PHONE_RE.test(phone)) throw new ValidationError("Enter a valid phone number, e.g. +91 95500 44475");

  const whatsapp = str(o, "whatsapp", "WhatsApp number", d.whatsapp, 24).replace(/\D/g, "");
  if (whatsapp.length < 8 || whatsapp.length > 15)
    throw new ValidationError("WhatsApp number must be 8–15 digits including the country code");

  const instagramUrl = str(o, "instagramUrl", "Instagram link", d.instagramUrl, 200);
  if (!INSTAGRAM_RE.test(instagramUrl))
    throw new ValidationError("Instagram link must start with https://instagram.com/");

  return {
    headingItalic: str(o, "headingItalic", "Heading (first part)", d.headingItalic, 30),
    headingBrand: str(o, "headingBrand", "Heading (highlighted part)", d.headingBrand, 40),
    studioTitle: str(o, "studioTitle", "Studio location", d.studioTitle, 60),
    studioLine1: str(o, "studioLine1", "Studio line 1", d.studioLine1, 60, false),
    studioLine2: str(o, "studioLine2", "Studio line 2", d.studioLine2, 60, false),
    email,
    phone,
    phoneLabel: str(o, "phoneLabel", "Phone link text", d.phoneLabel, 30),
    whatsapp,
    whatsappMessage: str(o, "whatsappMessage", "WhatsApp message", d.whatsappMessage, 300, false),
    whatsappLabel: str(o, "whatsappLabel", "WhatsApp link text", d.whatsappLabel, 30),
    instagramUrl,
    instagramHandle: str(o, "instagramHandle", "Instagram handle", d.instagramHandle, 40),
    instagramLabel: str(o, "instagramLabel", "Instagram caption", d.instagramLabel, 40),
    replyNote: str(o, "replyNote", "Reply note", d.replyNote, 80, false),
    purposes: parsePurposes(o.purposes, d.purposes),
  };
}

const PARSERS = { hero: parseHero, about: parseAbout, contact: parseContact } as const;

export function parseSection(
  section: SectionKey,
  input: unknown,
): { ok: true; data: SiteContentMap[SectionKey] } | { ok: false; error: string } {
  try {
    return { ok: true, data: PARSERS[section](input) };
  } catch (err) {
    if (err instanceof ValidationError) return { ok: false, error: err.message };
    throw err;
  }
}

/** For reading from the database: a bad row never breaks the public site, it just uses the defaults. */
export function resolveSection<K extends SectionKey>(section: K, raw: unknown): SiteContentMap[K] {
  if (raw === null || raw === undefined) return DEFAULTS[section];
  try {
    return PARSERS[section](raw) as SiteContentMap[K];
  } catch (err) {
    console.error(`Saved "${section}" content is invalid, using defaults`, err);
    return DEFAULTS[section];
  }
}

/** Every dashboard-managed image in a section (used to delete replaced files). */
export function siteImages(section: SectionKey, content: SiteContentMap[SectionKey]): SiteImage[] {
  if (section === "hero") return (content as HeroContent).images;
  if (section === "about") return [(content as AboutContent).image];
  return [];
}
