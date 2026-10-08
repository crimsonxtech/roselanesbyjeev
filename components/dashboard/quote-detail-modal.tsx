"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Minus, Pencil, Plus, Save, Send, Trash2, X } from "lucide-react";
import { useBodyScrollLock } from "@/hooks/use-body-scroll-lock";
import { PRODUCTION_STAGE_LABELS, isEmailPending } from "@/lib/quote-status";
import type { QuoteWithRelations } from "./kanban-board";
import type { EventProductionStage } from "@/generated/prisma/client";

const inputClass =
  "w-full rounded-lg border border-[var(--glass-border)] bg-black/20 px-3 py-2.5 text-sm text-[var(--cream)] outline-none focus:border-[var(--secondary)]";

const DEFAULT_DELIVERABLES = [
  `Edited
Edited photos from all events, based on the number of events, delivered on cloud. All the raw photos will be delivered through HDDs.`,
  `Cinematic Film
A cinematic film of 5-7 minutes with the best footage from your events, edited according to our style, to be delivered on cloud. (You can suggest any number of changes within a week of a delivery.)`,
  `One Hour Traditional Video
A traditional video of about 30 to 60 min each depending on the event, with the best footage from your events. If you need a dedicated video specific to an event, additional charges are applicable at RS. 10,000/- and event raw videos will be delivered through HDDs, just as they are shot in clips.`,
  `Note: Cloud deliverables will be available for 1 year from delivery`,
];

const DEFAULT_TERMS = [
  `Travel Expenses
You shall arrange for the travel and accommodation of our shoot crew for all your events occurring in places away from our offices.`,
  `Change of Plans
Any change of plans or postponement of events will be accommodated with the best team available on the new dates and chargeable depending on the type of events and crew required.`,
  `Event timings
Any events happening at home will be considered within 6 hours. In case of any extension in timings, it has to be intimated in the group, not to the team.`,
  `2 Print Albums (25 sheets in each album)
Please note that the albums will be hand-picked and designed by us. We need you to suggest any changes within 3 days, after which, if no changes are suggested, they will go into printing. (₹10,000 for an extra album and ₹875 for each additional sheet in albums.)`,
  `HDDs
We need 2 hard drives from the client side. This helps us maintain a secure backup, and we will return your hard drives with all event raw data dumps and edited files.`,
  `Food & Dining Coverage
We don't cover food and dining areas, as the guests could feel inconvenienced being watched and recorded. We cover only the setups and keep the shots minimal.`,
  `Cloud Expiry
All the photos and videos shared on cloud will expire in 1 year from the date of delivery. Please download & save the data needed before they expire.`,
  `With Love
Roselanes by jeev`,
];

type DraftEvent = {
  id?: string;
  label: string;
  date: string;
  timeOfDay: string;
  venue: string;
  productionStage?: EventProductionStage;
  services: { name: string; qty: number }[];
};

type DraftAddOn = { name: string; qty: number };

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
  "⁠Albums",
  "⁠Extra Cinematic Trailer Edited video ",
  "⁠Extra Coverage of Event",
];

type QuoteEditDraft = {
  name: string;
  phone: string;
  email: string;
  additionalEmail: string;
  budget: string;
  message: string;
  events: DraftEvent[];
  addOns: DraftAddOn[];
};

function makeDraft(quote: QuoteWithRelations): QuoteEditDraft {
  return {
    name: quote.name,
    phone: quote.phone,
    email: quote.email,
    additionalEmail: quote.additionalEmail ?? "",
    budget: quote.budget,
    message: quote.message ?? "",
    events: quote.events.map((ev) => ({
      id: ev.id,
      label: ev.label,
      date: ev.date ?? "",
      timeOfDay: ev.timeOfDay ?? "",
      venue: ev.venue ?? "",
      productionStage: ev.productionStage,
      services: ev.services.map((s) => ({ name: s.name, qty: s.qty })),
    })),
    addOns: quote.addOns.map((a) => ({ name: a.name, qty: a.qty })),
  };
}

export function QuoteDetailModal({
  quote,
  onClose,
  onQuoteUpdated,
  onQuoteDeleted,
}: {
  quote: QuoteWithRelations;
  onClose: () => void;
  onQuoteUpdated: (quote: QuoteWithRelations) => void;
  onQuoteDeleted: (quoteId: string) => void;
}) {
  useBodyScrollLock(true);

  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState<QuoteEditDraft>(() => makeDraft(quote));
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  const [addOnFormOpen, setAddOnFormOpen] = React.useState(false);
  const [addOnName, setAddOnName] = React.useState("");
  const [addOnQty, setAddOnQty] = React.useState(1);

  const [price, setPrice] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [sendError, setSendError] = React.useState<string | null>(null);
  const [wasPreviouslySent, setWasPreviouslySent] = React.useState(
    !!quote.confirmationSentAt
  );

  const [confirmingDelete, setConfirmingDelete] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setDraft(makeDraft(quote));
  }, [quote]);

  function startEditing() {
    setDraft(makeDraft(quote));
    setSaveError(null);
    setConfirmingDelete(false);
    setDeleteError(null);
    setEditing(true);
  }

  function cancelEditing() {
    setDraft(makeDraft(quote));
    setSaveError(null);
    setEditing(false);
  }

  function updateEvent(index: number, patch: Partial<DraftEvent>) {
    setDraft((prev) => ({
      ...prev,
      events: prev.events.map((event, i) =>
        i === index ? { ...event, ...patch } : event
      ),
    }));
  }

  function addEvent() {
    setDraft((prev) => ({
      ...prev,
      events: [
        ...prev.events,
        {
          label: "Wedding",
          date: "",
          timeOfDay: "",
          venue: "",
          services: [],
        },
      ],
    }));
  }

  function removeEvent(index: number) {
    setDraft((prev) => ({
      ...prev,
      events:
        prev.events.length > 1
          ? prev.events.filter((_, i) => i !== index)
          : prev.events,
    }));
  }

  function toggleService(eventIndex: number, name: string) {
    setDraft((prev) => ({
      ...prev,
      events: prev.events.map((event, i) => {
        if (i !== eventIndex) return event;
        const exists = event.services.some((s) => s.name === name);
        return {
          ...event,
          services: exists
            ? event.services.filter((s) => s.name !== name)
            : [...event.services, { name, qty: 1 }],
        };
      }),
    }));
  }

  function changeServiceQty(eventIndex: number, name: string, delta: number) {
    setDraft((prev) => ({
      ...prev,
      events: prev.events.map((event, i) =>
        i !== eventIndex
          ? event
          : {
              ...event,
              services: event.services.map((service) =>
                service.name === name
                  ? { ...service, qty: Math.max(1, Math.min(5, service.qty + delta)) }
                  : service
              ),
            }
      ),
    }));
  }

  function addCustomService(eventIndex: number) {
    const value = window.prompt("Service name");
    if (!value?.trim()) return;

    setDraft((prev) => ({
      ...prev,
      events: prev.events.map((event, i) => {
        if (i !== eventIndex) return event;
        if (event.services.some((s) => s.name.toLowerCase() === value.trim().toLowerCase())) {
          return event;
        }
        return {
          ...event,
          services: [...event.services, { name: value.trim(), qty: 1 }],
        };
      }),
    }));
  }

  function openAddOnForm() {
    setAddOnName("");
    setAddOnQty(1);
    setAddOnFormOpen(true);
  }

  function cancelAddOnForm() {
    setAddOnName("");
    setAddOnQty(1);
    setAddOnFormOpen(false);
  }

  function addAddOn() {
    const name = addOnName.trim();

    if (!name) return;

    setDraft((prev) => {
      const exists = prev.addOns.some(
        (addon) => addon.name.toLowerCase() === name.toLowerCase()
      );

      if (exists) return prev;

      return {
        ...prev,
        addOns: [
          ...prev.addOns,
          {
            name,
            qty: Math.max(1, Math.min(5, addOnQty)),
          },
        ],
      };
    });

    cancelAddOnForm();
  }

  function changeAddOnQty(index: number, delta: number) {
    setDraft((prev) => ({
      ...prev,
      addOns: prev.addOns.map((addon, i) =>
        i === index
          ? {
              ...addon,
              qty: Math.max(1, Math.min(5, addon.qty + delta)),
            }
          : addon
      ),
    }));
  }

  function removeAddOn(index: number) {
    setDraft((prev) => ({
      ...prev,
      addOns: prev.addOns.filter((_, i) => i !== index),
    }));
  }

  async function saveChanges() {
    setSaving(true);
    setSaveError(null);

    // Did anything actually change? (avoid re-opening "send" on a no-op save)
    const hasChanges = JSON.stringify(draft) !== JSON.stringify(makeDraft(quote));

    try {
      const response = await fetch(`/api/dashboard/quotes/${quote.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to save changes.");
      }

      // An edit invalidates the previously sent email -> allow sending again
      const wasSent = !!quote.confirmationSentAt;
      const updated =
        hasChanges && wasSent
          ? { ...result.quote, confirmationSentAt: null }
          : result.quote;

      if (hasChanges && wasSent) {
        setSent(false); // re-enable the Send button
        setSendError(null);
        setWasPreviouslySent(true);
      }

      onQuoteUpdated(updated);
      setEditing(false);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Failed to save changes."
      );
    } finally {
      setSaving(false);
    }
  }

  async function sendQuotation() {
    const amount = Number(price);
    if (!Number.isFinite(amount) || amount <= 0) {
      setSendError("Enter a valid quotation amount.");
      return;
    }

    setSending(true);
    setSendError(null);

    try {
      const response = await fetch("/api/quote/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId: quote.id,
          client: {
            name: quote.name,
            phone: quote.phone,
            email: quote.email,
            additionalEmail: quote.additionalEmail,
            budget: quote.budget,
          },
          events: quote.events.map((ev) => ({
            id: ev.id,
            label: ev.label,
            date: ev.date,
            venue: ev.venue,
            services: ev.services.map((s) => ({ name: s.name, qty: s.qty })),
          })),
          addOns: quote.addOns.map((a) => ({
            id: a.id,
            name: a.name,
            qty: a.qty,
          })),
          price: amount,
          deliverables: DEFAULT_DELIVERABLES,
          terms: DEFAULT_TERMS,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to send quotation.");
      }

      setSent(true);
      setWasPreviouslySent(true);
      onQuoteUpdated({ ...quote, confirmationSentAt: new Date() });
    } catch (error) {
      setSendError(
        error instanceof Error ? error.message : "Failed to send quotation."
      );
    } finally {
      setSending(false);
    }
  }

  async function deleteQuote() {
    setDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/dashboard/quotes/${quote.id}`, {
        method: "DELETE",
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to delete quote request.");
      }

      onQuoteDeleted(quote.id);
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Failed to delete quote request."
      );
      setDeleting(false);
    }
  }

  const showSendForm = quote.status === "ACCEPTED" && isEmailPending(quote);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4"
      style={{ touchAction: "pan-y" }}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-[14px] border border-[var(--glass-border)] bg-[var(--primary-darkest)] shadow-2xl"
        style={{
          WebkitOverflowScrolling: "touch",
          touchAction: "pan-y",
        }}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--cream)]/[0.08] p-4 sm:p-6">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-[var(--cream)]">
              {editing ? "Edit Request" : quote.name}
            </h2>
            {!editing && (
              <div className="space-y-0.5 text-[.78rem] text-[var(--cream)]/60">
                <p>
                  <span className="text-[var(--cream)]/40">Email:</span>{" "}
                  {quote.email}
                </p>
                {quote.additionalEmail && (
                  <p>
                    <span className="text-[var(--cream)]/40">Additional:</span>{" "}
                    {quote.additionalEmail}
                  </p>
                )}
                <p>
                  <span className="text-[var(--cream)]/40">Phone:</span>{" "}
                  {quote.phone}
                </p>
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {!editing && (
              <>
                <button
                  type="button"
                  onClick={startEditing}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--secondary)]/40 px-3 py-2 text-xs font-semibold text-[var(--secondary-light)] hover:bg-[var(--secondary)]/10"
                >
                  <Pencil size={14} />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteError(null);
                    setConfirmingDelete(true);
                  }}
                  disabled={deleting}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-400/40 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </>
            )}
            <button type="button" onClick={onClose} aria-label="Close">
              <X className="h-5 w-5 text-[var(--cream)]/60" />
            </button>
          </div>
        </div>

        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6"
          style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}
        >
          {editing ? (
            <div className="space-y-6">
              <section>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--secondary)]">
                  Client Details
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    className={inputClass}
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    placeholder="Full name"
                  />
                  <input
                    className={inputClass}
                    value={draft.phone}
                    onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                    placeholder="Phone"
                  />
                  <input
                    className={inputClass}
                    type="email"
                    value={draft.email}
                    onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                    placeholder="Email"
                  />

                  <input
                    className={inputClass}
                    type="email"
                    value={draft.additionalEmail}
                    onChange={(e) =>
                      setDraft({ ...draft, additionalEmail: e.target.value })
                    }
                    placeholder="Additional email"
                  />

                  <input
                    className={inputClass}
                    value={draft.budget}
                    onChange={(e) => setDraft({ ...draft, budget: e.target.value })}
                    placeholder="Budget"
                  />
                </div>

                <textarea
                  className={`${inputClass} mt-3 min-h-24 resize-y`}
                  value={draft.message}
                  onChange={(e) => setDraft({ ...draft, message: e.target.value })}
                  placeholder="Additional notes"
                />
              </section>

              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--secondary)]">
                    Events
                  </h3>
                  <button
                    type="button"
                    onClick={addEvent}
                    className="inline-flex items-center gap-1 text-xs text-[var(--secondary-light)]"
                  >
                    <Plus size={14} /> Add event
                  </button>
                </div>

                <div className="space-y-4">
                  {draft.events.map((event, index) => (
                    <div
                      key={event.id ?? `new-${index}`}
                      className="rounded-xl border border-[var(--cream)]/[0.08] bg-black/10 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-semibold text-[var(--cream)]">
                          Event {index + 1}
                        </span>
                        {draft.events.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEvent(index)}
                            className="text-red-300/70 hover:text-red-300"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <input
                          className={inputClass}
                          value={event.label}
                          onChange={(e) => updateEvent(index, { label: e.target.value })}
                          placeholder="Event type / name"
                        />
                        <input
                          className={inputClass}
                          type="date"
                          value={event.date}
                          onChange={(e) => updateEvent(index, { date: e.target.value })}
                        />
                        <select
                          className={inputClass}
                          value={event.timeOfDay}
                          onChange={(e) => updateEvent(index, { timeOfDay: e.target.value })}
                        >
                          <option value="">Time of day</option>
                          <option>Morning</option>
                          <option>Afternoon</option>
                          <option>Evening</option>
                          <option>Night</option>
                        </select>
                        <input
                          className={inputClass}
                          value={event.venue}
                          onChange={(e) => updateEvent(index, { venue: e.target.value })}
                          placeholder="Venue"
                        />
                      </div>

                      <div className="mt-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-[.7rem] font-semibold uppercase tracking-[0.1em] text-[var(--cream)]/50">
                            Services
                          </span>
                          <button
                            type="button"
                            onClick={() => addCustomService(index)}
                            className="text-xs text-[var(--secondary-light)]"
                          >
                            + Custom service
                          </button>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          {event.services.length === 0 ? (
                            <div className="text-[.78rem] text-[var(--cream)]/40">
                              No services selected yet.
                            </div>
                          ) : (
                            event.services.map((service) => (
                              <div
                                key={service.name}
                                className="flex w-full items-center justify-between gap-3 rounded-[8px] border border-[var(--cream)]/[0.07] bg-[var(--cream)]/[0.025] px-3 py-2"
                              >
                                <div className="min-w-0 truncate text-[.82rem] text-[var(--cream)]/90">
                                  {service.name}
                                </div>

                                <div className="flex shrink-0 items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => changeServiceQty(index, service.name, -1)}
                                    disabled={service.qty <= 1}
                                    aria-label={`Decrease ${service.name} quantity`}
                                    className="flex size-[25px] items-center justify-center rounded-full border border-[var(--glass-border)] text-[var(--cream)] transition-colors hover:border-[var(--secondary)] hover:text-[var(--secondary-light)] disabled:cursor-default disabled:opacity-25"
                                  >
                                    <Minus className="size-3" />
                                  </button>

                                  <span className="min-w-[16px] text-center text-sm font-semibold text-[var(--secondary-light)]">
                                    {service.qty}
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() => changeServiceQty(index, service.name, 1)}
                                    disabled={service.qty >= 5}
                                    aria-label={`Increase ${service.name} quantity`}
                                    className="flex size-[25px] items-center justify-center rounded-full border border-[var(--glass-border)] text-[var(--cream)] transition-colors hover:border-[var(--secondary)] hover:text-[var(--secondary-light)] disabled:cursor-default disabled:opacity-25"
                                  >
                                    <Plus className="size-3" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateEvent(index, {
                                        services: event.services.filter(
                                          (s) => s.name !== service.name
                                        ),
                                      })
                                    }
                                    className="p-1 text-[var(--cream)]/35 transition-colors hover:text-red-300"
                                    aria-label={`Remove ${service.name}`}
                                  >
                                    <Trash2 className="size-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {SERVICE_CATALOG.map((service) => {
                            const active = event.services.some((s) => s.name === service);
                            return (
                              <button
                                key={service}
                                type="button"
                                onClick={() => toggleService(index, service)}
                                className={`rounded-full border px-2.5 py-1 text-[.68rem] ${
                                  active
                                    ? "border-[var(--secondary)] bg-[var(--secondary)]/15 text-[var(--secondary-light)]"
                                    : "border-[var(--cream)]/10 text-[var(--cream)]/55"
                                }`}
                              >
                                {service}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--secondary)]">
                    Add-ons
                  </h3>

                  {!addOnFormOpen && (
                    <button
                      type="button"
                      onClick={openAddOnForm}
                      className="inline-flex items-center gap-1 text-xs text-[var(--secondary-light)] hover:text-[var(--cream)]"
                    >
                      <Plus size={14} />
                      Custom add-on
                    </button>
                  )}
                </div>

                <div className="mb-3 flex flex-wrap gap-1.5">
                  {ADDON_CATALOG.map((name) => {
                    const active = draft.addOns.some((addon) => addon.name === name);

                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => {
                          const existingIndex = draft.addOns.findIndex(
                            (addon) => addon.name === name
                          );

                          if (existingIndex >= 0) {
                            removeAddOn(existingIndex);
                          } else {
                            setDraft((prev) => ({
                              ...prev,
                              addOns: [...prev.addOns, { name, qty: 1 }],
                            }));
                          }
                        }}
                        className={`inline-flex min-h-[28px] items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium leading-tight transition-all duration-200 sm:min-h-[34px] sm:px-3.5 sm:py-1.5 sm:text-xs ${
                          active
                            ? "border-[var(--secondary)] bg-gradient-to-br from-[var(--secondary-light)] to-[var(--secondary)] !text-[var(--primary-darkest)] font-semibold shadow-[0_4px_14px_rgba(0,0,0,.20)]"
                            : "border-[var(--glass-border)] bg-black/20 text-[var(--cream)]/80 hover:border-[var(--secondary)]/60 hover:text-[var(--cream)]"
                        }`}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-col gap-1.5">
                  {draft.addOns.length === 0 ? (
                    <div className="text-[.78rem] text-[var(--cream)]/40">
                      No add-ons selected yet.
                    </div>
                  ) : (
                    draft.addOns.map((addon, index) => (
                      <div
                        key={`${addon.name}-${index}`}
                        className="flex w-full items-center justify-between gap-3 rounded-[8px] border border-[var(--cream)]/[0.07] bg-[var(--cream)]/[0.025] px-3 py-2"
                      >
                        <input
                          className={`${inputClass} min-w-0 flex-1`}
                          value={addon.name}
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              addOns: prev.addOns.map((a, i) =>
                                i === index ? { ...a, name: e.target.value } : a
                              ),
                            }))
                          }
                          placeholder="Add-on name"
                        />

                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={() => changeAddOnQty(index, -1)}
                            disabled={addon.qty <= 1}
                            aria-label={`Decrease ${addon.name} quantity`}
                            className="flex size-[25px] items-center justify-center rounded-full border border-[var(--glass-border)] text-[var(--cream)] transition-colors hover:border-[var(--secondary)] hover:text-[var(--secondary-light)] disabled:cursor-default disabled:opacity-25"
                          >
                            <Minus className="size-3" />
                          </button>

                          <span className="min-w-[16px] text-center text-sm font-semibold text-[var(--secondary-light)]">
                            {addon.qty}
                          </span>

                          <button
                            type="button"
                            onClick={() => changeAddOnQty(index, 1)}
                            disabled={addon.qty >= 5}
                            aria-label={`Increase ${addon.name} quantity`}
                            className="flex size-[25px] items-center justify-center rounded-full border border-[var(--glass-border)] text-[var(--cream)] transition-colors hover:border-[var(--secondary)] hover:text-[var(--secondary-light)] disabled:cursor-default disabled:opacity-25"
                          >
                            <Plus className="size-3" />
                          </button>

                          <button
                            type="button"
                            onClick={() => removeAddOn(index)}
                            className="p-1 text-[var(--cream)]/35 transition-colors hover:text-red-300"
                            aria-label={`Remove ${addon.name}`}
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {addOnFormOpen && (
                  <div className="mt-3 rounded-xl border border-[var(--secondary)]/25 bg-[var(--secondary)]/[0.04] p-3">
                    <div className="mb-2 text-[.68rem] font-semibold uppercase tracking-[0.1em] text-[var(--cream)]/50">
                      New add-on
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        autoFocus
                        className={`${inputClass} min-w-0 flex-1`}
                        value={addOnName}
                        onChange={(e) => setAddOnName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addAddOn();
                          }

                          if (e.key === "Escape") {
                            e.preventDefault();
                            cancelAddOnForm();
                          }
                        }}
                        placeholder="e.g. Traditional Attire Styling"
                      />

                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setAddOnQty((qty) => Math.max(1, qty - 1))}
                          disabled={addOnQty <= 1}
                          aria-label="Decrease quantity"
                          className="flex size-[25px] items-center justify-center rounded-full border border-[var(--glass-border)] text-[var(--cream)] disabled:opacity-25"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="min-w-[16px] text-center text-sm font-semibold text-[var(--secondary-light)]">
                          {addOnQty}
                        </span>
                        <button
                          type="button"
                          onClick={() => setAddOnQty((qty) => Math.min(5, qty + 1))}
                          disabled={addOnQty >= 5}
                          aria-label="Increase quantity"
                          className="flex size-[25px] items-center justify-center rounded-full border border-[var(--glass-border)] text-[var(--cream)] disabled:opacity-25"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={cancelAddOnForm}
                        className="rounded-lg border border-[var(--cream)]/10 px-3 py-2 text-xs text-[var(--cream)]/60 hover:text-[var(--cream)]"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={addAddOn}
                        disabled={!addOnName.trim()}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--secondary)] px-3 py-2 text-xs font-semibold text-[var(--primary-darkest)] disabled:opacity-40"
                      >
                        <Plus size={13} />
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </section>

              {saveError && <p className="text-sm text-red-300">{saveError}</p>}

              <div className="sticky bottom-0 flex justify-end gap-2 border-t border-[var(--cream)]/[0.08] bg-[var(--primary-darkest)] pt-4">
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="rounded-lg border border-[var(--cream)]/15 px-4 py-2.5 text-sm text-[var(--cream)]/70"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveChanges}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-[var(--secondary)] px-4 py-2.5 text-sm font-semibold text-[var(--primary-darkest)] disabled:opacity-60"
                >
                  <Save size={15} />
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          ) : (
            <>
              {confirmingDelete && (
                <div className="mb-5 rounded-[10px] border border-red-400/30 bg-red-500/[0.07] p-4">
                  <p className="text-sm font-semibold text-red-200">
                    Delete this quote request?
                  </p>
                  <p className="mt-1 text-xs text-[var(--cream)]/60">
                    This permanently removes {quote.name}&apos;s request, including its
                    events, services and add-ons, from the database. This cannot be
                    undone.
                  </p>
                  {deleteError && (
                    <p className="mt-2 text-xs text-red-300">{deleteError}</p>
                  )}
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmingDelete(false);
                        setDeleteError(null);
                      }}
                      disabled={deleting}
                      className="rounded-lg border border-[var(--cream)]/15 px-3 py-2 text-xs text-[var(--cream)]/70 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={deleteQuote}
                      disabled={deleting}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-60"
                    >
                      <Trash2 size={13} />
                      {deleting ? "Deleting..." : "Yes, delete"}
                    </button>
                  </div>
                </div>
              )}

              <div className="mb-4 flex items-center justify-between">
                <p className="text-[.82rem] text-[var(--cream)]/80">
                  Budget: {quote.budget}
                </p>
                <span className="text-[.7rem] text-[var(--cream)]/40">
                  {quote.status.replaceAll("_", " ")}
                </span>
              </div>

              <div className="space-y-3">
                {quote.events.map((ev) => (
                  <div
                    key={ev.id}
                    className="rounded-[8px] border border-[var(--cream)]/[0.08] p-3"
                  >
                    <p className="text-[.86rem] font-medium text-[var(--cream)]">
                      {ev.label} — {ev.date} {ev.timeOfDay && `(${ev.timeOfDay})`}
                    </p>
                    <p className="text-[.74rem] text-[var(--cream)]/50">{ev.venue}</p>
                    <p className="mt-1 text-[.78rem] text-[var(--cream)]/70">
                      {ev.services.map((s) => `${s.name} x${s.qty}`).join(", ")}
                    </p>
                    {quote.status === "IN_PROGRESS" && (
                      <p className="mt-1 text-[.72rem] text-[var(--secondary-light)]">
                        Stage: {PRODUCTION_STAGE_LABELS[ev.productionStage]}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {quote.addOns.length > 0 && (
                <p className="mt-3 text-[.78rem] text-[var(--cream)]/60">
                  Add-ons: {quote.addOns.map((a) => `${a.name} x${a.qty}`).join(", ")}
                </p>
              )}

              {quote.message && (
                <p className="mt-3 whitespace-pre-wrap text-[.78rem] italic text-[var(--cream)]/70">
                  "{quote.message}"
                </p>
              )}

              {showSendForm && (
                <div className="mt-5 rounded-[10px] border border-[var(--secondary)]/30 bg-[var(--secondary)]/[0.06] p-4">
                  <p className="mb-2 text-[.7rem] font-semibold uppercase tracking-[0.1em] text-[var(--secondary-light)]">
                    {wasPreviouslySent ? "Send updated quotation" : "Send quotation"}
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      inputMode="numeric"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="₹ Enter amount"
                      disabled={sent}
                      className={`${inputClass} min-h-[40px] flex-1`}
                    />
                    <button
                      type="button"
                      onClick={sendQuotation}
                      disabled={sending || sent}
                      className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-[var(--secondary)] px-4 text-sm font-semibold text-[var(--primary-darkest)] disabled:opacity-60"
                    >
                      <Send size={14} />
                      {sent ? "Sent" : sending ? "Sending..." : "Send"}
                    </button>
                  </div>
                  {sendError && <p className="mt-2 text-xs text-red-300">{sendError}</p>}
                  {sent && (
                    <p className="mt-2 text-xs text-[var(--secondary-light)]">
                      Quotation sent to the client.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}