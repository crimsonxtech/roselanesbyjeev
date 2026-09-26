"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Send, X } from "lucide-react";
import { useBodyScrollLock } from "@/hooks/use-body-scroll-lock";
import { PRODUCTION_STAGE_LABELS, isEmailPending } from "@/lib/quote-status";
import type { QuoteWithRelations } from "./kanban-board";

/*
 * Standard deliverables / terms copy, carried over from the original
 * quotation-desk prototype. These rarely change per client — if you need
 * per-quote overrides later, this is the place to add an editor like the
 * old admin page had.
 */
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
All the photos and videos shared on cloud will expire in 1 year from the date of delivery. Please download & save the data needed before they expire. You may extend the expiry date by paying additional charges.`,

  `With Love
Roselanes by jeev`,
];

export function QuoteDetailModal({
  quote,
  onClose,
  onQuoteUpdated,
}: {
  quote: QuoteWithRelations;
  onClose: () => void;
  onQuoteUpdated: (quote: QuoteWithRelations) => void;
}) {
  useBodyScrollLock(true);

  const [price, setPrice] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Only accepted quotes that haven't had a confirmation email sent yet
  // get the send form — matches the "⚠ Email not sent" badge on the card.
  const showSendForm = quote.status === "ACCEPTED" && isEmailPending(quote);

  async function sendQuotation() {
    const amount = Number(price);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid quotation amount.");
      return;
    }

    setSending(true);
    setError(null);

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
      onQuoteUpdated({ ...quote, confirmationSentAt: new Date() });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send quotation."
      );
    } finally {
      setSending(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-[14px] border border-[var(--glass-border)] bg-[var(--primary-darkest)] p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--cream)]">
              {quote.name}
            </h2>
            <p className="text-[.78rem] text-[var(--cream)]/60">
              {quote.email} · {quote.phone}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close">
            <X className="h-5 w-5 text-[var(--cream)]/60" />
          </button>
        </div>

        <p className="mb-4 text-[.82rem] text-[var(--cream)]/80">
          Budget: {quote.budget}
        </p>

        <div className="space-y-3">
          {quote.events.map((ev) => (
            <div
              key={ev.id}
              className="rounded-[8px] border border-[var(--cream)]/[0.08] p-3"
            >
              <p className="text-[.86rem] font-medium text-[var(--cream)]">
                {ev.label} — {ev.date} {ev.timeOfDay && `(${ev.timeOfDay})`}
              </p>
              <p className="text-[.74rem] text-[var(--cream)]/50">
                {ev.venue}
              </p>
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
              Send quotation
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
                className="min-h-[40px] flex-1 rounded-lg border border-[var(--glass-border)] bg-black/20 px-3 text-sm text-[var(--cream)] outline-none focus:border-[var(--secondary)] disabled:opacity-60"
              />

              <button
                type="button"
                onClick={sendQuotation}
                disabled={sending || sent}
                className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-[var(--secondary)] px-4 text-sm font-semibold !text-[var(--primary-darkest)] transition-colors hover:bg-[var(--secondary-light)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send size={14} />
                {sent ? "Sent" : sending ? "Sending..." : "Send"}
              </button>
            </div>

            {error && (
              <p className="mt-2 text-[.72rem] text-red-300">{error}</p>
            )}

            {sent && (
              <p className="mt-2 text-[.72rem] text-[var(--secondary-light)]">
                Quotation sent to the client, and a confirmation copy to
                roselanesbyjeev@gmail.com.
              </p>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}