// Pure data + types: safe to import from client components.

export type SectionKey = "hero" | "about" | "contact";

export type SiteImage = {
  /** Main (display) file, an R2 path relative to R2_BASE_PATH. Empty for the original images that predate the dashboard. */
  key: string;
  /** Large version: full-screen viewers, and the only version for single-file images. */
  url: string;
  /** Small version for on-page slots. Same as `url` when there is no separate thumbnail. */
  thumbUrl: string;
  /** Untouched upload, kept so photos can be re-optimised later. Home photos only. */
  originalKey?: string;
  width: number;
  height: number;
  alt: string;
};

export type HeroContent = {
  tagline: string;
  headlineItalic: string;
  headlineBrand: string;
  headlineLine2: string;
  stats: { value: number; label: string }[]; // exactly 3
  primaryCta: string;
  secondaryCta: string;
  images: SiteImage[]; // exactly 4: main, top-left, bottom-left, right
};

export type AboutContent = {
  headingItalic: string;
  headingBrand: string;
  image: SiteImage;
  founderName: string;
  founderTitle: string;
  intro: string;
  story: string;
  quote: string;
  primaryCta: string;
  secondaryCta: string;
};

export type ContactPurpose = {
  /** Stable id sent with the enquiry. Never changes when you rename the option. */
  id: string;
  /** Text in the dropdown, e.g. "For Enquiry". */
  name: string;
  /** Heading above the message box when this option is chosen. */
  label: string;
  /** Placeholder inside the message box when this option is chosen. */
  placeholder: string;
};

export type ContactContent = {
  headingItalic: string;
  headingBrand: string;
  studioTitle: string;
  studioLine1: string;
  studioLine2: string;
  email: string;
  phone: string;
  phoneLabel: string;
  whatsapp: string;
  whatsappMessage: string;
  whatsappLabel: string;
  instagramUrl: string;
  instagramHandle: string;
  instagramLabel: string;
  replyNote: string;
  purposes: ContactPurpose[]; // 1 to MAX_PURPOSES
};

export type SiteContentMap = {
  hero: HeroContent;
  about: AboutContent;
  contact: ContactContent;
};

export const SECTION_KEYS: SectionKey[] = ["hero", "about", "contact"];
export const isSectionKey = (v: string): v is SectionKey => (SECTION_KEYS as string[]).includes(v);

/** Files created from the dashboard: site/<id>/image.webp (single file) or site/<id>/display.webp (thumb + display pair). */
export const SITE_MAIN_KEY_RE = /^site\/([0-9a-f-]{36})\/(image|display)\.webp$/;
export const SITE_ORIGINAL_KEY_RE = /^site\/([0-9a-f-]{36})\/original\.(jpg|png|webp)$/;
/** Thumbnail path for a display file; single-file images return unchanged. */
export const thumbKeyOf = (key: string) => key.replace(/\/display\.webp$/, "/thumb.webp");

export const PURPOSE_ID_RE = /^[a-z0-9][a-z0-9-]{0,39}$/;
export const MAX_PURPOSES = 8;

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;
export const waHref = (digits: string, message: string) =>
  `https://wa.me/${digits.replace(/\D/g, "")}${message ? `?text=${encodeURIComponent(message)}` : ""}`;

const CDN = "https://images.roselanesbyjeev.in/roselanesbyjeev/portfolio";

/** The original images from before the dashboard existed: a single file, no stored original. */
const legacy = (url: string, alt: string, width: number, height: number): SiteImage => ({
  key: "",
  url,
  thumbUrl: url,
  width,
  height,
  alt,
});

/** Exactly what the website showed before these sections became editable. */
export const DEFAULTS: SiteContentMap = {
  hero: {
    tagline: "Luxé wedding and lifestyle photography",
    headlineItalic: "A",
    headlineBrand: "Wedding",
    headlineLine2: "Theory",
    stats: [
      { value: 500, label: "Events" },
      { value: 6, label: "Years" },
      { value: 120, label: "Clients" },
    ],
    primaryCta: "Get a Quote",
    secondaryCta: "Explore Portfolio →",
    images: [
      legacy(`${CDN}/hero/a39513c3-f6e6-4ee3-ad7a-742768d2e7c9.webp`, "Portrait of the Roselanes photographer", 1067, 1600),
      legacy(`${CDN}/hero/fdf149a3-93d9-487b-a14a-92554065b56f.webp`, "Roselanes wedding photography", 800, 1200),
      legacy(`${CDN}/hero/e90ddf4e-df1a-4248-b8ad-5809deeed47e.webp`, "Roselanes wedding photography", 800, 1200),
      legacy(`${CDN}/hero/0436c077-4616-4704-aca5-cd6a3513c7d6.webp`, "Roselanes wedding photography", 800, 1200),
    ],
  },
  about: {
    headingItalic: "About",
    headingBrand: "Roselanes",
    image: legacy(`${CDN}/about/08cf1a04-712f-4ca9-946a-888e109a2bdf.webp`, "Portrait of the Roselanes founder", 800, 1280),
    founderName: "Jeevan",
    founderTitle: "Founder & Lead Photographer",
    intro: "Roselanes by Jeev Photography is inspired by the language of a rose — where every petal speaks of love, every bloom holds an emotion, and every fragrance carries a feeling. Just like a rose, we believe the purest emotions deserve to be cherished. Through our frames, we preserve the love, laughter, tears, romance, and countless unspoken feelings that make every story beautifully yours.",
    story: "I know that one day, these photographs will become more than just photographs to you. Years from now, I want you to look back at a frame and feel it all again — the laughter, the tears, the nervous smiles, and the warmth of the people you love. For me, photography is not just about capturing what happened. It is about understanding your story and preserving the little emotions that make it truly yours. My promise is simple — to capture your day not just as it looked, but as your heart remembers it.",
    quote: "When the moment fades, let the feeling remain — blooming forever through every frame.",
    primaryCta: "Work With Us",
    secondaryCta: "View Portfolio →",
  },
  contact: {
    headingItalic: "Let's Create",
    headingBrand: "Something Beautiful",
    studioTitle: "Hyderabad, Telangana",
    studioLine1: "Roselanes by Jeev",
    studioLine2: "By Appointment Only",
    email: "roselanesbyjeev@gmail.com",
    phone: "+919550044475",
    phoneLabel: "Talk to Us",
    whatsapp: "919550044475",
    whatsappMessage: "Hi Roselanes by Jeev, I'd like to know more about your photography services.",
    whatsappLabel: "Chat with us",
    instagramUrl: "https://www.instagram.com/roselanes_by_jeev/",
    instagramHandle: "@roselanes_by_jeev",
    instagramLabel: "Follow our stories",
    replyNote: "Usually replies within 24 hours.",
    purposes: [
      {
        "id": "enquiry",
        "name": "For Enquiry",
        "label": "Let's create something worth remembering",
        "placeholder": "Wedding date, venue, event type, number of guests, your vision..."
      },
      {
        "id": "business",
        "name": "For Business",
        "label": "Let's build something beautiful together",
        "placeholder": "Tell us about your business, your idea, and how you'd like to collaborate with us..."
      },
      {
        "id": "careers",
        "name": "For Careers",
        "label": "Bring your talent to the frame",
        "placeholder": "Tell us about yourself, your experience, and how you'd like to be part of our team..."
      },
      {
        "id": "other",
        "name": "Other",
        "label": "Whatever's on your mind, we're listening",
        "placeholder": "Tell us what you're looking for and we'll take it from there..."
      }
    ],
  },
};
