"use client";

import * as React from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { TestimonialDTO } from "@/lib/testimonials";
import { Spinner } from "./spinner";

const NAME_MAX = 60;
const REVIEW_MAX = 320;

const inputCls =
  "w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-neutral-400";
const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-neutral-200 disabled:opacity-60";
const btnGhost =
  "rounded-md border border-neutral-700 px-4 py-2 text-sm text-neutral-300 transition-colors hover:border-neutral-500 disabled:opacity-50";

export function TestimonialsManager({ initial }: { initial: TestimonialDTO[] }) {
  const [items, setItems] = React.useState(initial);
  const [editing, setEditing] = React.useState<TestimonialDTO | "new" | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [savingOrder, setSavingOrder] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = items.findIndex((i) => i.id === active.id);
    const to = items.findIndex((i) => i.id === over.id);
    if (from < 0 || to < 0) return;

    const prev = items;
    const next = arrayMove(items, from, to);
    setItems(next);
    setError(null);
    setSavingOrder(true);

    try {
      const res = await fetch("/api/dashboard/testimonials/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: next.map((i) => i.id) }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Request failed");
    } catch (e) {
      setItems(prev);
      setError(e instanceof Error ? e.message : "Could not save the new order");
    } finally {
      setSavingOrder(false);
    }
  }

  async function handleDelete(t: TestimonialDTO) {
    if (!window.confirm(`Delete the testimonial from ${t.name}? This can't be undone.`)) return;
    setError(null);
    setDeletingId(t.id);
    try {
      const res = await fetch(`/api/dashboard/testimonials/${t.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setItems((prev) => prev.filter((i) => i.id !== t.id));
    } catch {
      setError("Could not delete that testimonial. Try again.");
    } finally {
      setDeletingId(null);
    }
  }

  function handleSaved(saved: TestimonialDTO) {
    setItems((prev) =>
      prev.some((i) => i.id === saved.id)
        ? prev.map((i) => (i.id === saved.id ? saved : i))
        : [...prev, saved]
    );
    setEditing(null);
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm text-neutral-500">
          Drag a card by its number to change the order on the website.
          {savingOrder && (
            <span className="inline-flex items-center gap-1.5 text-neutral-300">
              <Spinner className="h-3.5 w-3.5" /> Saving order
            </span>
          )}
        </p>
        <button className={btnPrimary} onClick={() => setEditing("new")}>
          Add testimonial
        </button>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-md border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-800 p-10 text-center">
          <p className="text-sm text-neutral-300">No testimonials yet.</p>
          <p className="mt-1 text-xs text-neutral-500">Add the first one to show it on the website.</p>
        </div>
      ) : (
        <DndContext
          id="testimonials-sort"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
              {items.map((t, index) => (
                <SortableCard
                  key={t.id}
                  item={t}
                  index={index}
                  deleting={deletingId === t.id}
                  onEdit={() => setEditing(t)}
                  onDelete={() => handleDelete(t)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {editing && (
        <TestimonialForm
          key={editing === "new" ? "new" : editing.id}
          item={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span aria-label={`${value} out of 5 stars`} className="shrink-0 text-xs tracking-wider text-neutral-100">
      {"★".repeat(value)}
      <span className="text-neutral-700">{"★".repeat(5 - value)}</span>
    </span>
  );
}

function SortableCard({
  item,
  index,
  deleting,
  onEdit,
  onDelete,
}: {
  item: TestimonialDTO;
  index: number;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : undefined }}
      className={`relative overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900 ${
        isDragging ? "opacity-70 shadow-xl" : ""
      }`}
    >
      <div className="relative aspect-[4/5] bg-neutral-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" draggable={false} />
        <button
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${item.name}, currently position ${index + 1}`}
          className="absolute left-2 top-2 flex h-7 min-w-7 cursor-grab touch-none items-center justify-center rounded-md bg-black/70 px-2 text-xs font-medium text-white active:cursor-grabbing"
        >
          {index + 1}
        </button>
      </div>

      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium text-neutral-100">{item.name}</p>
          <Stars value={item.rating} />
        </div>
        <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-neutral-500">{item.review}</p>
        <div className="mt-3 flex gap-4 text-xs">
          <button onClick={onEdit} disabled={deleting} className="text-neutral-300 hover:text-white disabled:opacity-50">
            Edit
          </button>
          <button onClick={onDelete} disabled={deleting} className="text-red-400 hover:text-red-300 disabled:opacity-50">
            Delete
          </button>
        </div>
      </div>

      {deleting && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-black/70">
          <span className="inline-flex items-center gap-2 text-sm text-neutral-200">
            <Spinner /> Deleting
          </span>
        </div>
      )}
    </div>
  );
}

/** Downscale before upload so phone photos stay small (the server does the final crop + WebP). */
async function shrink(file: File, max = 1600): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not read that image"))), "image/jpeg", 0.92)
  );
}

function TestimonialForm({
  item,
  onClose,
  onSaved,
}: {
  item: TestimonialDTO | null;
  onClose: () => void;
  onSaved: (t: TestimonialDTO) => void;
}) {
  const [name, setName] = React.useState(item?.name ?? "");
  const [rating, setRating] = React.useState(item?.rating ?? 5);
  const [review, setReview] = React.useState(item?.review ?? "");
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(item?.imageUrl ?? null);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !saving && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  async function submit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (saving) return;
    setError(null);

    if (!item && !file) return setError("Choose an image");
    if (!name.trim()) return setError("Enter a name");
    if (!review.trim()) return setError("Enter a review");

    setSaving(true);
    try {
      const body = new FormData();
      body.set("name", name.trim());
      body.set("rating", String(rating));
      body.set("review", review.trim());
      if (file) body.set("image", await shrink(file), "photo.jpg");

      const res = await fetch(
        item ? `/api/dashboard/testimonials/${item.id}` : "/api/dashboard/testimonials",
        { method: item ? "PATCH" : "POST", body }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Something went wrong");
      onSaved(data as TestimonialDTO);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}
    >
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-label={item ? "Edit testimonial" : "Add testimonial"}
        className="max-h-[92vh] w-full max-w-[560px] overflow-y-auto rounded-xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl"
      >
        <h2 className="mb-5 text-base font-semibold text-neutral-100">
          {item ? "Edit testimonial" : "Add testimonial"}
        </h2>

        <div className="grid gap-5 sm:grid-cols-[160px_1fr]">
          <div>
            <div className="relative aspect-[4/5] overflow-hidden rounded-md border border-neutral-800 bg-neutral-900">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="absolute inset-0 grid place-items-center px-3 text-center text-xs text-neutral-600">
                  No image yet
                </span>
              )}
            </div>
            <label className="mt-2 block cursor-pointer rounded-md border border-neutral-700 px-3 py-1.5 text-center text-xs text-neutral-300 hover:border-neutral-500">
              {preview ? "Replace image" : "Choose image"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={saving}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <p className="mt-1.5 text-[11px] leading-snug text-neutral-600">
              Cropped to 4:5 and saved as WebP automatically.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="t-name" className="mb-1 block text-xs text-neutral-400">
                Name
              </label>
              <input
                id="t-name"
                className={inputCls}
                value={name}
                maxLength={NAME_MAX}
                disabled={saving}
                onChange={(e) => setName(e.target.value)}
                placeholder="Aisha & Rohan"
              />
            </div>

            <div>
              <span className="mb-1 block text-xs text-neutral-400">Rating</span>
              <div className="flex gap-1" role="radiogroup" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={rating === n}
                    aria-label={`${n} star${n > 1 ? "s" : ""}`}
                    disabled={saving}
                    onClick={() => setRating(n)}
                    className={`text-2xl leading-none transition-all ${
  n <= rating
    ? "!text-white"
    : "!text-neutral-600 hover:!text-neutral-300"
}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="t-review" className="mb-1 block text-xs text-neutral-400">
                Review
              </label>
              <textarea
                id="t-review"
                className={`${inputCls} min-h-[120px] resize-y`}
                value={review}
                maxLength={REVIEW_MAX}
                disabled={saving}
                onChange={(e) => setReview(e.target.value)}
              />
              <p className="mt-1 text-right text-[11px] text-neutral-600">
                {review.length}/{REVIEW_MAX}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-md border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className={btnGhost} onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className={btnPrimary} disabled={saving}>
            {saving && <Spinner />}
            {saving ? "Saving" : item ? "Save changes" : "Add testimonial"}
          </button>
        </div>
      </form>
    </div>
  );
}