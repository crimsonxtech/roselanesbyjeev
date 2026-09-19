"use client";

import * as React from "react";
import {
  ChevronDown,
  Pencil,
  Plus,
  Send,
  Trash2,
  X,
} from "lucide-react";

type Service = {
  name: string;
  qty: number;
};

type EventItem = {
  id: number;
  label: string;
  date: string;
  venue: string;
  services: Service[];
};

type EditType = "deliverables" | "terms" | "note" | null;

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

const INITIAL_EVENTS: EventItem[] = [
  {
    id: 1,
    label: "Engagement",
    date: "2026-11-01",
    venue: "kamareddy",
    services: [
      { name: "Traditional Photography", qty: 1 },
      { name: "Traditional Videography", qty: 1 },
      { name: "Candid Photography", qty: 1 },
      { name: "Cinematic Videography", qty: 1 },
      { name: "Instant Reels", qty: 1 },
    ],
  },
  {
    id: 2,
    label: "pasupu",
    date: "2026-11-29",
    venue: "kamareddy",
    services: [
      { name: "Traditional Videography", qty: 1 },
      { name: "Traditional Photography", qty: 1 },
      { name: "Instant Reels", qty: 1 },
    ],
  },
  {
    id: 3,
    label: "Bride ceremony",
    date: "2026-12-01",
    venue: "kamareddy",
    services: [
      { name: "Traditional Photography", qty: 1 },
      { name: "Traditional Videography", qty: 1 },
    ],
  },
  {
    id: 4,
    label: "Bride haldi",
    date: "2026-11-01",
    venue: "kamareddy",
    services: [
      { name: "Traditional Photography", qty: 1 },
      { name: "Traditional Videography", qty: 1 },
      { name: "Candid Photography", qty: 1 },
      { name: "Cinematic Videography", qty: 1 },
      { name: "Instant Reels", qty: 1 },
    ],
  },
  {
    id: 5,
    label: "Bride ceremony",
    date: "2026-12-02",
    venue: "kamareddy",
    services: [
      { name: "Traditional Photography", qty: 1 },
      { name: "Traditional Videography", qty: 1 },
      { name: "Instant Reels", qty: 1 },
    ],
  },
  {
    id: 6,
    label: "Wedding",
    date: "2026-12-03",
    venue: "kvs gardens kamareddy",
    services: [
      { name: "Traditional Photography", qty: 1 },
      { name: "Traditional Videography", qty: 1 },
      { name: "Instant Reels", qty: 1 },
      { name: "Cinematic Videography", qty: 1 },
      { name: "Drone Coverage", qty: 1 },
      { name: "Candid Photography", qty: 1 },
    ],
  },
  {
    id: 7,
    label: "Reception",
    date: "2026-12-06",
    venue: "kamareddy",
    services: [
      { name: "Traditional Photography", qty: 1 },
      { name: "Candid Photography", qty: 1 },
      { name: "Cinematic Videography", qty: 1 },
      { name: "Drone Coverage", qty: 1 },
      { name: "Traditional Videography", qty: 1 },
      { name: "Instant Reels", qty: 1 },
    ],
  },
];

function formatDate(value: string) {
  if (!value) return "No date";

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--secondary)]">
        {eyebrow}
      </p>
      <h2 className="mt-1 font-display text-2xl sm:text-3xl">{title}</h2>
      {subtitle && (
        <p className="mt-1 text-xs text-[var(--cream)]/40">{subtitle}</p>
      )}
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-[var(--glass-border)] p-3">
      <p className="text-[10px] uppercase tracking-[0.13em] text-[var(--cream)]/45">
        {label}
      </p>
      <p className="mt-1 break-words text-sm">{value}</p>
    </div>
  );
}

function DeliverablesCard({
  items,
  onEdit,
}: {
  items: string[];
  onEdit: () => void;
}) {
  const photos = items[0]?.split("\n") ?? ["Edited", ""];
  const cinematic = items[1]?.split("\n") ?? ["Cinematic Film", ""];
  const traditional =
    items[2]?.split("\n") ?? ["One Hour Traditional Video", ""];
  const note =
    items[3] ??
    "Note: Cloud deliverables will be available for 1 year from delivery";

  return (
    <section className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-3xl text-[var(--cream)]">
          Deliverables
        </h2>

        <button
          type="button"
          onClick={onEdit}
          aria-label="Edit Deliverables"
          className="rounded-lg p-2 text-[var(--secondary-light)] transition-colors hover:bg-white/[0.05]"
        >
          <Pencil size={15} />
        </button>
      </div>

      {/* PHOTOS — keep this partition separate */}
      <div className="mt-5">
        <p className="text-center font-display text-3xl text-[var(--secondary)]">
          PHOTOS
        </p>

        <div className="mt-2 rounded-[2rem] border-2 border-[var(--secondary)] p-6 sm:p-8">
          <p className="text-center text-lg font-semibold text-[var(--secondary)]">
            {photos[0]}
          </p>

          <p className="mx-auto mt-5 max-w-5xl text-base leading-7 text-[var(--cream)]/70">
            {photos.slice(1).join("\n")}
          </p>
        </div>
      </div>

      {/* VIDEOS — keep this partition separate */}
      <div className="mt-8">
        <p className="text-center font-display text-3xl text-[var(--secondary)]">
          VIDEOS
        </p>

        <div className="mt-2 rounded-[2rem] border-2 border-[var(--secondary)] p-6 sm:p-8">
          <p className="text-center text-lg font-semibold text-[var(--secondary)]">
            {cinematic[0]}
          </p>

          <p className="mx-auto mt-5 max-w-5xl text-base leading-7 text-[var(--cream)]/70">
            {cinematic.slice(1).join("\n")}
          </p>

          <p className="mt-6 text-center text-lg font-semibold text-[var(--secondary)]">
            {traditional[0]}
          </p>

          <p className="mx-auto mt-5 max-w-5xl text-base leading-7 text-[var(--cream)]/70">
            {traditional.slice(1).join("\n")}
          </p>
        </div>
      </div>

      <p className="mt-5 text-sm leading-6 text-[var(--cream)]/65">
        {note}
      </p>
    </section>
  );
}

function TermsCard({
  items,
  onEdit,
}: {
  items: string[];
  onEdit: () => void;
}) {
  return (
    <section className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="w-full text-center font-display text-2xl text-[var(--cream)]">
          Terms and Conditions
        </h2>

        <button
          type="button"
          onClick={onEdit}
          aria-label="Edit Terms and Conditions"
          className="shrink-0 rounded-lg p-2 text-[var(--secondary-light)] transition-colors hover:bg-white/[0.05]"
        >
          <Pencil size={15} />
        </button>
      </div>

      <div className="mt-5 space-y-7">
        {items.map((item, index) => {
          const [heading, ...body] = item.split("\n");

          return (
            <div key={`${heading}-${index}`}>
              <p className="text-sm font-medium text-[var(--secondary)]">
                {heading}
              </p>

              {body.length > 0 && (
                <p className="mt-1 whitespace-pre-line text-sm leading-5 text-[var(--cream)]/70">
                  {body.join("\n")}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function NoteCard({
  note,
  onEdit,
}: {
  note: string;
  onEdit: () => void;
}) {
  return (
    <section className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">Note</p>

        <button
          type="button"
          onClick={onEdit}
          aria-label="Edit Note"
          className="rounded-lg p-2 text-[var(--secondary-light)] transition-colors hover:bg-white/[0.05]"
        >
          <Pencil size={15} />
        </button>
      </div>

      <p className="mt-4 whitespace-pre-line text-sm leading-6 text-[var(--cream)]/60">
        {note || "No note added."}
      </p>
    </section>
  );
}

function EditorModal({
  type,
  terms,
  setTerms,
  deliverables,
  setDeliverables,
  note,
  setNote,
  onClose,
}: {
  type: Exclude<EditType, null>;
  terms: string[];
  setTerms: React.Dispatch<React.SetStateAction<string[]>>;
  deliverables: string[];
  setDeliverables: React.Dispatch<React.SetStateAction<string[]>>;
  note: string;
  setNote: React.Dispatch<React.SetStateAction<string>>;
  onClose: () => void;
}) {
  const isNote = type === "note";

  const title =
    type === "terms"
      ? "Terms & Conditions"
      : type === "deliverables"
        ? "Deliverables"
        : "Note";

  const [items, setItems] = React.useState<string[]>(
    type === "terms" ? [...terms] : [...deliverables],
  );
  const [draftNote, setDraftNote] = React.useState(note);

  function save() {
    if (isNote) {
      setNote(draftNote.trim());
    } else if (type === "terms") {
      setTerms(items.map((item) => item.trim()).filter(Boolean));
    } else {
      setDeliverables(items.map((item) => item.trim()).filter(Boolean));
    }

    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--glass-border)] bg-[var(--primary-darkest)] p-5 shadow-2xl sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-3xl">{title}</h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--cream)]/50 hover:text-[var(--cream)]"
            aria-label="Close editor"
          >
            <X size={18} />
          </button>
        </div>

        {isNote ? (
          <textarea
            value={draftNote}
            onChange={(event) => setDraftNote(event.target.value)}
            rows={7}
            placeholder="Optional note to include in the quotation email..."
            className="mt-5 w-full resize-y rounded-xl border border-[var(--glass-border)] bg-black/20 p-4 text-sm outline-none focus:border-[var(--secondary)]"
          />
        ) : (
          <div className="mt-5 space-y-3">
            {items.map((item, index) => (
              <div key={index} className="flex gap-2">
                <textarea
                  value={item}
                  onChange={(event) =>
                    setItems((current) =>
                      current.map((value, itemIndex) =>
                        itemIndex === index ? event.target.value : value,
                      ),
                    )
                  }
                  rows={4}
                  className="min-w-0 flex-1 resize-y rounded-xl border border-[var(--glass-border)] bg-black/20 px-3 py-2 text-sm outline-none focus:border-[var(--secondary)]"
                />

                <button
                  type="button"
                  onClick={() =>
                    setItems((current) =>
                      current.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                  className="self-start rounded-lg p-2 text-[var(--cream)]/30 hover:text-red-300"
                  aria-label="Remove item"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setItems((current) => [...current, ""])}
              className="inline-flex items-center gap-1 text-xs text-[var(--secondary-light)] hover:underline"
            >
              <Plus size={14} />
              Add item
            </button>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--glass-border)] px-5 py-3 text-sm"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={save}
            className="rounded-xl bg-[var(--secondary)] px-5 py-3 text-sm font-semibold !text-[var(--primary-darkest)] hover:bg-[var(--secondary-light)]"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default function QuoteConfirmationPage() {
  const [events] = React.useState<EventItem[]>(INITIAL_EVENTS);
  const [openEvents, setOpenEvents] = React.useState<number[]>([]);
  const [price, setPrice] = React.useState("");
  const [editing, setEditing] = React.useState<EditType>(null);

  const [deliverables, setDeliverables] =
    React.useState<string[]>(DEFAULT_DELIVERABLES);
  const [terms, setTerms] = React.useState<string[]>(DEFAULT_TERMS);
  const [note, setNote] = React.useState("");

  const [sending, setSending] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState("");

  function toggleEvent(id: number) {
    setOpenEvents((current) =>
      current.includes(id)
        ? current.filter((eventId) => eventId !== id)
        : [...current, id],
    );
  }

  async function sendQuote() {
    setError("");
    setSent(false);

    const amount = Number(price);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter the final quotation amount before sending.");
      return;
    }

    const invalidEvent = events.find(
      (event) =>
        !event.label.trim() ||
        !event.date ||
        !event.venue.trim() ||
        !event.services.length,
    );

    if (invalidEvent) {
      setError(
        "Every event needs a name, date, venue, and at least one service.",
      );

      setOpenEvents((current) =>
        current.includes(invalidEvent.id)
          ? current
          : [...current, invalidEvent.id],
      );

      return;
    }

    setSending(true);

    try {
      const response = await fetch("/api/quote/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client: {
            name: "laxmi",
            phone: "9347991270",
            email: "crimsonsayss@gmail.com",
            budget: "3.5 lakhs - 5 lakhs",
          },
          events,
          price: amount,
          deliverables: deliverables.filter(Boolean),
          terms: terms.filter(Boolean),
          note: note.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to send quotation.");
      }

      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send quotation.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--primary-darkest)] px-4 py-8 text-[var(--cream)] sm:px-8 lg:py-10">
      <style jsx global>{`
        .field-input {
          width: 100%;
          min-height: 44px;
          border-radius: 12px;
          border: 1px solid var(--glass-border);
          background: rgba(0, 0, 0, 0.2);
          padding: 0 12px;
          color: var(--cream);
          font-size: 14px;
          outline: none;
        }

        .field-input:focus {
          border-color: var(--secondary);
        }
      `}</style>

      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <p className="font-brand text-3xl text-[var(--secondary-light)]">
            Roselanes by Jeev
          </p>

          <div className="mt-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--secondary)]">
              Quotation desk
            </p>

            <h1 className="mt-1 font-display text-4xl sm:text-5xl">
              Confirm quotation
            </h1>
          </div>
        </header>

        {/* ROW 1 — client details + price + send */}
        <section className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-5 shadow-2xl backdrop-blur-xl sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.72fr] lg:items-end">
            <div className="min-w-0">
              <SectionHeader
                eyebrow="01"
                title="Client details"
                subtitle="Submitted enquiry information"
              />

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Info label="Name" value="laxmi" />
                <Info label="Phone" value="9347991270" />
                <Info
                  label="Email"
                  value="laxmiyelimela@gmail.com"
                />
                <Info label="Budget" value="3.5 lakhs - 5 lakhs" />
              </div>
            </div>

            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
              <label className="block min-w-0">
                <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--secondary)]">
                  Final quotation
                </span>

                <input
                  type="number"
                  min="0"
                  step="1000"
                  inputMode="numeric"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  placeholder="₹ Enter amount"
                  className="field-input"
                />
              </label>

              <div className="flex min-w-0 flex-col">
                <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-transparent">
                  Send
                </span>

                <button
                  type="button"
                  onClick={sendQuote}
                  disabled={sending}
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--secondary)] px-4 py-2 text-sm font-semibold !text-[var(--primary-darkest)] transition-colors hover:bg-[var(--secondary-light)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send size={15} />
                  {sending ? "Sending..." : "Send quotation"}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          )}

          {sent && (
            <p className="mt-4 rounded-xl border border-[var(--secondary)]/30 bg-[var(--secondary)]/10 px-4 py-3 text-sm text-[var(--secondary-light)]">
              Quotation sent successfully.
            </p>
          )}
        </section>

        {/* ROW 2 — all events collapsed by default */}
        <section className="mt-6 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-5 shadow-2xl backdrop-blur-xl sm:p-6">
          <SectionHeader
            eyebrow="02"
            title="Event details"
            subtitle="Original requested coverage · Click any event to expand its details"
          />

          <div className="mt-5 space-y-3">
            {events.map((event) => {
              const isOpen = openEvents.includes(event.id);

              return (
                <div
                  key={event.id}
                  className="overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-black/10"
                >
                  <button
                    type="button"
                    onClick={() => toggleEvent(event.id)}
                    className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-white/[0.025]"
                    aria-expanded={isOpen}
                  >
                    <div className="min-w-0">
                      <p className="font-display text-xl text-[var(--secondary-light)]">
                        {event.label}
                      </p>

                      <p className="mt-1 truncate text-xs text-[var(--cream)]/45">
                        {formatDate(event.date)} · {event.venue}
                      </p>
                    </div>

                    <ChevronDown
                      size={18}
                      className={`shrink-0 text-[var(--secondary)] transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="border-t border-[var(--glass-border)] px-4 pb-4 pt-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Info label="Date" value={formatDate(event.date)} />
                        <Info label="Venue" value={event.venue} />
                      </div>

                      <div className="mt-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[var(--cream)]/45">
                          Selected services
                        </p>

                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          {event.services.map((service) => (
                            <div
                              key={`${event.id}-${service.name}`}
                              className="flex items-center justify-between rounded-xl border border-[var(--glass-border)] px-3 py-2.5"
                            >
                              <span className="text-sm text-[var(--cream)]/75">
                                {service.name}
                              </span>

                              <span className="text-xs font-semibold text-[var(--secondary)]">
                                × {service.qty}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ROW 3 — deliberately outside the Event details section */}
        {/* Deliverables must never be nested inside an event toggle. */}
        <section className="mt-6 grid gap-6">
          <DeliverablesCard
            items={deliverables}
            onEdit={() => setEditing("deliverables")}
          />

          <TermsCard
            items={terms}
            onEdit={() => setEditing("terms")}
          />

          <NoteCard
            note={note}
            onEdit={() => setEditing("note")}
          />
        </section>
      </div>

      {editing && (
        <EditorModal
          type={editing}
          terms={terms}
          setTerms={setTerms}
          deliverables={deliverables}
          setDeliverables={setDeliverables}
          note={note}
          setNote={setNote}
          onClose={() => setEditing(null)}
        />
      )}
    </main>
  );
}
