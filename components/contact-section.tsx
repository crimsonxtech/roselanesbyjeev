"use client";

import * as React from "react";
import {
  Mail,
  MapPin,
  Phone,
  Instagram,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const glass =
  "border border-[var(--glass-border)] bg-[var(--glass-bg)] shadow-[0_18px_45px_rgba(0,0,0,.28),inset_0_1px_0_rgba(255,255,255,.07)]";

const glassBlur = `${glass} backdrop-blur-xl`;

const purposeContent = {
  enquiry: {
    label: "Let's create something worth remembering",
    placeholder:
      "Wedding date, venue, event type, number of guests, your vision...",
  },
  business: {
    label: "Let's build something beautiful together",
    placeholder:
      "Tell us about your business, your idea, and how you'd like to collaborate with us...",
  },
  careers: {
    label: "Bring your talent to the frame",
    placeholder:
      "Tell us about yourself, your experience, and how you'd like to be part of our team...",
  },
  other: {
    label: "Whatever's on your mind, we're listening",
    placeholder:
      "Tell us what you're looking for and we'll take it from there...",
  },
} as const;

type Purpose = keyof typeof purposeContent;

function ContactCard({
  icon,
  label,
  children,
  active,
  onActivate,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  active: boolean;
  onActivate: () => void;
}) {
  const lastPointerType = React.useRef<string>("mouse");

  return (
    <div
      data-contact-card
      data-reveal
      data-reveal-group="contact-sidebar"
      data-reveal-stagger="100"
      onPointerDown={(e) => {
        lastPointerType.current = e.pointerType;
      }}
      onClick={() => {
        if (lastPointerType.current !== "touch") return;
        onActivate();
      }}
      className={`
        group relative overflow-hidden rounded-[18px] p-5 sm:p-6
        ${glassBlur}
        transition-all duration-300
        hover:-translate-y-1
        hover:border-[var(--secondary)]/35
        hover:shadow-[0_25px_55px_rgba(0,0,0,.38)]
        focus-within:-translate-y-1
        focus-within:border-[var(--secondary)]/35
        focus-within:shadow-[0_25px_55px_rgba(0,0,0,.38)]
        ${
          active
            ? "-translate-y-1 border-[var(--secondary)]/35 shadow-[0_25px_55px_rgba(0,0,0,.38)]"
            : ""
        }
      `}
    >
      <span
        className={`
          pointer-events-none absolute left-3 top-3 h-4 w-4
          border-l border-t border-transparent
          transition-all duration-300
          group-hover:border-[var(--secondary-light)]/60
          group-focus-within:border-[var(--secondary-light)]/60
          ${
            active
              ? "border-l-[var(--secondary-light)]/60 border-t-[var(--secondary-light)]/60"
              : ""
          }
        `}
      />

      <span
        className={`
          pointer-events-none absolute bottom-3 right-3 h-4 w-4
          border-b border-r border-transparent
          transition-all duration-300
          group-hover:border-[var(--secondary-light)]/60
          group-focus-within:border-[var(--secondary-light)]/60
          ${
            active
              ? "border-b-[var(--secondary-light)]/60 border-r-[var(--secondary-light)]/60"
              : ""
          }
        `}
      />

      <div className="mb-2.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--secondary)]">
        <span
          className={`
            flex size-[26px] shrink-0 items-center justify-center
            rounded-full
            border border-[var(--glass-border)]
            bg-white/[0.045]
            text-[var(--secondary-light)]
            transition-all duration-300
            group-hover:border-[var(--secondary-light)]/50
            group-hover:bg-[var(--secondary-light)]/10
            group-hover:shadow-[0_0_14px_rgba(210,184,133,.32)]
            group-focus-within:border-[var(--secondary-light)]/50
            group-focus-within:bg-[var(--secondary-light)]/10
            group-focus-within:shadow-[0_0_14px_rgba(210,184,133,.32)]
            ${
              active
                ? "border-[var(--secondary-light)]/50 bg-[var(--secondary-light)]/10 shadow-[0_0_14px_rgba(210,184,133,.32)]"
                : ""
            }
          `}
        >
          {icon}
        </span>

        <span className="flex h-[26px] items-center leading-none">
          {label}
        </span>
      </div>

      {children}
    </div>
  );
}

/* -------------------------------------------------------------
   Smooth dynamic purpose-label transition
------------------------------------------------------------- */

function AnimatedPurposeLabel({ text }: { text: string }) {
  const [displayText, setDisplayText] = React.useState(text);
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    if (text === displayText) return;

    // First move the current text out.
    setVisible(false);

    // Once the old text has faded/moved away,
    // replace it and bring the new text in.
    const timeout = window.setTimeout(() => {
      setDisplayText(text);
      setVisible(true);
    }, 160);

    return () => window.clearTimeout(timeout);
  }, [text, displayText]);

  return (
    <span
      className={`
        block
        transition-all duration-300 ease-out
        ${
          visible
            ? "translate-y-0 opacity-100"
            : "-translate-y-1 opacity-0"
        }
      `}
    >
      {displayText}
    </span>
  );
}

const inputClass =
  "h-[54px] w-full rounded-[10px] border border-[var(--glass-border)] bg-[var(--input-bg)] px-4 text-[15px] font-medium text-[var(--cream)] outline-none transition-all duration-300 placeholder:text-[var(--placeholder)] focus:border-[var(--secondary-light)] focus:bg-[var(--input-focus-bg)] focus:ring-4 focus:ring-[var(--secondary)]/15";

export default function ContactSection() {
  const [purpose, setPurpose] = React.useState<Purpose | "">("");
  const [purposeError, setPurposeError] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [status, setStatus] = React.useState("");
  const [activeCard, setActiveCard] = React.useState<string | null>(null);
  const successRef = React.useRef<HTMLDivElement>(null);

  // Reset the tap-simulated "hover" state whenever the user taps
  // ANYWHERE else on the page (not just inside this section), so a
  // card never gets stuck active after switching focus elsewhere.
  React.useEffect(() => {
    if (!activeCard) return;

    const handleOutsideTap = (event: PointerEvent) => {
      if (event.pointerType !== "touch") return;
      const target = event.target as HTMLElement;
      if (target.closest("[data-contact-card]")) return;
      setActiveCard(null);
    };

    document.addEventListener("pointerdown", handleOutsideTap);
    return () => document.removeEventListener("pointerdown", handleOutsideTap);
  }, [activeCard]);

  const currentPurpose =
    purpose === "" ? purposeContent.enquiry : purposeContent[purpose];

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = e.currentTarget;

    if (!purpose) {
      setPurposeError(true);
      setStatus("Please select a purpose.");
      return;
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    setSubmitting(true);
    setStatus("");

    const data = new FormData(form);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: data.get("name"),
          phone: data.get("phone"),
          email: data.get("email"),
          purpose,
          message: data.get("message"),
        }),
      });

      let payload: { message?: string } = {};

      try {
        payload = await response.json();
      } catch {}

      if (!response.ok) {
        throw new Error(
          payload.message ||
            "Unable to send your enquiry. Please try again."
        );
      }

      form.reset();
      setPurpose("");
      setPurposeError(false);
      setSuccess(true);

      requestAnimationFrame(() => successRef.current?.focus());
    } catch (err) {
      setStatus(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="px-5 pb-0 pt-[calc(var(--header-offset,0px)+var(--header-height,100px)+var(--section-header-gap,0px))] sm:px-6 lg:px-8"
    >
      <div className="mx-auto w-full max-w-[1240px]">
        <header data-reveal className="mb-8 min-w-0 sm:mb-9">
<h2
  id="contact-heading"
  className="min-w-0 max-w-full font-display text-[clamp(2.1rem,8vw,3.3rem)] font-medium leading-[1.05] tracking-[-0.02em] text-[var(--cream)]"
>
  <span className="italic whitespace-nowrap">
    Let&apos;s Create
  </span>{" "}
  <span className="font-brand inline whitespace-nowrap text-[clamp(2.5rem,10vw,4.3rem)] leading-none text-[var(--secondary-light)]">
    Something Beautiful
  </span>
</h2>
</header>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(300px,340px)_minmax(0,1fr)] lg:gap-10">
          <aside className="order-2 flex min-w-0 flex-col gap-4 lg:order-1">
            <ContactCard
              icon={<MapPin className="size-[13px]" aria-hidden="true" />}
              label="Studio Address"
              active={activeCard === "studio"}
              onActivate={() =>
                setActiveCard(activeCard === "studio" ? null : "studio")
              }
            >
              <h3 className="mb-2 text-lg font-bold leading-[1.3] text-[var(--cream)]">
                Hyderabad, Telangana
              </h3>

              <p className="m-0 text-sm font-medium leading-[1.6] text-[var(--cream)]/60">
                Roselanes by Jeev
                <br />
                By Appointment Only
              </p>
            </ContactCard>

            <ContactCard
              icon={<Mail className="size-[13px]" aria-hidden="true" />}
              label="Email"
              active={activeCard === "email"}
              onActivate={() =>
                setActiveCard(activeCard === "email" ? null : "email")
              }
            >
              <a
                href="mailto:roselanesbyjeev@gmail.com"
                className="block break-words text-[15px] font-bold leading-[1.4] text-[var(--cream)] outline-none transition-colors hover:text-[var(--secondary-light)] focus-visible:text-[var(--secondary-light)] focus-visible:ring-2 focus-visible:ring-[var(--secondary-light)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded-sm"
              >
                roselanesbyjeev@gmail.com
              </a>
            </ContactCard>

            <div className="grid grid-cols-2 gap-4">
              <ContactCard
                icon={<Phone className="size-[13px]" aria-hidden="true" />}
                label="Phone"
                active={activeCard === "phone"}
                onActivate={() =>
                  setActiveCard(activeCard === "phone" ? null : "phone")
                }
              >
                <a
                  href="tel:+919550044475"
                  className="block text-[14px] font-bold leading-[1.4] text-[var(--cream)] outline-none hover:text-[var(--secondary-light)] focus-visible:text-[var(--secondary-light)] focus-visible:ring-2 focus-visible:ring-[var(--secondary-light)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded-sm"
                >
                  Talk to Us
                </a>
              </ContactCard>

              <ContactCard
                icon={
                  <svg
                    viewBox="0 0 24 24"
                    className="size-[14px]"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.198.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.149-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.008-.372-.01-.57-.01-.198 0-.52.075-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.626.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982 1-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.986 2.894a9.825 9.825 0 012.893 6.994c-.002 5.45-4.437 9.883-9.885 9.883m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.89c0 2.096.547 4.142 1.588 5.945L.057 24l6.304-1.654a11.875 11.875 0 005.684 1.448h.005c6.554 0 11.89-5.335 11.893-11.89a11.84 11.84 0 00-3.479-8.416" />
                  </svg>
                }
                label="WhatsApp"
                active={activeCard === "whatsapp"}
                onActivate={() =>
                  setActiveCard(
                    activeCard === "whatsapp" ? null : "whatsapp"
                  )
                }
              >
                <a
                  href="https://wa.me/919550044475?text=Hi%20Roselanes%20by%20Jeev%2C%20I%27d%20like%20to%20know%20more%20about%20your%20photography%20services."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-[14px] font-bold leading-[1.4] text-[var(--cream)] outline-none hover:text-[var(--secondary-light)] focus-visible:text-[var(--secondary-light)] focus-visible:ring-2 focus-visible:ring-[var(--secondary-light)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded-sm"
                >
                  Chat with us
                </a>
              </ContactCard>
            </div>

            <a
              href="https://www.instagram.com/roselanes_by_jeev/"
              target="_blank"
              rel="noopener noreferrer"
              data-reveal
              data-reveal-group="contact-sidebar"
              data-reveal-stagger="100"
              className="flex min-h-[30px] items-center justify-center gap-2 text-[var(--cream)]/70 transition-colors hover:text-[var(--secondary-light)]"
            >
              <div className="flex h-5 items-center justify-center">
                <Instagram className="size-5" aria-hidden="true" />
              </div>

              <div className="flex h-5 items-center justify-center">
                <span className="text-[9px] font-extrabold uppercase leading-5 tracking-[0.14em] text-[var(--secondary)]">
                  Follow our stories
                </span>
              </div>

              <div className="flex h-5 items-center justify-center">
                <span className="text-xs font-extrabold leading-5">
                  @roselanes_by_jeev
                </span>
              </div>
            </a>

            <div
              className="flex items-center gap-3 px-3 py-3 text-xs font-medium leading-[1.4] text-[var(--cream)]/50"
            >
              <span className="relative size-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.8)]">
                <span className="absolute -inset-1.5 animate-ping rounded-full border border-emerald-400/70" />
              </span>
              Usually replies within 24 hours.
            </div>
          </aside>

          <div
            data-reveal
            data-reveal-delay="150"
            className={`${glass} order-1 relative min-w-0 overflow-hidden rounded-[18px] p-5 sm:p-7 lg:order-2 lg:p-9`}
          >
            {!success ? (
              <form
                className="flex flex-col gap-4"
                onSubmit={onSubmit}
                aria-busy={submitting}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full Name" htmlFor="contact-name">
                    <input
                      className={inputClass}
                      type="text"
                      id="contact-name"
                      name="name"
                      placeholder="Your full name"
                      autoComplete="name"
                      maxLength={100}
                      required
                    />
                  </Field>

                  <Field label="Phone Number" htmlFor="contact-phone">
                    <input
                      className={inputClass}
                      type="tel"
                      id="contact-phone"
                      name="phone"
                      placeholder="+91 XXXXX XXXXX"
                      autoComplete="tel"
                      inputMode="tel"
                      maxLength={20}
                      required
                    />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-[2.5fr_1.5fr]">
                  <Field label="Email" htmlFor="contact-email">
                    <input
                      className={inputClass}
                      type="email"
                      id="contact-email"
                      name="email"
                      placeholder="Your email address"
                      autoComplete="email"
                      maxLength={254}
                      required
                    />
                  </Field>

                  <Field label="Purpose" htmlFor="contact-purpose">
                    <Select
                      value={purpose}
                      onValueChange={(value) => {
                        setPurpose(value as Purpose);
                        setPurposeError(false);
                        setStatus("");
                      }}
                    >
                      <SelectTrigger
                        id="contact-purpose"
                        aria-label="Purpose"
                        aria-invalid={purposeError}
                        aria-describedby={
                          status ? "contact-status" : undefined
                        }
                      >
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="enquiry">
                          For Enquiry
                        </SelectItem>

                        <SelectItem value="business">
                          For Business
                        </SelectItem>

                        <SelectItem value="careers">
                          For Careers
                        </SelectItem>

                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <Field
                  label={
                    <AnimatedPurposeLabel
                      text={currentPurpose.label}
                    />
                  }
                  htmlFor="contact-message"
                >
                  <textarea
                    className={`${inputClass} h-[120px] min-h-[120px] resize-none overflow-y-auto py-4`}
                    id="contact-message"
                    name="message"
                    placeholder={currentPurpose.placeholder}
                    maxLength={2000}
                  />
                </Field>

                {status && (
                  <p
                    id="contact-status"
                    role="alert"
                    className="m-0 text-sm text-[var(--error)]"
                  >
                    {status}
                  </p>
                )}

                <Button
  type="submit"
  disabled={submitting}
  className="mt-1 min-h-[52px] w-auto max-w-full touch-manipulation self-center px-6 text-[15px] !font-[400] normal-case tracking-normal !text-[var(--primary-darkest)] [&_svg]:!size-[20px] !text-[var(--primary-darkest)] lg:self-start lg:translate-x-4"
>
                  <Send className="mr-2 size-3.5" aria-hidden="true" />
                  {submitting ? "Sending..." : "Send Query"}
                </Button>
              </form>
            ) : (
              <div
  ref={successRef}
  tabIndex={-1}
  role="status"
  className="mx-auto flex w-full max-w-[760px] flex-col items-center py-4 text-center outline-none sm:py-6 lg:flex-row lg:items-stretch lg:text-left"
>
  {/* -------------------------------------------------------
      LOGO
  ------------------------------------------------------- */}
  <div className="flex w-full shrink-0 items-center justify-center lg:w-[230px]">
    <div className="flex size-[150px] items-center justify-center sm:size-[170px] lg:size-[190px]">
      <img
        src="/brand/icon.png"
        alt="Roselanes by Jeev"
        className="size-full object-contain"
      />
    </div>
  </div>

  {/* -------------------------------------------------------
      SEPARATOR
      Vertical on desktop / horizontal on mobile
  ------------------------------------------------------- */}
  <div
  aria-hidden="true"
  className="my-7 h-[2px] w-[72%] bg-[var(--secondary-light)] lg:my-0 lg:mx-8 lg:h-auto lg:w-[2px] lg:self-stretch"
/>

  {/* -------------------------------------------------------
      CONTENT
  ------------------------------------------------------- */}
  <div className="flex min-w-0 flex-1 flex-col items-center justify-center lg:items-start">
    <span className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--secondary)]">
      Message Received —
    </span>

    <h3 className="m-0 font-brand text-[clamp(2rem,5vw,2.7rem)] leading-[1.05] text-[var(--cream)]">
      Thanks for reaching out
    </h3>

    <p className="mt-4 max-w-[480px] text-sm font-medium leading-[1.75] text-[var(--cream)]/65">
      We&apos;ll take a thoughtful look and get back to you shortly.
    </p>

    <p className="mt-2 max-w-[460px] text-xs leading-[1.7] text-[var(--cream)]/45">
      Until then, take a little time to explore the stories we&apos;ve
      captured...
    </p>

    <p className="mt-5 font-brand text-[22px] leading-none text-[var(--secondary-light)]">
      with love, Roselanes!
    </p>

    {/* -----------------------------------------------------
        CTA BUTTONS
    ----------------------------------------------------- */}
    <div className="mt-7 flex w-full max-w-[480px] flex-row gap-2.5 lg:max-w-[440px]">
  <Button
    asChild
    className="!min-w-0 !min-h-[46px] flex-1 !px-3 font-bold normal-case !text-[0.68rem] !tracking-[0.04em] sm:!px-4 sm:!text-[0.8rem]"
  >
    <a
      href="#portfolio"
      className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap"
    >
      View Portfolio
    </a>
  </Button>

  <Button
    asChild
    variant="secondary"
    className="!min-w-0 !min-h-[46px] flex-1 !px-3 font-bold normal-case !text-[0.68rem] !tracking-[0.04em] sm:!px-4 sm:!text-[0.8rem]"
  >
    <a
      href="https://www.instagram.com/roselanes_by_jeev/"
      target="_blank"
      rel="noopener noreferrer"
      className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap"
    >
      Follow on Instagram
    </a>
  </Button>
</div>
  </div>
</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: React.ReactNode;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label
        htmlFor={htmlFor}
        className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--secondary)]"
      >
        {label}
      </label>

      {children}
    </div>
  );
}
