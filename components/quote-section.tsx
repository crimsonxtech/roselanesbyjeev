"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  X,
  Plus,
  Minus,
  Trash2,
  Send,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ==========================================================
   SHARED STYLE TOKENS
   Mirrors contact-section.tsx exactly so both forms feel like
   one system.
   ========================================================== */

const glass =
  "border border-[var(--glass-border)] bg-[var(--glass-bg)] shadow-[0_18px_45px_rgba(0,0,0,.28),inset_0_1px_0_rgba(255,255,255,.07)]";

const glassBlur = `${glass} backdrop-blur-xl`;

const inputClass =
  "h-[54px] w-full rounded-[10px] border border-[var(--glass-border)] bg-[var(--input-bg)] px-4 text-[15px] font-medium text-[var(--cream)] outline-none transition-all duration-300 placeholder:text-[var(--placeholder)] focus:border-[var(--secondary-light)] focus:bg-[var(--input-focus-bg)] focus:ring-4 focus:ring-[var(--secondary)]/15";

const chipBase =
  "inline-flex min-h-[34px] items-center gap-1 rounded-full border px-3.5 py-1.5 text-xs font-medium leading-tight transition-all duration-200";

const chipDefault =
  "border-[var(--glass-border)] bg-black/20 text-[var(--cream)]/80 hover:border-[var(--secondary)]/60 hover:text-[var(--cream)]";

const chipSelected =
  "border-[var(--secondary)] bg-gradient-to-br from-[var(--secondary-light)] to-[var(--secondary)] text-[var(--primary-darkest)] font-semibold shadow-[0_4px_14px_rgba(0,0,0,.20)]";

const chipAdd =
  "border-dashed border-[var(--secondary-light)]/50 bg-transparent text-[var(--secondary-light)] hover:border-[var(--secondary-light)]";

/* ==========================================================
   CATALOGS
   ========================================================== */

const BUDGET_OPTIONS = [
  "3.5 lakhs - 5 lakhs",
  "5 lakhs - 7 lakhs",
  "7 lakhs - 10 lakhs",
] as const;

const EVENT_TYPES = [
  "Wedding",
  "Pre-Wedding",
  "Bride ceremony",
  "Groom ceremony",
  "Haldi",
  "Groom haldi",
  "Bride haldi",
  "Engagement",
  "Reception",
  "Sangeet",
  "Mehendi",
] as const;

const CUSTOM_EVENT_VALUE = "__custom__";

const SERVICE_CATALOG = [
  "Traditional Photography",
  "Traditional Videography",
  "Drone Coverage",
  "Cinematic Videography",
  "Candid Photography",
  "LED Wall",
  "Instant Reels",
];

const ADDON_CATALOG = [
  "Extra Photographer",
  "Extra Videographer",
  "Photo Album",
  "Framed Prints",
  "Same-Day Edit",
  "Extra Hour Coverage",
];

/* ==========================================================
   TYPES
   ========================================================== */

type ServiceItem = { name: string; qty: number; custom: boolean };

type EventItem = {
  id: number;
  type: string;
  customType: string;
  isCustomType: boolean;
  date: string;
  venue: string;
  services: ServiceItem[];
};

type AddOnItem = { name: string; qty: number; custom: boolean };

type SummaryLine = {
  label: string;
  date: string;
  venue: string;
  services: { name: string; qty: number }[];
};

type SummaryData = {
  lines: SummaryLine[];
  addOns: { name: string; qty: number }[];
  budget: string;
};

const STORAGE_KEY = "roselanes.quote.session.v3";

let uid = 1;
const nextId = () => uid++;

function newEvent(): EventItem {
  return {
    id: nextId(),
    type: EVENT_TYPES[0],
    customType: "",
    isCustomType: false,
    date: "",
    venue: "",
    services: [],
  };
}

function eventLabel(ev: EventItem) {
  return ev.isCustomType
    ? ev.customType.trim() || "Custom Event"
    : ev.type;
}

function formatDate(iso: string) {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* ==========================================================
   FIELD — same label treatment as the contact form
   ========================================================== */

function Field({
  label,
  htmlFor,
  optional,
  children,
}: {
  label: string;
  htmlFor?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label
        htmlFor={htmlFor}
        className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--secondary)]"
      >
        {label}
        {optional && (
          <span className="ml-1.5 text-[9px] font-medium normal-case tracking-normal text-[var(--cream)]/45">
            (optional)
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

/* ==========================================================
   STEPPER — qty control shared by services and add-ons
   ========================================================== */

function Stepper({
  value,
  onDecrease,
  onIncrease,
  onRemove,
  min = 1,
  max = 5,
}: {
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  onRemove: () => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={onDecrease}
        disabled={value <= min}
        aria-label="Decrease quantity"
        className="flex size-[25px] items-center justify-center rounded-full border border-[var(--glass-border)] text-[var(--cream)] transition-colors hover:border-[var(--secondary)] hover:text-[var(--secondary-light)] disabled:cursor-default disabled:opacity-25"
      >
        <Minus className="size-3" />
      </button>

      <span className="min-w-[16px] text-center text-sm font-semibold text-[var(--secondary-light)]">
        {value}
      </span>

      <button
        type="button"
        onClick={onIncrease}
        disabled={value >= max}
        aria-label="Increase quantity"
        className="flex size-[25px] items-center justify-center rounded-full border border-[var(--glass-border)] text-[var(--cream)] transition-colors hover:border-[var(--secondary)] hover:text-[var(--secondary-light)] disabled:cursor-default disabled:opacity-25"
      >
        <Plus className="size-3" />
      </button>

      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove"
        className="p-1 text-[var(--cream)]/35 transition-colors hover:text-red-300"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}

/* ==========================================================
   MAIN COMPONENT
   ========================================================== */

export function QuoteSection() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [sending, setSending] = React.useState(false);

  // ---- Bottom-sheet drag / minimize / mini-player ----
  const [sheetState, setSheetState] = React.useState<"partial" | "expanded">(
    "partial"
  );
  const [isDragging, setIsDragging] = React.useState(false);
  const [isMinimizing, setIsMinimizing] = React.useState(false);
  const [dragY, setDragY] = React.useState(0);
  const [showMiniPlayer, setShowMiniPlayer] = React.useState(false);

  // ---- Toast ----
  const [toast, setToast] = React.useState<string | null>(null);
  const toastTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  // ---- Section 1: Your Details (same shape as ContactSection) ----
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [budget, setBudget] = React.useState<string>("");
  const [message, setMessage] = React.useState("");

  // ---- Section 2: Events ----
  const [events, setEvents] = React.useState<EventItem[]>([newEvent()]);
  const [customServiceOpen, setCustomServiceOpen] = React.useState<
    Record<number, boolean>
  >({});
  const [customServiceDraft, setCustomServiceDraft] = React.useState<
    Record<number, string>
  >({});

  // ---- Section 3: Add-ons ----
  const [addOns, setAddOns] = React.useState<AddOnItem[]>([]);
  const [customAddOnOpen, setCustomAddOnOpen] = React.useState(false);
  const [customAddOnDraft, setCustomAddOnDraft] = React.useState("");

  // ---- Section 4: Summary ----
  const [quoteGenerated, setQuoteGenerated] = React.useState(false);
  const [summaryData, setSummaryData] = React.useState<SummaryData | null>(
    null
  );
  const [footerNote, setFooterNote] = React.useState(
    "Fill in your details and events, then generate your quote."
  );
  const [footerError, setFooterError] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const successRef = React.useRef<HTMLDivElement>(null);
  const nameRef = React.useRef<HTMLInputElement>(null);
  const restoredRef = React.useRef(false);
  const dragStartYRef = React.useRef(0);
  const dragStartTimeRef = React.useRef(0);

  /* ---------------- Restore / persist a draft session ---------------- */

  React.useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const saved = JSON.parse(raw);
      if (!saved || typeof saved !== "object") return;

      if (saved.name) setName(saved.name);
      if (saved.phone) setPhone(saved.phone);
      if (saved.email) setEmail(saved.email);
      if (saved.budget) setBudget(saved.budget);
      if (saved.message) setMessage(saved.message);

      if (Array.isArray(saved.events) && saved.events.length) {
        setEvents(
          saved.events.map((ev: Partial<EventItem>) => ({
            ...newEvent(),
            ...ev,
            id: nextId(),
          }))
        );
      }

      if (Array.isArray(saved.addOns)) {
        setAddOns(saved.addOns);
      }
    } catch {
      // Ignore a corrupt or unavailable localStorage.
    }
  }, []);

  React.useEffect(() => {
    if (!restoredRef.current) return;

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ name, phone, email, budget, message, events, addOns })
      );
    } catch {
      // Storage may be unavailable (private browsing, quota, etc).
    }
  }, [name, phone, email, budget, message, events, addOns]);

  /* ---------------- Mini-player visibility ---------------- */

  function hasMeaningfulSession() {
    return Boolean(
      name.trim() ||
        email.trim() ||
        phone.trim() ||
        budget ||
        message.trim() ||
        addOns.length ||
        events.some(
          (ev) =>
            ev.date ||
            ev.venue.trim() ||
            ev.services.length ||
            ev.isCustomType ||
            ev.type !== EVENT_TYPES[0]
        )
    );
  }

  React.useEffect(() => {
    if (!restoredRef.current) return;
    setShowMiniPlayer(hasMeaningfulSession() && !isOpen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, phone, email, budget, message, events, addOns, isOpen]);

  /* ---------------- Open the modal from any "/quote" link ---------------- */

  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement)?.closest?.(
        'a[href="/quote"]'
      );
      if (!anchor) return;
      e.preventDefault();
      openModal();
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  React.useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const t = setTimeout(() => {
      nameRef.current?.focus({ preventScroll: true });
    }, 260);

    return () => {
      clearTimeout(t);
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [isOpen]);

  /* ---------------- Helpers ---------------- */

  function markEdited() {
    if (!quoteGenerated) return;
    setQuoteGenerated(false);
    setSummaryData(null);
    setFooterError(false);
    setFooterNote(
      "Fill in your details and events, then generate your quote."
    );
  }

  function openModal() {
    setSheetState("partial");
    setShowMiniPlayer(false);
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
  }

  /*
   * Minimize does NOT discard the draft — it slides the sheet
   * down and, once the animation finishes, leaves the floating
   * mini-player up if there's anything worth resuming.
   */
  function minimizeModal() {
    setIsMinimizing(true);
    setSheetState("partial");

    setTimeout(() => {
      setIsOpen(false);
      setIsMinimizing(false);
    }, 360);
  }

  function handleDragStart(e: React.PointerEvent<HTMLDivElement>) {
    if (!isOpen) return;
    setIsDragging(true);
    dragStartYRef.current = e.clientY;
    dragStartTimeRef.current = performance.now();
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }

  function handleDragMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging) return;
    const delta = e.clientY - dragStartYRef.current;
    setDragY(Math.max(-180, delta));
  }

  function handleDragEnd(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging) return;
    setIsDragging(false);

    const delta = dragY;
    const elapsed = Math.max(1, performance.now() - dragStartTimeRef.current);
    const velocity = delta / elapsed;

    setDragY(0);
    e.currentTarget.releasePointerCapture?.(e.pointerId);

    if (delta > 90 || velocity > 0.65) {
      minimizeModal();
      return;
    }

    if (delta < -70) {
      setSheetState("expanded");
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3200);
  }

  function deleteSession() {
    resetAll();
    setShowMiniPlayer(false);
  }

  function resetAll() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore.
    }

    setName("");
    setPhone("");
    setEmail("");
    setBudget("");
    setMessage("");
    setEvents([newEvent()]);
    setAddOns([]);
    setQuoteGenerated(false);
    setSummaryData(null);
    setFooterError(false);
    setFooterNote(
      "Fill in your details and events, then generate your quote."
    );
    setSuccess(false);
  }

  /* ---------------- Event handlers ---------------- */

  function addEvent() {
    setEvents((prev) => [...prev, newEvent()]);
  }

  function removeEvent(id: number) {
    setEvents((prev) =>
      prev.length <= 1 ? prev : prev.filter((ev) => ev.id !== id)
    );
    markEdited();
  }

  function updateEvent(id: number, patch: Partial<EventItem>) {
    setEvents((prev) =>
      prev.map((ev) => (ev.id === id ? { ...ev, ...patch } : ev))
    );
  }

  function setEventType(id: number, value: string) {
    if (value === CUSTOM_EVENT_VALUE) {
      updateEvent(id, { isCustomType: true });
    } else {
      updateEvent(id, { isCustomType: false, type: value });
    }
    markEdited();
  }

  function toggleService(id: number, name: string) {
    setEvents((prev) =>
      prev.map((ev) => {
        if (ev.id !== id) return ev;
        const exists = ev.services.find((s) => s.name === name);
        return {
          ...ev,
          services: exists
            ? ev.services.filter((s) => s.name !== name)
            : [
                ...ev.services,
                { name, qty: 1, custom: !SERVICE_CATALOG.includes(name) },
              ],
        };
      })
    );
    markEdited();
  }

  function changeServiceQty(id: number, name: string, delta: number) {
    setEvents((prev) =>
      prev.map((ev) => {
        if (ev.id !== id) return ev;
        return {
          ...ev,
          services: ev.services.map((s) =>
            s.name === name
              ? { ...s, qty: Math.min(5, Math.max(1, s.qty + delta)) }
              : s
          ),
        };
      })
    );
    markEdited();
  }

  function removeService(id: number, name: string) {
    setEvents((prev) =>
      prev.map((ev) =>
        ev.id === id
          ? { ...ev, services: ev.services.filter((s) => s.name !== name) }
          : ev
      )
    );
    markEdited();
  }

  function addCustomService(id: number) {
    const value = (customServiceDraft[id] || "").trim();
    if (!value) return;

    setEvents((prev) =>
      prev.map((ev) => {
        if (ev.id !== id) return ev;
        const exists = ev.services.some(
          (s) => s.name.toLowerCase() === value.toLowerCase()
        );
        return exists
          ? ev
          : {
              ...ev,
              services: [...ev.services, { name: value, qty: 1, custom: true }],
            };
      })
    );

    setCustomServiceDraft((prev) => ({ ...prev, [id]: "" }));
    markEdited();
  }

  /* ---------------- Add-on handlers ---------------- */

  function toggleAddOn(name: string) {
    setAddOns((prev) => {
      const exists = prev.find((a) => a.name === name);
      return exists
        ? prev.filter((a) => a.name !== name)
        : [...prev, { name, qty: 1, custom: !ADDON_CATALOG.includes(name) }];
    });
    markEdited();
  }

  function changeAddOnQty(name: string, delta: number) {
    setAddOns((prev) =>
      prev.map((a) =>
        a.name === name
          ? { ...a, qty: Math.min(5, Math.max(1, a.qty + delta)) }
          : a
      )
    );
    markEdited();
  }

  function removeAddOn(name: string) {
    setAddOns((prev) => prev.filter((a) => a.name !== name));
    markEdited();
  }

  function addCustomAddOn() {
    const value = customAddOnDraft.trim();
    if (!value) return;

    setAddOns((prev) => {
      const exists = prev.some(
        (a) => a.name.toLowerCase() === value.toLowerCase()
      );
      return exists ? prev : [...prev, { name: value, qty: 1, custom: true }];
    });

    setCustomAddOnDraft("");
    markEdited();
  }

  /* ---------------- Generate / send ---------------- */

  function generateQuote() {
    if (!name.trim() || !phone.trim() || !email.trim()) {
      setFooterError(true);
      setFooterNote(
        "Please fill in your name, email, and phone number first."
      );
      nameRef.current?.focus();
      return;
    }

    if (!budget) {
      setFooterError(true);
      setFooterNote("Please select your budget range.");
      return;
    }

    const hasServices = events.some((ev) => ev.services.length > 0);

    if (!hasServices) {
      setFooterError(true);
      setFooterNote(
        "Add at least one service to an event to generate a quote."
      );
      return;
    }

    const lines: SummaryLine[] = events
      .filter((ev) => ev.services.length > 0)
      .map((ev) => ({
        label: eventLabel(ev),
        date: ev.date,
        venue: ev.venue.trim(),
        services: ev.services.map((s) => ({ name: s.name, qty: s.qty })),
      }));

    const data: SummaryData = {
      lines,
      addOns: addOns.map((a) => ({ name: a.name, qty: a.qty })),
      budget,
    };

    setSummaryData(data);
    setQuoteGenerated(true);
    setFooterError(false);
    setFooterNote("Quote generated — send it to us directly.");
  }

  async function confirmQuote() {
    if (!quoteGenerated || !summaryData) return;

    setSending(true);
    setFooterError(false);
    setFooterNote("Sending your request…");

    try {
      const response = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          budget,
          message: message.trim(),
          events: summaryData.lines,
          addOns: summaryData.addOns,
        }),
      });

      let result: { success?: boolean; error?: string } = {};
      try {
        result = await response.json();
      } catch {
        // Server may return an empty body.
      }

      if (!response.ok || result.success === false) {
        throw new Error(result?.error || `Request failed (${response.status})`);
      }

      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore.
      }

      setSuccess(true);
      setShowMiniPlayer(false);
      showToast("Quote request sent — we'll be in touch within 24 hours.");
      requestAnimationFrame(() => successRef.current?.focus());
    } catch (err) {
      showToast("Something went wrong sending your quote. Please try again.");
      setFooterError(true);
      setFooterNote(
        err instanceof Error
          ? err.message
          : "Couldn't send your request — please try again in a moment."
      );
    } finally {
      setSending(false);
    }
  }

  /* ==========================================================
     RENDER
     ========================================================== */

  const overlay = (
    <>
      <div
        aria-hidden="true"
        onClick={undefined}
        className={`fixed inset-0 z-[999999] bg-[var(--primary-darkest)]/85 backdrop-blur-md transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quoteTitle"
        aria-hidden={!isOpen}
        className={`fixed inset-0 z-[999999] flex items-center justify-center p-4 transition-opacity duration-300 sm:p-8 ${
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        <div
          className={`relative flex max-h-[92svh] w-full max-w-[880px] flex-col overflow-hidden rounded-[28px] border border-[var(--secondary)]/40 bg-gradient-to-br from-[var(--primary)]/97 via-[var(--primary-dark)]/98 to-[var(--primary-darkest)]/99 shadow-[0_30px_80px_rgba(0,0,0,.48)] ${
            isDragging ? "" : "transition-transform duration-300"
          } ${
            isOpen && !isMinimizing
              ? "translate-y-0 scale-100"
              : "translate-y-4 scale-[.985]"
          }`}
          style={
            isDragging
              ? { transform: `translateY(${dragY}px)` }
              : isMinimizing
              ? { transform: "translateY(100%)" }
              : undefined
          }
        >
          <div className="absolute inset-x-0 top-0 z-20 h-[2px] bg-gradient-to-r from-transparent via-[var(--secondary-light)] to-transparent" />
          <div className="pointer-events-none absolute left-1/2 top-2 z-20 h-1 w-[42px] -translate-x-1/2 rounded-full bg-[var(--secondary-light)]/78 shadow-[0_0_12px_rgba(210,184,133,.14)]" />

          {!success ? (
            <>
              {/* HEADER */}
              <div className="flex shrink-0 items-center gap-4 px-5 py-5 sm:px-8">
                <div
                  className="flex min-w-0 flex-1 cursor-grab select-none items-center gap-4 active:cursor-grabbing"
                  style={{ touchAction: "none" }}
                  onPointerDown={handleDragStart}
                  onPointerMove={handleDragMove}
                  onPointerUp={handleDragEnd}
                  onPointerCancel={handleDragEnd}
                  aria-label="Drag quote panel"
                >
                  <img
                    src="/brand/icon.png"
                    alt="Roselanes by Jeev"
                    className="size-[54px] shrink-0 rounded-full border border-[var(--secondary)]/48 object-cover shadow-[0_8px_24px_rgba(0,0,0,.2)] sm:size-[62px]"
                  />

                  <div className="min-w-0">
                    <h2
                      id="quoteTitle"
                      className="font-serif text-[1.3rem] font-normal leading-[1.15] text-[var(--cream)] sm:text-[1.45rem]"
                    >
                      Request a Quote
                    </h2>
                    <p className="mt-1 text-[.68rem] uppercase tracking-[0.1em] text-[var(--secondary-light)]">
                      Luxé Wedding &amp; Lifestyle Photography
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={minimizeModal}
                  aria-label="Close"
                  className="ml-auto flex size-9 shrink-0 items-center justify-center rounded-full border border-[var(--secondary)]/38 bg-black/25 text-[var(--cream)]/80 transition-colors hover:border-[var(--secondary-light)] hover:text-[var(--secondary-light)]"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* BODY */}
              <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-3 pt-1 sm:px-8">
                {/* ================= SECTION 1 — YOUR DETAILS ================= */}
                <QuoteSectionHeading step={1}>Your Details</QuoteSectionHeading>

                <div className="mb-6 flex flex-col gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Full Name" htmlFor="quote-name">
                      <input
                        ref={nameRef}
                        className={inputClass}
                        type="text"
                        id="quote-name"
                        placeholder="Your full name"
                        autoComplete="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </Field>

                    <Field label="Phone" htmlFor="quote-phone">
                      <input
                        className={inputClass}
                        type="tel"
                        id="quote-phone"
                        placeholder="+91 XXXXX XXXXX"
                        autoComplete="tel"
                        inputMode="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-[2.5fr_1.5fr]">
                    <Field label="Email" htmlFor="quote-email">
                      <input
                        className={inputClass}
                        type="email"
                        id="quote-email"
                        placeholder="Your email address"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </Field>

                    <Field label="Budget Range" htmlFor="quote-budget">
                      <Select
                        value={budget}
                        onValueChange={(value) => {
                          setBudget(value);
                          markEdited();
                        }}
                      >
                        <SelectTrigger id="quote-budget" aria-label="Budget range">
                          <SelectValue placeholder="Select your budget" />
                        </SelectTrigger>

                        <SelectContent>
                          {BUDGET_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>

                  <Field label="Additional Notes" htmlFor="quote-message" optional>
                    <textarea
                      className={`${inputClass} h-[90px] min-h-[90px] resize-none overflow-y-auto py-4`}
                      id="quote-message"
                      placeholder="Tell us anything important about your event..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </Field>
                </div>

                {/* ================= SECTION 2 — YOUR EVENTS ================= */}
                <QuoteSectionHeading step={2}>Your Events</QuoteSectionHeading>

                <div className="mb-4 flex flex-col gap-3.5">
                  {events.map((ev) => (
                    <EventCard
                      key={ev.id}
                      event={ev}
                      removable={events.length > 1}
                      customServiceOpen={Boolean(customServiceOpen[ev.id])}
                      customServiceDraft={customServiceDraft[ev.id] || ""}
                      onTypeChange={(value) => setEventType(ev.id, value)}
                      onCustomTypeChange={(value) =>
                        updateEvent(ev.id, { customType: value })
                      }
                      onDateChange={(value) => {
                        updateEvent(ev.id, { date: value });
                        markEdited();
                      }}
                      onVenueChange={(value) => {
                        updateEvent(ev.id, { venue: value });
                        markEdited();
                      }}
                      onRemove={() => removeEvent(ev.id)}
                      onToggleService={(name) => toggleService(ev.id, name)}
                      onServiceQtyChange={(name, delta) =>
                        changeServiceQty(ev.id, name, delta)
                      }
                      onServiceRemove={(name) => removeService(ev.id, name)}
                      onOpenCustomService={() =>
                        setCustomServiceOpen((prev) => ({
                          ...prev,
                          [ev.id]: true,
                        }))
                      }
                      onCustomServiceDraftChange={(value) =>
                        setCustomServiceDraft((prev) => ({
                          ...prev,
                          [ev.id]: value,
                        }))
                      }
                      onAddCustomService={() => addCustomService(ev.id)}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addEvent}
                  className="mb-7 w-full rounded-[12px] border border-dashed border-[var(--secondary)]/34 py-2.5 text-[.7rem] font-medium uppercase tracking-[0.09em] text-[var(--secondary-light)] transition-colors hover:border-[var(--secondary-light)]/65 hover:bg-[var(--secondary)]/5"
                >
                  + Add Another Event
                </button>

                {/* ================= SECTION 3 — ADD-ONS ================= */}
                <QuoteSectionHeading step={3} optional>
                  Add-ons
                </QuoteSectionHeading>

                <div className="mb-2">
                  <ChipGroup
                    label="Optional Extras"
                    catalog={ADDON_CATALOG}
                    selected={addOns}
                    onToggle={toggleAddOn}
                    customOpen={customAddOnOpen}
                    onOpenCustom={() => setCustomAddOnOpen(true)}
                    customDraft={customAddOnDraft}
                    onCustomDraftChange={setCustomAddOnDraft}
                    onAddCustom={addCustomAddOn}
                    onQtyChange={changeAddOnQty}
                    onRemove={removeAddOn}
                  />
                </div>

                {/* ================= SECTION 4 — SUMMARY ================= */}
                {quoteGenerated && summaryData && (
                  <div className="mt-2 border-t border-[var(--cream)]/[0.07] pt-6">
                    <QuoteSectionHeading step={4}>
                      Quote Summary
                    </QuoteSectionHeading>

                    <div className="flex flex-col gap-2.5">
                      {summaryData.budget && (
                        <div className="rounded-[10px] border border-[var(--secondary)]/16 bg-black/20 px-4 py-2.5 text-[.8rem] text-[var(--cream)]/85">
                          Budget: {summaryData.budget}
                        </div>
                      )}

                      {summaryData.lines.map((line, i) => (
                        <div
                          key={i}
                          className="rounded-[10px] border border-[var(--secondary)]/16 bg-black/[0.18] px-4 py-3.5"
                        >
                          <div className="mb-1.5 text-[.86rem] font-semibold text-[var(--secondary-light)]">
                            {line.label}
                            {line.date ? ` — ${formatDate(line.date)}` : ""}
                            {line.venue ? ` · ${line.venue}` : ""}
                          </div>
                          {line.services.map((s) => (
                            <div
                              key={s.name}
                              className="py-0.5 text-[.78rem] text-[var(--cream)]/80"
                            >
                              {s.name}
                              {s.qty > 1 ? ` × ${s.qty}` : ""}
                            </div>
                          ))}
                        </div>
                      ))}

                      {summaryData.addOns.length > 0 && (
                        <div className="rounded-[10px] border border-[var(--secondary)]/16 bg-black/[0.18] px-4 py-3.5">
                          <div className="mb-1.5 text-[.86rem] font-semibold text-[var(--secondary-light)]">
                            Add-ons
                          </div>
                          {summaryData.addOns.map((a) => (
                            <div
                              key={a.name}
                              className="py-0.5 text-[.78rem] text-[var(--cream)]/80"
                            >
                              {a.name}
                              {a.qty > 1 ? ` × ${a.qty}` : ""}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <p className="mt-4 text-[.68rem] leading-[1.6] text-[var(--cream)]/60">
                      This is a preliminary quote request. Final pricing will
                      be confirmed after reviewing your requirements.
                    </p>
                  </div>
                )}
              </div>

              {/* FOOTER */}
              <div className="flex shrink-0 flex-col gap-2.5 border-t border-[var(--cream)]/[0.09] bg-black/15 px-6 py-4 sm:flex-row sm:items-center sm:px-9">
                <p
                  role={footerError ? "alert" : undefined}
                  aria-live="polite"
                  className={`flex-1 text-[.72rem] leading-[1.5] ${
                    footerError
                      ? "text-red-300"
                      : "text-[var(--cream)]/55"
                  }`}
                >
                  {footerNote}
                </p>

                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={minimizeModal}
                    className="!min-h-[42px] !min-w-0 !px-5 normal-case !text-[.72rem]"
                  >
                    Cancel
                  </Button>

                  {!quoteGenerated ? (
                    <Button
                      type="button"
                      onClick={generateQuote}
                      className="!min-h-[42px] !min-w-0 !px-5 normal-case !text-[.72rem]"
                    >
                      Generate Quote
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      disabled={sending}
                      onClick={confirmQuote}
                      className="!min-h-[42px] !min-w-0 !px-5 normal-case !text-[.72rem]"
                    >
                      <Send className="mr-2 size-3.5" />
                      {sending ? "Sending…" : "Send Request"}
                    </Button>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* ================= SUCCESS ================= */
            <div
              ref={successRef}
              tabIndex={-1}
              role="status"
              aria-live="polite"
              className="flex flex-1 flex-col items-center justify-center gap-5 overflow-y-auto px-8 py-14 text-center outline-none"
            >
              <div className="flex size-[58px] items-center justify-center rounded-full border border-[var(--secondary)]/55 text-[var(--secondary-light)]">
                <CheckCircle2 className="size-6" />
              </div>

              <h3 className="font-serif text-[clamp(2rem,4vw,2.6rem)] font-normal leading-[1.05] text-[var(--cream)]">
                Thank <span className="italic text-[var(--secondary-light)]">you</span>
              </h3>

              <p className="max-w-[42ch] text-[.92rem] leading-[1.7] text-[var(--cream)]/70">
                Thanks for reaching out to Roselanes by Jeev. We&apos;ve
                received your quote request and will be in touch with you
                soon.
              </p>

              <div className="my-1 h-px w-11 bg-[var(--secondary)]" />

              <p className="max-w-[42ch] text-[.92rem] leading-[1.7] text-[var(--cream)]/70">
                Check your email for updates and follow us on Instagram to
                see our latest work.
              </p>

              <a
                href="https://www.instagram.com/theroselanesbyjeev/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[.76rem] uppercase tracking-[0.12em] text-[var(--secondary-light)] hover:underline"
              >
                @theroselanesbyjeev
              </a>

              <p className="mt-2 text-[.85rem] text-[var(--cream)]/60">
                Have a nice day.
              </p>

              <Button
                type="button"
                onClick={() => {
                  deleteSession();
                  closeModal();
                }}
                className="!mt-4 !min-h-[44px] !min-w-0 !px-6 normal-case !text-[.75rem]"
              >
                Back to Roselanes
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* MINI PLAYER — shown when the modal is minimized but a draft exists */}
      {showMiniPlayer && (
        <div
          className="fixed inset-x-0 bottom-5 z-[999999] mx-auto flex w-[min(420px,calc(100%-32px))] items-center justify-between gap-3 rounded-full border border-[var(--secondary)]/45 bg-[var(--primary-darkest)]/95 px-5 py-3 shadow-[0_18px_45px_rgba(0,0,0,.4)] backdrop-blur-xl"
          aria-label="Saved quote session"
        >
          <div className="min-w-0">
            <span className="block text-[.6rem] uppercase tracking-[0.12em] text-[var(--secondary-light)]">
              Quote in progress
            </span>
            <span className="block truncate text-[.8rem] text-[var(--cream)]">
              Your quote is ready to continue
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={openModal}
              className="rounded-full bg-[var(--secondary-light)] px-4 py-2 text-[.65rem] font-semibold uppercase tracking-[0.05em] text-[var(--primary-darkest)] transition-colors hover:bg-[var(--secondary)]"
            >
              Continue
            </button>
            <button
              type="button"
              aria-label="Delete saved quote session"
              onClick={deleteSession}
              className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[var(--cream)]/25 text-[var(--cream)]/70 transition-colors hover:border-red-300/65 hover:text-red-200"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-0 bottom-6 z-[10010] mx-auto w-fit max-w-[90vw] rounded-full border border-[var(--secondary)]/40 bg-[var(--primary-darkest)]/95 px-5 py-3 text-center text-[.8rem] text-[var(--cream)] shadow-[0_18px_45px_rgba(0,0,0,.4)] backdrop-blur-xl"
        >
          {toast}
        </div>
      )}
    </>
  );

  return mounted ? createPortal(overlay, document.body) : null;
}

export default QuoteSection;

/* ==========================================================
   QUOTE SECTION HEADING
   ========================================================== */

function QuoteSectionHeading({
  step,
  optional,
  children,
}: {
  step: number;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <h3 className="mb-4 flex items-center gap-2.5 text-[.78rem] font-semibold uppercase tracking-[0.14em] text-[var(--cream)]">
      <span className="flex size-[25px] shrink-0 items-center justify-center rounded-full border border-[var(--secondary)]/50 text-[.65rem] text-[var(--secondary-light)]">
        {step}
      </span>
      {children}
      {optional && (
        <small className="text-[.58rem] font-normal normal-case tracking-normal text-[var(--cream)]/60">
          (optional)
        </small>
      )}
    </h3>
  );
}

/* ==========================================================
   EVENT CARD
   Uses the exact same <Select> dropdown as Budget Range,
   here driving Event Type.
   ========================================================== */

function EventCard({
  event,
  removable,
  customServiceOpen,
  customServiceDraft,
  onTypeChange,
  onCustomTypeChange,
  onDateChange,
  onVenueChange,
  onRemove,
  onToggleService,
  onServiceQtyChange,
  onServiceRemove,
  onOpenCustomService,
  onCustomServiceDraftChange,
  onAddCustomService,
}: {
  event: EventItem;
  removable: boolean;
  customServiceOpen: boolean;
  customServiceDraft: string;
  onTypeChange: (value: string) => void;
  onCustomTypeChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onVenueChange: (value: string) => void;
  onRemove: () => void;
  onToggleService: (name: string) => void;
  onServiceQtyChange: (name: string, delta: number) => void;
  onServiceRemove: (name: string) => void;
  onOpenCustomService: () => void;
  onCustomServiceDraftChange: (value: string) => void;
  onAddCustomService: () => void;
}) {
  const selectValue = event.isCustomType ? CUSTOM_EVENT_VALUE : event.type;

  return (
    <div className="relative rounded-[16px] border border-[var(--secondary)]/20 bg-black/[0.22] p-4 transition-colors hover:border-[var(--secondary)]/32 sm:p-5">
      {removable && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove event"
          className="absolute right-3 top-3 z-10 flex size-7 shrink-0 items-center justify-center rounded-full border border-[var(--secondary)]/25 bg-black/20 text-[var(--cream)]/55 transition-colors hover:border-[var(--secondary-light)]/60 hover:bg-[var(--secondary)]/10 hover:text-[var(--secondary-light)]"
        >
          <X className="size-3.5" />
        </button>
      )}

      <div
        className={`mb-4 grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1.25fr)_minmax(150px,.75fr)] lg:grid-cols-[minmax(0,1.25fr)_minmax(150px,.75fr)_minmax(180px,1fr)] ${
          removable ? "pr-10" : ""
        }`}
      >
        <div className="min-w-0">
          <Field label="Event Type">
            <div className="flex gap-2">
              <div className="min-w-0 flex-1">
                <Select value={selectValue} onValueChange={onTypeChange}>
                  <SelectTrigger aria-label="Event type">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {EVENT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                    <SelectItem value={CUSTOM_EVENT_VALUE}>
                      + Add Custom Event
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {event.isCustomType && (
                <input
                  className={`${inputClass} h-[54px] flex-1`}
                  type="text"
                  placeholder="Name this event"
                  value={event.customType}
                  onChange={(e) => onCustomTypeChange(e.target.value)}
                  autoFocus
                />
              )}
            </div>
          </Field>
        </div>

        <div className="min-w-0">
          <Field label="Date" optional>
            <input
              className={inputClass}
              type="date"
              value={event.date}
              onChange={(e) => onDateChange(e.target.value)}
              aria-label="Event date"
            />
          </Field>
        </div>

        <div className="min-w-0 sm:col-span-2 lg:col-span-1">
          <Field label="Venue" optional>
            <input
              className={inputClass}
              type="text"
              placeholder="Venue or location"
              value={event.venue}
              onChange={(e) => onVenueChange(e.target.value)}
              aria-label="Event venue"
            />
          </Field>
        </div>
      </div>

      <span className="mb-2 block text-[.62rem] font-semibold uppercase tracking-[0.13em] text-[var(--cream)]/70">
        Services
      </span>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {SERVICE_CATALOG.map((name) => {
          const selected = event.services.some((s) => s.name === name);
          return (
            <button
              key={name}
              type="button"
              onClick={() => onToggleService(name)}
              className={`${chipBase} ${selected ? chipSelected : chipDefault}`}
            >
              {name}
            </button>
          );
        })}

        {event.services
          .filter((s) => s.custom)
          .map((s) => (
            <button
              key={s.name}
              type="button"
              onClick={() => onToggleService(s.name)}
              className={`${chipBase} ${chipSelected}`}
            >
              {s.name}
            </button>
          ))}

        {!customServiceOpen && (
          <button
            type="button"
            onClick={onOpenCustomService}
            className={`${chipBase} ${chipAdd}`}
          >
            + Custom Service
          </button>
        )}
      </div>

      {customServiceOpen && (
        <div className="mb-3 flex gap-2">
          <input
            className="h-10 min-w-0 flex-1 rounded-[8px] border border-[var(--secondary)]/25 bg-black/30 px-3 text-sm text-[var(--cream)] outline-none placeholder:text-[var(--placeholder)]"
            type="text"
            placeholder="e.g. Traditional Attire Styling"
            value={customServiceDraft}
            onChange={(e) => onCustomServiceDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onAddCustomService();
              }
            }}
            autoFocus
          />
          <button
            type="button"
            onClick={onAddCustomService}
            className="h-9 rounded-[8px] bg-[var(--secondary-light)] px-3 text-[.64rem] font-semibold uppercase tracking-[0.06em] text-[var(--primary-darkest)]"
          >
            Add
          </button>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        {event.services.length === 0 ? (
          <div className="text-[.78rem] text-[var(--cream)]/40">
            No services selected yet.
          </div>
        ) : (
          event.services.map((s) => (
            <div
              key={s.name}
              className="flex items-center justify-between gap-3 rounded-[8px] border border-[var(--cream)]/[0.07] bg-[var(--cream)]/[0.025] px-3 py-2"
            >
              <div className="min-w-0 truncate text-[.82rem] text-[var(--cream)]/90">
                {s.name}
              </div>
              <Stepper
                value={s.qty}
                onDecrease={() => onServiceQtyChange(s.name, -1)}
                onIncrease={() => onServiceQtyChange(s.name, 1)}
                onRemove={() => onServiceRemove(s.name)}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ==========================================================
   CHIP GROUP — used for Add-ons
   ========================================================== */

function ChipGroup({
  label,
  catalog,
  selected,
  onToggle,
  customOpen,
  onOpenCustom,
  customDraft,
  onCustomDraftChange,
  onAddCustom,
  onQtyChange,
  onRemove,
}: {
  label: string;
  catalog: string[];
  selected: AddOnItem[];
  onToggle: (name: string) => void;
  customOpen: boolean;
  onOpenCustom: () => void;
  customDraft: string;
  onCustomDraftChange: (value: string) => void;
  onAddCustom: () => void;
  onQtyChange: (name: string, delta: number) => void;
  onRemove: (name: string) => void;
}) {
  const selectedNames = new Set(selected.map((a) => a.name));

  return (
    <div>
      <span className="mb-2 block text-[.62rem] font-semibold uppercase tracking-[0.13em] text-[var(--cream)]/70">
        {label}
      </span>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {catalog.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => onToggle(name)}
            className={`${chipBase} ${
              selectedNames.has(name) ? chipSelected : chipDefault
            }`}
          >
            {name}
          </button>
        ))}

        {selected
          .filter((a) => a.custom)
          .map((a) => (
            <button
              key={a.name}
              type="button"
              onClick={() => onToggle(a.name)}
              className={`${chipBase} ${chipSelected}`}
            >
              {a.name}
            </button>
          ))}

        {!customOpen && (
          <button
            type="button"
            onClick={onOpenCustom}
            className={`${chipBase} ${chipAdd}`}
          >
            + Custom Add-on
          </button>
        )}
      </div>

      {customOpen && (
        <div className="mb-3 flex gap-2">
          <input
            className="h-10 min-w-0 flex-1 rounded-[8px] border border-[var(--secondary)]/25 bg-black/30 px-3 text-sm text-[var(--cream)] outline-none placeholder:text-[var(--placeholder)]"
            type="text"
            placeholder="e.g. Traditional Attire Styling"
            value={customDraft}
            onChange={(e) => onCustomDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onAddCustom();
              }
            }}
            autoFocus
          />
          <button
            type="button"
            onClick={onAddCustom}
            className="h-9 rounded-[8px] bg-[var(--secondary-light)] px-3 text-[.64rem] font-semibold uppercase tracking-[0.06em] text-[var(--primary-darkest)]"
          >
            Add
          </button>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        {selected.length === 0 ? (
          <div className="text-[.78rem] text-[var(--cream)]/40">
            No add-ons selected yet.
          </div>
        ) : (
          selected.map((a) => (
            <div
              key={a.name}
              className="flex items-center justify-between gap-3 rounded-[8px] border border-[var(--cream)]/[0.07] bg-[var(--cream)]/[0.025] px-3 py-2"
            >
              <div className="min-w-0 truncate text-[.82rem] text-[var(--cream)]/90">
                {a.name}
              </div>
              <Stepper
                value={a.qty}
                onDecrease={() => onQtyChange(a.name, -1)}
                onIncrease={() => onQtyChange(a.name, 1)}
                onRemove={() => onRemove(a.name)}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}