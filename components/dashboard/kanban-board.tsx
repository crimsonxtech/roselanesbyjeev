"use client";

import * as React from "react";
import {
  DndContext,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { Prisma, QuoteStatus } from "@/generated/prisma/client";
import { STATUS_COLUMNS, isEmailPending } from "@/lib/quote-status";
import { QuoteDetailModal } from "./quote-detail-modal";

export type QuoteWithRelations = Prisma.QuoteGetPayload<{
  include: { events: { include: { services: true } }; addOns: true };
}>;

const glass =
  "border border-[var(--glass-border)] bg-[var(--glass-bg)] shadow-[0_8px_24px_rgba(0,0,0,.22)]";

export function KanbanBoard({ quotes: initialQuotes }: { quotes: QuoteWithRelations[] }) {
  const [quotes, setQuotes] = React.useState(initialQuotes);
  const [selected, setSelected] = React.useState<QuoteWithRelations | null>(null);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const byStatus = React.useMemo(() => {
    const map = new Map<string, QuoteWithRelations[]>();
    for (const col of STATUS_COLUMNS) map.set(col.status, []);
    for (const q of quotes) map.get(q.status)?.push(q);
    return map;
  }, [quotes]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const quoteId = active.id as string;
    const newStatus = over.id as QuoteStatus;
    const quote = quotes.find((q) => q.id === quoteId);
    if (!quote || quote.status === newStatus) return;

    const prevStatus = quote.status;

    setQuotes((prev) =>
      prev.map((q) => (q.id === quoteId ? { ...q, status: newStatus } : q))
    );
    setPendingId(quoteId);

    try {
      const res = await fetch(`/api/dashboard/quotes/${quoteId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Request failed");
    } catch {
      setQuotes((prev) =>
        prev.map((q) => (q.id === quoteId ? { ...q, status: prevStatus } : q))
      );
    } finally {
      setPendingId(null);
    }
  }

  function handleQuoteUpdated(updated: QuoteWithRelations) {
    setQuotes((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
    setSelected(updated);
  }

  function handleQuoteDeleted(quoteId: string) {
    setQuotes((prev) => prev.filter((q) => q.id !== quoteId));
    setSelected(null);
  }

  return (
    <>
      <DndContext id="quotes-kanban" sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUS_COLUMNS.map((col) => (
            <Column
              key={col.status}
              status={col.status}
              label={col.label}
              items={byStatus.get(col.status) ?? []}
              pendingId={pendingId}
              onCardClick={setSelected}
            />
          ))}
        </div>
      </DndContext>

      {selected && (
        <QuoteDetailModal
          quote={selected}
          onClose={() => setSelected(null)}
          onQuoteUpdated={handleQuoteUpdated}
          onQuoteDeleted={handleQuoteDeleted}
        />
      )}
    </>
  );
}

function Column({
  status,
  label,
  items,
  pendingId,
  onCardClick,
}: {
  status: string;
  label: string;
  items: QuoteWithRelations[];
  pendingId: string | null;
  onCardClick: (q: QuoteWithRelations) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="w-[280px] shrink-0">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-[.72rem] font-semibold text-[var(--cream)]/70">
          {label}
        </span>
        <span className="text-[.68rem] text-[var(--cream)]/40">{items.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2 rounded-[12px] p-2 min-h-[120px] transition-colors ${glass} ${
          isOver ? "border-[var(--secondary)]/60 bg-[var(--secondary)]/[0.06]" : ""
        }`}
      >
        {items.length === 0 ? (
          <p className="px-1 py-4 text-center text-[.72rem] text-[var(--cream)]/30">
            Drop here
          </p>
        ) : (
          items.map((q) => (
            <QuoteCard
              key={q.id}
              quote={q}
              isPending={pendingId === q.id}
              onClick={() => onCardClick(q)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function QuoteCard({
  quote,
  isPending,
  onClick,
}: {
  quote: QuoteWithRelations;
  isPending: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: quote.id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 }
    : undefined;

  const pendingEmail = isEmailPending(quote);
  const deliveredCount = quote.events.filter((e) => e.productionStage === "DELIVERED").length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      role="button"
      tabIndex={0}
      onClick={onClick}
      className={`cursor-grab rounded-[8px] border border-[var(--cream)]/[0.08] bg-[var(--cream)]/[0.03] p-3 text-left transition-colors hover:border-[var(--secondary)]/50 active:cursor-grabbing ${
        isDragging ? "opacity-50" : ""
      } ${isPending ? "opacity-60" : ""}`}
    >
      <p className="truncate text-[.86rem] font-medium text-[var(--cream)]">{quote.name}</p>
      <p className="mt-0.5 truncate text-[.72rem] text-[var(--cream)]/50">
        {quote.events.map((e) => e.label).join(", ")}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {pendingEmail && (
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[.62rem] font-medium text-amber-300">
            ⚠ Email not sent
          </span>
        )}
        {quote.status === "IN_PROGRESS" && (
          <span className="rounded-full bg-[var(--secondary)]/15 px-2 py-0.5 text-[.62rem] font-medium text-[var(--secondary-light)]">
            {deliveredCount}/{quote.events.length} delivered
          </span>
        )}
      </div>
    </div>
  );
}