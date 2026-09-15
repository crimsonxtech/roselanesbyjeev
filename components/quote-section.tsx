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
import { useBodyScrollLock } from "@/hooks/use-body-scroll-lock";
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

/* Base sizing/typography shared by every text control. Border + focus
   ring colours are intentionally NOT in here so the idle and invalid
   variants can own them without fighting each other on specificity. */
const inputBase =
  "h-[54px] w-full min-w-0 max-w-full box-border rounded-[10px] border bg-[var(--input-bg)] px-4 text-[15px] font-medium text-[var(--cream)] outline-none transition-all duration-300 placeholder:text-[var(--placeholder)] focus:bg-[var(--input-focus-bg)] focus:ring-4";

const inputIdle =
  "border-[var(--glass-border)] focus:border-[var(--secondary-light)] focus:ring-[var(--secondary)]/15";

const inputInvalid =
  "border-red-400/80 ring-2 ring-red-400/25 focus:border-red-400 focus:ring-red-400/25";

/** Text-input classes for a given validity state. */
function inputCls(invalid?: boolean) {
  return `${inputBase} ${invalid ? inputInvalid : inputIdle}`;
}

/* Kept for the controls that never show a validation state. */
const inputClass = inputCls(false);

/* --- Safari / iOS <input type="date"> normalisation ---------------
   WebKit sizes temporal inputs from their native shadow-DOM UI and
   ignores `width: 100%`, so the field spills out of its flex/grid
   parent (Chrome is unaffected). `appearance: none` plus an explicit
   min-width: 0 makes it honour the track, and resetting the padding
   and line-height on ::-webkit-datetime-edit brings its height back
   in line with the Venue input beside it.
------------------------------------------------------------------ */
const dateInputFix =
  "appearance-none [-webkit-appearance:none] overflow-hidden leading-[1.25] " +
  "[&::-webkit-datetime-edit]:min-w-0 [&::-webkit-datetime-edit]:p-0 [&::-webkit-datetime-edit]:leading-[1.25] " +
  "[&::-webkit-datetime-edit-fields-wrapper]:min-w-0 [&::-webkit-datetime-edit-fields-wrapper]:p-0 " +
  "[&::-webkit-date-and-time-value]:m-0 [&::-webkit-date-and-time-value]:min-w-0 [&::-webkit-date-and-time-value]:text-left " +
  "[&::-webkit-calendar-picker-indicator]:m-0 [&::-webkit-calendar-picker-indicator]:shrink-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer";

const chipBase =
  "inline-flex min-h-[28px] items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium leading-tight transition-all duration-200 sm:min-h-[34px] sm:px-3.5 sm:py-1.5 sm:text-xs";

const chipDefault =
  "border-[var(--glass-border)] bg-black/20 text-[var(--cream)]/80 hover:border-[var(--secondary)]/60 hover:text-[var(--cream)]";

const chipSelected =
  "border-[var(--secondary)] bg-gradient-to-br from-[var(--secondary-light)] to-[var(--secondary)] !text-[var(--primary-darkest)] font-semibold shadow-[0_4px_14px_rgba(0,0,0,.20)]";

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
  "LED Wall",

  "Traditional Videography",
  "Instant Reels",
  
  "Candid Photography",
  "Drone Coverage",
  
  "Cinematic Videography",
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
   VALIDATION — one pure validator per field.

   Each returns an error string or undefined. Keeping them pure
   means the same functions drive blur-time checks, live re-checks
   while correcting, and the submit-time sweep, so a field can
   never disagree with itself.
   ========================================================== */

type DetailField = "name" | "phone" | "email" | "budget";

/* Order matters: it decides which field gets focus on submit. */
const DETAIL_FIELDS: DetailField[] = ["name", "phone", "email", "budget"];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

function validateName(value: string) {
  const v = value.trim();
  if (!v) return "Please enter your full name.";
  if (v.length < 2) return "Name looks too short.";
  return undefined;
}

function validatePhone(value: string) {
  const v = value.trim();
  if (!v) return "Please enter your phone number.";
  const digits = v.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15)
    return "Please enter a valid phone number.";
  return undefined;
}

function validateEmail(value: string) {
  const v = value.trim();
  if (!v) return "Please enter your email address.";
  if (!EMAIL_RE.test(v)) return "Please enter a valid email address.";
  return undefined;
}

function validateBudget(value: string) {
  if (!value) return "Please select your budget range.";
  return undefined;
}

const DETAIL_VALIDATORS: Record<
  DetailField,
  (value: string) => string | undefined
> = {
  name: validateName,
  phone: validatePhone,
  email: validateEmail,
  budget: validateBudget,
};

type DetailErrors = Partial<Record<DetailField, string>>;

/* ==========================================================
   FIELD — same label treatment as the contact form
   ========================================================== */

function Field({
  label,
  htmlFor,
  optional,
  error,
  errorId,
  children,
}: {
  label: string;
  htmlFor?: string;
  optional?: boolean;
  error?: string;
  errorId?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label
        htmlFor={htmlFor}
        className={`text-[11px] font-bold uppercase tracking-[0.14em] ${
          error ? "text-red-300" : "text-[var(--secondary)]"
        }`}
      >
        {label}
        {optional && (
          <span className="ml-1.5 text-[9px] font-medium normal-case tracking-normal text-[var(--cream)]/45">
            (optional)
          </span>
        )}
      </label>

      {children}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-[11px] font-medium leading-snug text-red-300"
        >
          {error}
        </p>
      )}
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

  // ---- Unified sheet drag state (expanded <-> mini morph) ----
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragY, setDragY] = React.useState(0);

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

  /* One error slot per field, plus a flag for "the user has tried to
     submit at least once". Before that first attempt a field is only
     checked on blur, so nobody gets shouted at mid-typing. After it,
     every keystroke re-checks, which lets the outline clear the moment
     the value becomes valid. */
  const [detailErrors, setDetailErrors] = React.useState<DetailErrors>({});
  const [submitAttempted, setSubmitAttempted] = React.useState(false);

  // ---- Section 2: Events ----
  const [events, setEvents] = React.useState<EventItem[]>([newEvent()]);
  const [customServiceOpen, setCustomServiceOpen] = React.useState<
    Record<number, boolean>
  >({});
  const [customServiceDraft, setCustomServiceDraft] = React.useState<
    Record<number, string>
  >({});
  const [invalidServiceEventId, setInvalidServiceEventId] = React.useState<
    number | null
  >(null);
  const [invalidCustomEventId, setInvalidCustomEventId] = React.useState<
    number | null
  >(null);

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
  const sheetRef = React.useRef<HTMLDivElement>(null);
  const nameRef = React.useRef<HTMLInputElement>(null);
  const phoneRef = React.useRef<HTMLInputElement>(null);
  const emailRef = React.useRef<HTMLInputElement>(null);
  const budgetTriggerRef = React.useRef<HTMLButtonElement>(null);
  const eventsSectionRef = React.useRef<HTMLDivElement>(null);
  const summaryRef = React.useRef<HTMLDivElement>(null);
  const customEventNameRefs = React.useRef<Record<number, HTMLInputElement | null>>({});
  const eventCardRefs = React.useRef<Record<number, HTMLDivElement | null>>({});
  const restoredRef = React.useRef(false);
  const dragStartYRef = React.useRef(0);
  const dragStartTimeRef = React.useRef(0);

  // Opening the sheet from the minimized quote should not steal focus.
  // Otherwise mobile browsers immediately open the keyboard during the
  // sheet's expand animation.
  const openedFromMiniRef = React.useRef(false);

  /* ---------------- Scroll to generated quote summary ---------------- */
  React.useEffect(() => {
    if (!quoteGenerated || !summaryData || !isOpen) return;

    // Wait for the summary to be mounted and laid out before scrolling.
    const frame = requestAnimationFrame(() => {
      summaryRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [quoteGenerated, summaryData, isOpen]);

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

  /* ---------------- Derived sheet mode ----------------
     A single element morphs between three visual states instead
     of swapping between a modal and a separate floating pill:
       - "expanded": the full quote form, centered
       - "mini":     a small pill anchored to the bottom, with a
                     draft worth resuming
       - "hidden":   nothing worth showing, fully invisible
  ------------------------------------------------------- */

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

  const mode: "expanded" | "mini" | "hidden" = isOpen
    ? "expanded"
    : hasMeaningfulSession()
    ? "mini"
    : "hidden";

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

  /*
   * Lock page scrolling while the modal is open.
   *
   * Uses a position:fixed-based lock rather than plain
   * `overflow: hidden`, since iOS Safari still allows the page behind
   * the modal to be dragged/rubber-banded — and briefly reveals it
   * during the address-bar show/hide animation — with overflow alone.
   * The sheet's own scrollable body (and its drag handle) stay
   * interactive via `sheetRef`.
   */
  useBodyScrollLock(isOpen, sheetRef);

  React.useEffect(() => {
    if (!isOpen || openedFromMiniRef.current) return;

    const t = setTimeout(() => {
      nameRef.current?.focus({ preventScroll: true });
    }, 260);

    return () => {
      clearTimeout(t);
    };
  }, [isOpen]);

  /* ---------------- Per-field validation ---------------- */

  const detailValues: Record<DetailField, string> = {
    name,
    phone,
    email,
    budget,
  };

  const detailRefs: Record<
    DetailField,
    React.RefObject<HTMLElement | null>
  > = {
    name: nameRef,
    phone: phoneRef,
    email: emailRef,
    budget: budgetTriggerRef,
  };

  /** Run one field's validator and store (or clear) its message. */
  function runFieldCheck(field: DetailField, value: string) {
    const message = DETAIL_VALIDATORS[field](value);

    setDetailErrors((prev) => {
      if (prev[field] === message) return prev;
      const next = { ...prev };
      if (message) next[field] = message;
      else delete next[field];
      return next;
    });

    return message;
  }

  /** Blur is the first moment a field is allowed to complain. */
  function handleFieldBlur(field: DetailField) {
    runFieldCheck(field, detailValues[field]);
  }

  /**
   * Typing only re-validates a field that is already flagged (or once
   * the user has hit Generate). That's the standard "validate late,
   * correct early" pattern: no error appears while you're still
   * filling a field in, but it disappears as soon as you fix it.
   */
  function handleFieldChange(
    field: DetailField,
    value: string,
    setter: (value: string) => void
  ) {
    setter(value);
    markEdited();
    if (submitAttempted || detailErrors[field]) runFieldCheck(field, value);
  }

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

  function openModal(fromMini = false) {
    openedFromMiniRef.current = fromMini;
    setDragY(0);
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
  }

  /*
   * Minimize does NOT discard the draft — the same panel simply
   * morphs down into the small pill, still holding the draft.
   */
  function minimizeModal() {
    setDragY(0);
    setIsOpen(false);
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
    setDragY(Math.max(0, delta));
  }

  function handleDragEnd(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging) return;
    setIsDragging(false);

    const delta = dragY;
    const elapsed = Math.max(1, performance.now() - dragStartTimeRef.current);
    const velocity = delta / elapsed;

    e.currentTarget.releasePointerCapture?.(e.pointerId);

    if (delta > 90 || velocity > 0.65) {
      minimizeModal();
      return;
    }

    setDragY(0);
  }

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3200);
  }

  function deleteSession() {
    resetAll();
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
    setDetailErrors({});
    setSubmitAttempted(false);
    setMessage("");
    setEvents([newEvent()]);
    setInvalidServiceEventId(null);
    setInvalidCustomEventId(null);
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
    /*
     * A brand-new event has no services yet, so any quote already on
     * screen is now incomplete. Without this the summary stayed valid,
     * the footer button stayed on "Send Request", and the new empty
     * event was never checked.
     */
    markEdited();
  }

  function removeEvent(id: number) {
    setEvents((prev) =>
      prev.length <= 1 ? prev : prev.filter((ev) => ev.id !== id)
    );
    setInvalidCustomEventId((current) => (current === id ? null : current));
    setInvalidServiceEventId((current) => (current === id ? null : current));
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
    setInvalidCustomEventId((current) => (current === id ? null : current));
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
    setInvalidServiceEventId((current) => (current === id ? null : current));
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
    setCustomServiceOpen((prev) => ({ ...prev, [id]: false }));
    setInvalidServiceEventId((current) => (current === id ? null : current));
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
    setCustomAddOnOpen(false);
    markEdited();
  }

  /* ---------------- Generate / send ---------------- */

  /**
   * Validate the whole form. Returns true only when every rule passes.
   *
   * This is the single gate the quote has to pass through — both
   * "Generate Quote" and "Send Request" call it, so a quote can never
   * be sent against a summary that has gone stale.
   */
  function validateQuote(): boolean {
    setSubmitAttempted(true);

    /*
     * Check every detail field in one sweep rather than bailing out at
     * the first failure. Each invalid field gets its own message and
     * its own red outline; only the focus goes to the first one.
     */
    const nextErrors: DetailErrors = {};

    for (const field of DETAIL_FIELDS) {
      const message = DETAIL_VALIDATORS[field](detailValues[field]);
      if (message) nextErrors[field] = message;
    }

    setDetailErrors(nextErrors);

    const invalidFields = DETAIL_FIELDS.filter((f) => nextErrors[f]);

    if (invalidFields.length > 0) {
      const firstInvalid = invalidFields[0];

      setFooterError(true);
      setFooterNote(
        invalidFields.length === 1
          ? nextErrors[firstInvalid]!
          : `Please correct the ${invalidFields.length} highlighted fields above.`
      );

      const target = detailRefs[firstInvalid].current;
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      target?.focus({ preventScroll: true });
      return false;
    }

    // Find the FIRST invalid custom event and scroll/focus its exact input.
    const missingCustomEvent = events.find(
      (ev) => ev.isCustomType && !ev.customType.trim()
    );

    if (missingCustomEvent) {
      setInvalidCustomEventId(missingCustomEvent.id);
      setFooterError(true);
      setFooterNote(
        "Please name your custom event before generating a quote."
      );

      const input = customEventNameRefs.current[missingCustomEvent.id];

      if (input) {
        input.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
        input.focus({ preventScroll: true });
      } else {
        eventsSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }

      return false;
    }

    /*
     * Every event has to carry at least one service — an event with an
     * empty service list would produce a meaningless line on the quote.
     * Flag the first offender and take the user straight to that card.
     */
    const eventWithoutServices = events.find((ev) => ev.services.length === 0);

    if (eventWithoutServices) {
      setInvalidServiceEventId(eventWithoutServices.id);
      setFooterError(true);
      setFooterNote(
        events.length > 1
          ? `Add at least one service to "${eventLabel(eventWithoutServices)}".`
          : "Add at least one service to generate a quote."
      );

      const card = eventCardRefs.current[eventWithoutServices.id];

      if (card) {
        card.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        eventsSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }

      return false;
    }

    return true;
  }

  /** Build the summary from the current state. Only safe after validateQuote(). */
  function buildSummary(): SummaryData {
    const lines: SummaryLine[] = events.map((ev) => ({
      label: eventLabel(ev),
      date: ev.date,
      venue: ev.venue.trim(),
      services: ev.services.map((s) => ({ name: s.name, qty: s.qty })),
    }));

    return {
      lines,
      addOns: addOns.map((a) => ({ name: a.name, qty: a.qty })),
      budget,
    };
  }

  function generateQuote() {
    if (!validateQuote()) return;

    const data = buildSummary();

    setSummaryData(data);
    setQuoteGenerated(true);
    setFooterError(false);
    setDetailErrors({});
    setInvalidServiceEventId(null);
    setFooterNote("Quote generated — send it to us directly.");
  }

  async function confirmQuote() {
    if (!quoteGenerated || !summaryData) return;

    /*
     * Second gate. The summary is a snapshot, so if anything changed
     * since it was built (a new empty event, a cleared field) it must
     * not be sent. Re-validating here means the rules hold even if
     * some future edit forgets to invalidate the summary.
     */
    if (!validateQuote()) {
      setQuoteGenerated(false);
      setSummaryData(null);
      return;
    }

    /* Rebuild from current state so what is sent is what is on screen. */
    const data = buildSummary();
    setSummaryData(data);

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
          events: data.lines,
          addOns: data.addOns,
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
     PANEL GEOMETRY — the single element that morphs between
     "expanded" (full modal) and "mini" (bottom pill), YouTube /
     Spotify miniplayer style. Only concrete, animatable values
     are used (no "auto"), so the browser can transition smoothly
     between them.
     ========================================================== */

  function getPanelStyle(): React.CSSProperties {
    const transition = isDragging
      ? "none"
      : "top 480ms cubic-bezier(.32,.72,0,1), width 480ms cubic-bezier(.32,.72,0,1), max-width 480ms cubic-bezier(.32,.72,0,1), max-height 480ms cubic-bezier(.32,.72,0,1), border-radius 480ms cubic-bezier(.32,.72,0,1), transform 480ms cubic-bezier(.32,.72,0,1), opacity 320ms ease";

    if (mode === "expanded") {
      return {
        position: "fixed",
        left: "50%",
        top: "50%",
        width: "calc(100% - 32px)",
        maxWidth: "880px",
        maxHeight: "92svh",
        borderRadius: "28px",
        transform: `translate(-50%, calc(-50% + ${dragY}px))`,
        opacity: 1,
        pointerEvents: "auto",
        display: "flex",
        flexDirection: "column",
        transition,
      };
    }

    const visible = mode === "mini";

    return {
      position: "fixed",
      left: "50%",
      top: "100%",
      width: "calc(100% - 32px)",
      maxWidth: "420px",
      maxHeight: "76px",
      borderRadius: "999px",
      transform: "translate(-50%, calc(-100% - 20px))",
      opacity: visible ? 1 : 0,
      pointerEvents: visible ? "auto" : "none",
      display: "flex",
      flexDirection: "column",
      transition,
    };
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
          mode === "expanded"
            ? "opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />

      <div
        role="dialog"
        aria-modal={mode === "expanded"}
        aria-labelledby="quoteTitle"
        aria-hidden={mode !== "expanded"}
        className="z-[999999]"
        style={{ ...getPanelStyle(), overscrollBehavior: "none" }}
      >
        <div
          ref={sheetRef}
          onClick={mode === "mini" ? () => openModal(true) : undefined}
          className={`relative flex w-full min-h-0 flex-1 flex-col overflow-hidden border bg-gradient-to-br from-[var(--primary)]/97 via-[var(--primary-dark)]/98 to-[var(--primary-darkest)]/99 shadow-[0_30px_80px_rgba(0,0,0,.48)] ${
            mode === "mini"
              ? "cursor-pointer border-[var(--secondary)]/55 transition-transform duration-300 ease-out hover:scale-x-[1.055] hover:scale-y-[1.022] hover:border-[var(--secondary-light)]/75 hover:shadow-[0_20px_55px_rgba(0,0,0,.55)]"
              : "border-[var(--secondary)]/40"
          }`}
          style={{ borderRadius: "inherit" }}
        >
        {mode === "expanded" && (
          <>
            <div className="absolute inset-x-0 top-0 z-20 h-[2px] bg-gradient-to-r from-transparent via-[var(--secondary-light)] to-transparent" />
            <div className="pointer-events-none absolute left-1/2 top-2 z-20 h-1 w-[42px] -translate-x-1/2 rounded-full bg-[var(--secondary-light)]/78 shadow-[0_0_12px_rgba(210,184,133,.14)]" />
          </>
        )}


        {mode === "expanded" && !success && (
          <>
            {/* HEADER */}
            <div
              className="flex shrink-0 cursor-grab select-none items-center gap-4 px-5 py-5 active:cursor-grabbing sm:px-8"
              style={{ touchAction: "none" }}
              onPointerDown={handleDragStart}
              onPointerMove={handleDragMove}
              onPointerUp={handleDragEnd}
              onPointerCancel={handleDragEnd}
              aria-label="Drag quote panel"
            >
              <div className="flex min-w-0 flex-1 items-center gap-4">
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
                onPointerDown={(e) => e.stopPropagation()}
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
                  <Field
                    label="Full Name"
                    htmlFor="quote-name"
                    error={detailErrors.name}
                    errorId="quote-name-error"
                  >
                    <input
                      ref={nameRef}
                      className={inputCls(Boolean(detailErrors.name))}
                      type="text"
                      id="quote-name"
                      placeholder="Your full name"
                      autoComplete="name"
                      value={name}
                      aria-invalid={Boolean(detailErrors.name)}
                      aria-describedby={
                        detailErrors.name ? "quote-name-error" : undefined
                      }
                      onBlur={() => handleFieldBlur("name")}
                      onChange={(e) =>
                        handleFieldChange("name", e.target.value, setName)
                      }
                    />
                  </Field>

                  <Field
                    label="Phone"
                    htmlFor="quote-phone"
                    error={detailErrors.phone}
                    errorId="quote-phone-error"
                  >
                    <input
                      ref={phoneRef}
                      className={inputCls(Boolean(detailErrors.phone))}
                      type="tel"
                      id="quote-phone"
                      placeholder="+91 XXXXX XXXXX"
                      autoComplete="tel"
                      inputMode="tel"
                      value={phone}
                      aria-invalid={Boolean(detailErrors.phone)}
                      aria-describedby={
                        detailErrors.phone ? "quote-phone-error" : undefined
                      }
                      onBlur={() => handleFieldBlur("phone")}
                      onChange={(e) =>
                        handleFieldChange("phone", e.target.value, setPhone)
                      }
                    />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-[2.5fr_1.5fr]">
                  <Field
                    label="Email"
                    htmlFor="quote-email"
                    error={detailErrors.email}
                    errorId="quote-email-error"
                  >
                    <input
                      ref={emailRef}
                      className={inputCls(Boolean(detailErrors.email))}
                      type="email"
                      id="quote-email"
                      placeholder="Your email address"
                      autoComplete="email"
                      value={email}
                      aria-invalid={Boolean(detailErrors.email)}
                      aria-describedby={
                        detailErrors.email ? "quote-email-error" : undefined
                      }
                      onBlur={() => handleFieldBlur("email")}
                      onChange={(e) =>
                        handleFieldChange("email", e.target.value, setEmail)
                      }
                    />
                  </Field>

                  <Field
                    label="Budget Range"
                    htmlFor="quote-budget"
                    error={detailErrors.budget}
                    errorId="quote-budget-error"
                  >
                    <div className="w-full min-w-0 max-w-full [&>button]:!box-border [&>button]:!flex [&>button]:!h-[54px] [&>button]:!w-full [&>button]:!min-w-0 [&>button]:!max-w-full">
                      <Select
                        value={budget}
                        onValueChange={(value) => {
                          setBudget(value);
                          markEdited();
                          runFieldCheck("budget", value);
                        }}
                      >
                        <SelectTrigger
  ref={budgetTriggerRef}
  id="quote-budget"
  aria-label="Budget range"
  aria-invalid={Boolean(detailErrors.budget)}
  aria-describedby={
    detailErrors.budget ? "quote-budget-error" : undefined
  }
  className={`w-full min-w-0 max-w-full box-border ${
    detailErrors.budget
      ? "border-red-400/70 focus:ring-red-400/20"
      : ""
  }`}
>
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
                    </div>
                  </Field>
                </div>

                <Field label="Additional Notes" htmlFor="quote-message" optional>
                  <textarea
                    className={`${inputClass} h-[90px] min-h-[90px] resize-none overflow-y-auto py-4`}
                    id="quote-message"
                    placeholder="Tell us anything important about your event..."
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      markEdited();
                    }}
                  />
                </Field>
              </div>

              <QuoteSectionDivider />

              {/* ================= SECTION 2 — YOUR EVENTS ================= */}
              <div ref={eventsSectionRef}>
                <QuoteSectionHeading step={2}>Your Events</QuoteSectionHeading>
              </div>

              <div className="mb-4 flex flex-col gap-3.5">
                {events.map((ev, index) => (
                  <EventCard
                    key={ev.id}
                    event={ev}
                    index={index}
                    cardRef={(node) => {
                      eventCardRefs.current[ev.id] = node;
                    }}
                    hasServiceError={invalidServiceEventId === ev.id}
                    removable={events.length > 1}
                    customServiceOpen={Boolean(customServiceOpen[ev.id])}
                    customServiceDraft={customServiceDraft[ev.id] || ""}
                    onTypeChange={(value) => setEventType(ev.id, value)}
                    onCustomTypeChange={(value) => {
                      updateEvent(ev.id, { customType: value });
                      setInvalidCustomEventId((current) =>
                        current === ev.id ? null : current
                      );
                      markEdited();
                    }}
                    isCustomNameInvalid={invalidCustomEventId === ev.id}
                    customNameRef={(node) => {
                      customEventNameRefs.current[ev.id] = node;
                    }}
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

              <QuoteSectionDivider />

<div className="pt-4">
  {/* ================= SECTION 3 — ADD-ONS ================= */}
  <QuoteSectionHeading step={3} optional>
    Add-ons
  </QuoteSectionHeading>
</div>
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

              {quoteGenerated && summaryData && <QuoteSectionDivider />}

{/* ================= SECTION 4 — SUMMARY ================= */}
{quoteGenerated && summaryData && (
  <div
    ref={summaryRef}
    className="mt-2 border-t border-[var(--cream)]/[0.09] pt-7"
  >
    <QuoteSectionHeading step={4}>
      Quote Summary
    </QuoteSectionHeading>

    <div className="mt-5 flex flex-col gap-5">
      {/* BUDGET */}
      {summaryData.budget && (
        <div className="relative overflow-hidden rounded-[14px] border border-[var(--secondary)]/35 bg-[var(--secondary)]/[0.07] px-5 py-4">
          <div className="absolute left-0 top-0 h-full w-[2px] bg-[var(--secondary)]" />

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="mb-1 text-[.6rem] font-medium uppercase tracking-[0.16em] text-[var(--secondary-light)]">
                Selected Budget
              </p>
              <p className="text-[.95rem] font-medium tracking-[0.01em] text-[var(--cream)]">
                {summaryData.budget}
              </p>
            </div>

            <div
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[var(--secondary)]/30 text-[var(--secondary-light)]"
            >
              <span className="font-serif text-[1rem]">₹</span>
            </div>
          </div>
        </div>
      )}

      {/* EVENTS */}
      {summaryData.lines.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-3">
            <span className="text-[.6rem] font-semibold uppercase tracking-[0.16em] text-[var(--cream)]/55">
              Events
            </span>
            <div className="h-px flex-1 bg-[var(--cream)]/[0.08]" />
          </div>

          <div className="flex flex-col gap-3">
            {summaryData.lines.map((line, i) => (
              <div
                key={i}
                className="rounded-[14px] border border-[var(--secondary)]/18 bg-black/[0.16] px-5 py-4"
              >
                {/* Event heading */}
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h4 className="text-[.9rem] font-semibold tracking-[0.01em] text-[var(--cream)]">
                      {line.label}
                    </h4>

                    {(line.date || line.venue) && (
                      <p className="mt-1 text-[.7rem] leading-[1.5] text-[var(--cream)]/65">
                        {line.date ? formatDate(line.date) : ""}
                        {line.date && line.venue ? "  ·  " : ""}
                        {line.venue || ""}
                      </p>
                    )}
                  </div>

                  <span className="shrink-0 text-[.58rem] font-medium uppercase tracking-[0.12em] text-[var(--secondary-light)]/75">
                    Event {i + 1}
                  </span>
                </div>

                {/* Services */}
                {/* SERVICES */}
{line.services.length > 0 && (
  <div className="border-t border-[var(--cream)]/[0.07] pt-3">
    <p className="mb-1.5 text-[.57rem] font-medium uppercase tracking-[0.14em] text-[var(--cream)]/45">
      Coverage
    </p>

    <div className="flex flex-col">
      {line.services.map((s, serviceIndex) => (
        <div
          key={s.name}
          className={`flex items-center justify-between gap-4 py-2.5 ${
            serviceIndex !== line.services.length - 1
              ? "border-b border-[var(--cream)]/[0.055]"
              : ""
          }`}
        >
          <span className="min-w-0 text-[.76rem] text-[var(--cream)]/90">
            {s.name}
          </span>

          {s.qty > 1 && (
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-[var(--secondary)]/30 bg-[var(--secondary)]/[0.06] text-[.62rem] font-medium text-[var(--secondary-light)]">
              {s.qty}
            </span>
          )}
        </div>
      ))}
    </div>
  </div>
)}
              </div>
            ))}
          </div>
        </div>
      )}

{/* ADD-ONS */}
{summaryData.addOns.length > 0 && (
  <div>
    <div className="mb-3 flex items-center gap-3">
      <span className="text-[.6rem] font-semibold uppercase tracking-[0.16em] text-[var(--cream)]/55">
        Add-ons
      </span>
      <div className="h-px flex-1 bg-[var(--cream)]/[0.08]" />
    </div>

    <div className="rounded-[14px] border border-[var(--secondary)]/18 bg-black/[0.16] px-5">
      <div className="flex flex-col">
        {summaryData.addOns.map((a, index) => (
          <div
            key={a.name}
            className={`flex items-center justify-between gap-4 py-3 ${
              index !== summaryData.addOns.length - 1
                ? "border-b border-[var(--cream)]/[0.055]"
                : ""
            }`}
          >
            <span className="min-w-0 text-[.76rem] text-[var(--cream)]/90">
              {a.name}
            </span>

            {a.qty > 1 && (
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-[var(--secondary)]/30 bg-[var(--secondary)]/[0.06] text-[.62rem] font-medium text-[var(--secondary-light)]">
                {a.qty}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  </div>
)}
    </div>

    {/* NOTE */}
    <div className="mt-6 flex gap-3 border-t border-[var(--cream)]/[0.07] pt-4">
      <div className="mt-[4px] h-2 w-2 shrink-0 rounded-full bg-[var(--secondary)]" />

      <p className="text-[.7rem] leading-[1.65] text-[var(--cream)]/70">
        This is a preliminary quote request. Final pricing will be
        confirmed after reviewing your requirements.
      </p>
    </div>
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

              <div className="flex shrink-0 items-center justify-end gap-2 self-end sm:self-auto">
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
        )}

        {mode === "expanded" && success && (
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

        {mode === "mini" && (
  <div className="flex h-full min-h-[76px] w-full items-center justify-between gap-4 py-2 pl-6 pr-5 sm:pr-6">
    <div className="flex min-w-0 items-center gap-3.5">
      <img
        src="/brand/icon.png"
        alt=""
        className="size-[40px] shrink-0 rounded-full border border-[var(--secondary)]/48 object-cover"
      />
      <div className="min-w-0">
        <span className="block text-[.6rem] uppercase tracking-[0.12em] text-[var(--secondary-light)]">
          Quote in progress
        </span>
        <span className="block truncate text-[.8rem] text-[var(--cream)]">
          Your quote is ready to continue
        </span>
      </div>
    </div>

    <button
      type="button"
      aria-label="Delete saved quote session"
      onClick={(e) => {
        e.stopPropagation();
        deleteSession();
      }}
      className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[var(--cream)]/25 text-[var(--cream)]/70 transition-colors hover:border-red-300/65 hover:text-red-200"
    >
      <Trash2 className="size-5" />
    </button>
  </div>
)}
        </div>
      </div>

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
   SECTION DIVIDER
   ========================================================== */

function QuoteSectionDivider() {
  return (
    <div
      aria-hidden="true"
      className="mx-auto my-7 h-[2px] w-4/5 bg-[var(--secondary)]"
      style={{
        clipPath: "polygon(0 50%, 2% 0, 98% 0, 100% 50%, 98% 100%, 2% 100%)",
      }}
    />
  );
}

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
  index,
  cardRef,
  hasServiceError,
  removable,
  customServiceOpen,
  customServiceDraft,
  onTypeChange,
  onCustomTypeChange,
  customNameRef,
  isCustomNameInvalid,
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
  index: number;
  cardRef?: (node: HTMLDivElement | null) => void;
  hasServiceError?: boolean;
  removable: boolean;
  customServiceOpen: boolean;
  customServiceDraft: string;
  onTypeChange: (value: string) => void;
  onCustomTypeChange: (value: string) => void;
  customNameRef?: React.Ref<HTMLInputElement>;
  isCustomNameInvalid?: boolean;
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
    <div
      ref={cardRef}
      className={`rounded-[16px] border bg-black/[0.22] p-4 transition-colors sm:p-5 ${
        hasServiceError
          ? "border-red-400/70 ring-2 ring-red-400/25"
          : "border-[var(--secondary)]/20 hover:border-[var(--secondary)]/32"
      }`}
    >
      {/*
        Card header. The remove button has its own row rather than being
        absolutely positioned over the first field. The old approach
        needed right-padding on that row to avoid an overlap, which is
        what kept Event Type and the custom-name input narrower than
        Date and Venue below. With the button here, no field row carries
        any padding and they all span the card edge to edge.
      */}
      <div className="mb-3 flex min-h-[28px] items-center justify-between gap-3">
        <span className="text-[.62rem] font-semibold uppercase tracking-[0.13em] text-[var(--cream)]/55">
          Event {index + 1}
        </span>

        {removable && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove event ${index + 1}`}
            className="flex size-7 shrink-0 items-center justify-center rounded-full border border-[var(--secondary)]/25 bg-black/20 text-[var(--cream)]/55 transition-colors hover:border-[var(--secondary-light)]/60 hover:bg-[var(--secondary)]/10 hover:text-[var(--secondary-light)]"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Row 1 — Event Type, and the custom-name input when it applies.
          Both are their own full-width row. */}
      <div className="mb-3 flex w-full min-w-0 flex-col gap-3">
        <div className="w-full min-w-0 max-w-full">
          <Field label="Event Type">
            {/*
              The trigger is wrapped so the width is forced from the
              parent. shadcn's SelectTrigger ships with `w-fit` baked
              into its own class list; passing `w-full` down relies on
              tailwind-merge stripping it, which silently fails if the
              component spreads className in the wrong order. A child
              selector emits real `!important` CSS, so it wins either
              way.
            */}
            <div className="w-full min-w-0 max-w-full [&>button]:!box-border [&>button]:!flex [&>button]:!h-[54px] [&>button]:!w-full [&>button]:!min-w-0 [&>button]:!max-w-full">
              <Select value={selectValue} onValueChange={onTypeChange}>
                <SelectTrigger
  aria-label="Event type"
  className="w-full min-w-0 max-w-full truncate box-border"
>
  <SelectValue className="truncate" />
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
          </Field>
        </div>

        {event.isCustomType && (
          <div className="w-full min-w-0 max-w-full">
            <Field
              label="Custom Event Name"
              error={
                isCustomNameInvalid
                  ? "Please name this event."
                  : undefined
              }
            >
              <input
                ref={customNameRef}
                className={inputCls(isCustomNameInvalid)}
                type="text"
                placeholder="Name this event"
                value={event.customType}
                onChange={(e) => onCustomTypeChange(e.target.value)}
                aria-invalid={isCustomNameInvalid}
                autoFocus
              />
            </Field>
          </div>
        )}
      </div>

      {/* Row 2 — Date and Venue stack full-width on mobile, share the
          row equally (50/50) from sm up. */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="w-full min-w-0 max-w-full sm:w-1/2">
          <Field label="Date" optional>
            <input
              className={`${inputClass} ${dateInputFix} [color-scheme:dark] accent-[var(--secondary)]`}
              type="date"
              value={event.date}
              onChange={(e) => onDateChange(e.target.value)}
              aria-label="Event date"
            />
          </Field>
        </div>

        <div className="w-full min-w-0 max-w-full sm:w-1/2">
          <Field label="Venue" optional>
            <input
              className={`${inputClass} min-w-0 max-w-full box-border`}
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
            className="h-9 rounded-[8px] bg-[var(--secondary-light)] px-3 text-[.64rem] font-semibold uppercase tracking-[0.06em] !text-[var(--primary-darkest)]"
          >
            Add
          </button>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        {event.services.length === 0 ? (
          <div
            role={hasServiceError ? "alert" : undefined}
            className={`text-[.78rem] ${
              hasServiceError ? "text-red-300" : "text-[var(--cream)]/40"
            }`}
          >
            {hasServiceError
              ? "Pick at least one service for this event."
              : "No services selected yet."}
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
            className="h-9 rounded-[8px] bg-[var(--secondary-light)] px-3 text-[.64rem] font-semibold uppercase tracking-[0.06em] !text-[var(--primary-darkest)]"
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