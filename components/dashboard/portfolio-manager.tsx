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
import type { PortfolioDTO } from "@/lib/portfolio-dto";
import { Spinner } from "./spinner";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 60 * 1024 * 1024;
const ALT_MAX = 80;
const SUGGESTED_CAPTIONS = ["Bride portrait", "Couple photography", "Wedding reception", "Wedding photography"];

const inputCls =
  "w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-neutral-400 disabled:opacity-60";
const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-neutral-200 disabled:opacity-60";
const btnGhost =
  "rounded-md border border-neutral-700 px-4 py-2 text-sm text-neutral-300 transition-colors hover:border-neutral-500 disabled:opacity-50";

/* ---------------------------------- helpers --------------------------------- */

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error ?? "Something went wrong");
  return data as T;
}

const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

/** Original goes browser -> R2 directly (presigned), so file size isn't limited by the server. */
async function uploadOriginal(file: File) {
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error("Only JPG, PNG or WebP files are supported");
  if (file.size > MAX_BYTES) throw new Error("File is larger than 60 MB");

  const { assetId, originalKey, uploadUrl } = await api<{
    assetId: string;
    originalKey: string;
    uploadUrl: string;
  }>("/api/dashboard/portfolio/upload-url", json("POST", { contentType: file.type }));

  let res: Response;
  try {
    res = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
  } catch {
    throw new Error("Could not reach storage. Check the R2 CORS rule for this site.");
  }
  if (!res.ok) throw new Error(`Storage rejected the upload (${res.status})`);

  return { assetId, originalKey };
}

const formatSize = (bytes: number) =>
  bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;

/* --------------------------------- manager ---------------------------------- */

export function PortfolioManager({ initial }: { initial: PortfolioDTO[] }) {
  const [items, setItems] = React.useState(initial);
  const [adding, setAdding] = React.useState(false);
  const [editing, setEditing] = React.useState<PortfolioDTO | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [savingOrder, setSavingOrder] = React.useState(false);
  const [savedOrder, setSavedOrder] = React.useState(() => initial.map((i) => i.id));
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const captions = React.useMemo(
    () => Array.from(new Set([...SUGGESTED_CAPTIONS, ...items.map((i) => i.alt)])),
    [items]
  );

  const orderDirty = React.useMemo(
    () => items.map((i) => i.id).join("|") !== savedOrder.join("|"),
    [items, savedOrder]
  );

  React.useEffect(() => {
    if (!orderDirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [orderDirty]);

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = items.findIndex((i) => i.id === active.id);
    const to = items.findIndex((i) => i.id === over.id);
    if (from < 0 || to < 0) return;

    setItems(arrayMove(items, from, to));
    setError(null);
  }

  async function saveOrder() {
    if (!orderDirty || savingOrder) return;
    setError(null);
    setSavingOrder(true);
    try {
      await api("/api/dashboard/portfolio/reorder", json("PUT", { ids: items.map((i) => i.id) }));
      setSavedOrder(items.map((i) => i.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the new order");
    } finally {
      setSavingOrder(false);
    }
  }

  async function handleDelete(item: PortfolioDTO) {
    if (!window.confirm(`Delete "${item.alt}"? The photo and its original are removed permanently.`)) return;
    setError(null);
    setDeletingId(item.id);
    try {
      await api(`/api/dashboard/portfolio/${item.id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch {
      setError("Could not delete that photo. Try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm text-neutral-500">
          {items.length} photo{items.length === 1 ? "" : "s"}. Drag by the number to reorder.
          {orderDirty && <span className="text-amber-400">Unsaved order</span>}
          {savingOrder && (
            <span className="inline-flex items-center gap-1.5 text-neutral-300">
              <Spinner className="h-3.5 w-3.5" /> Saving order
            </span>
          )}
        </p>
        <div className="flex gap-2">
          {orderDirty && (
            <button className={btnPrimary} onClick={() => void saveOrder()} disabled={savingOrder}>
              {savingOrder && <Spinner />}
              {savingOrder ? "Saving" : "Save order"}
            </button>
          )}
          <button className={btnPrimary} onClick={() => setAdding(true)}>
            Add photos
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-md border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-800 p-10 text-center">
          <p className="text-sm text-neutral-300">No photos yet.</p>
          <p className="mt-1 text-xs text-neutral-500">Add photos to build the gallery on the website.</p>
        </div>
      ) : (
        <DndContext id="portfolio-sort" sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
              {items.map((item, index) => (
                <SortableCard
                  key={item.id}
                  item={item}
                  index={index}
                  deleting={deletingId === item.id}
                  onEdit={() => setEditing(item)}
                  onDelete={() => handleDelete(item)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {adding && (
        <AddPhotosModal
          captions={captions}
          onClose={() => setAdding(false)}
          onAdded={(created) => setItems((prev) => [...prev, created])}
        />
      )}

      {editing && (
        <EditPhotoModal
          key={editing.id}
          item={editing}
          captions={captions}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setItems((prev) => prev.map((i) => (i.id === saved.id ? saved : i)));
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

function SortableCard({
  item,
  index,
  deleting,
  onEdit,
  onDelete,
}: {
  item: PortfolioDTO;
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
      <div className="relative aspect-[4/5] bg-neutral-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.thumbUrl} alt={item.alt} loading="lazy" className="h-full w-full object-contain" draggable={false} />
        <button
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${item.alt}, currently position ${index + 1}`}
          className="absolute left-2 top-2 flex h-7 min-w-7 cursor-grab touch-none items-center justify-center rounded-md bg-black/70 px-2 text-xs font-medium text-white active:cursor-grabbing"
        >
          {index + 1}
        </button>
      </div>
      <div className="p-2.5">
        <p className="truncate text-xs text-neutral-300">{item.alt}</p>
        <div className="mt-2 flex gap-3 text-xs">
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
          <span className="inline-flex items-center gap-2 text-xs text-neutral-200">
            <Spinner /> Deleting
          </span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ add (bulk) modal ----------------------------- */

type QueueItem = {
  key: string;
  file: File;
  status: "queued" | "uploading" | "done" | "error";
  error?: string;
};

function Shell({
  title,
  onClose,
  busy,
  children,
}: {
  title: string;
  onClose: () => void;
  busy: boolean;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, busy]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[92vh] w-full max-w-[520px] overflow-y-auto rounded-xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl"
      >
        <h2 className="mb-5 text-base font-semibold text-neutral-100">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function AddPhotosModal({
  captions,
  onClose,
  onAdded,
}: {
  captions: string[];
  onClose: () => void;
  onAdded: (created: PortfolioDTO) => void;
}) {
  const [alt, setAlt] = React.useState("");
  const [queue, setQueue] = React.useState<QueueItem[]>([]);
  const [running, setRunning] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const pending = queue.filter((q) => q.status === "queued" || q.status === "error");
  const doneCount = queue.filter((q) => q.status === "done").length;

  function addFiles(files: FileList | null) {
    if (!files) return;
    const next: QueueItem[] = Array.from(files).map((file) => ({
      key: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
      file,
      status: "queued",
    }));
    setQueue((prev) => [...prev, ...next]);
  }

  const patch = (key: string, p: Partial<QueueItem>) =>
    setQueue((prev) => prev.map((q) => (q.key === key ? { ...q, ...p } : q)));

  async function start() {
    const caption = alt.trim();
    if (!caption) return setFormError("Enter a caption for these photos");
    if (caption.length > ALT_MAX) return setFormError(`Caption must be ${ALT_MAX} characters or fewer`);
    if (pending.length === 0) return;

    setFormError(null);
    setRunning(true);

    // One at a time keeps positions in upload order and memory use low on the server.
    for (const item of pending) {
      patch(item.key, { status: "uploading", error: undefined });
      try {
        const { assetId, originalKey } = await uploadOriginal(item.file);
        const created = await api<PortfolioDTO>(
          "/api/dashboard/portfolio",
          json("POST", { assetId, originalKey, alt: caption })
        );
        onAdded(created);
        patch(item.key, { status: "done" });
      } catch (e) {
        patch(item.key, { status: "error", error: e instanceof Error ? e.message : "Upload failed" });
      }
    }
    setRunning(false);
  }

  return (
    <Shell title="Add photos" onClose={onClose} busy={running}>
      <div className="space-y-4">
        <div>
          <label htmlFor="p-alt" className="mb-1 block text-xs text-neutral-400">
            Caption (applies to every photo in this batch)
          </label>
          <input
            id="p-alt"
            list="p-captions"
            className={inputCls}
            value={alt}
            maxLength={ALT_MAX}
            disabled={running}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="Bride portrait"
          />
          <datalist id="p-captions">
            {captions.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block cursor-pointer rounded-md border border-dashed border-neutral-700 px-4 py-6 text-center text-sm text-neutral-300 hover:border-neutral-500">
            Choose photos
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={running}
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <span className="mt-1 block text-xs text-neutral-600">
              JPG, PNG or WebP, up to 60 MB each. Originals are kept for downloads.
            </span>
          </label>
        </div>

        {queue.length > 0 && (
          <ul className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-neutral-800 p-2">
            {queue.map((q) => (
              <li key={q.key} className="flex items-center gap-2 text-xs">
                <span className="w-4 shrink-0 text-center">
                  {q.status === "uploading" && <Spinner className="h-3.5 w-3.5 text-neutral-200" />}
                  {q.status === "done" && <span className="text-emerald-400">✓</span>}
                  {q.status === "error" && <span className="text-red-400">!</span>}
                </span>
                <span className="min-w-0 flex-1 truncate text-neutral-300">{q.file.name}</span>
                <span className="shrink-0 text-neutral-600">{formatSize(q.file.size)}</span>
                {q.status === "queued" && !running && (
                  <button
                    onClick={() => setQueue((prev) => prev.filter((x) => x.key !== q.key))}
                    className="shrink-0 text-neutral-500 hover:text-neutral-200"
                    aria-label={`Remove ${q.file.name}`}
                  >
                    ✕
                  </button>
                )}
                {q.status === "error" && <span className="shrink-0 text-red-400">{q.error}</span>}
              </li>
            ))}
          </ul>
        )}

        {formError && (
          <p role="alert" className="rounded-md border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
            {formError}
          </p>
        )}

        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-xs text-neutral-500">
            {running ? "Optimising and uploading…" : doneCount > 0 ? `${doneCount} added` : ""}
          </span>
          <div className="flex gap-2">
            <button className={btnGhost} onClick={onClose} disabled={running}>
              {doneCount > 0 && pending.length === 0 ? "Done" : "Cancel"}
            </button>
            <button className={btnPrimary} onClick={start} disabled={running || pending.length === 0}>
              {running && <Spinner />}
              {running
                ? "Uploading"
                : queue.some((q) => q.status === "error")
                  ? "Retry failed"
                  : `Upload ${pending.length || ""} photo${pending.length === 1 ? "" : "s"}`.replace("  ", " ")}
            </button>
          </div>
        </div>
      </div>
    </Shell>
  );
}

/* -------------------------------- edit modal --------------------------------- */

function EditPhotoModal({
  item,
  captions,
  onClose,
  onSaved,
}: {
  item: PortfolioDTO;
  captions: string[];
  onClose: () => void;
  onSaved: (saved: PortfolioDTO) => void;
}) {
  const [alt, setAlt] = React.useState(item.alt);
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState(item.thumbUrl);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function save() {
    const caption = alt.trim();
    if (!caption) return setError("Enter a caption");
    setError(null);
    setSaving(true);
    try {
      const replace = file ? await uploadOriginal(file) : undefined;
      const saved = await api<PortfolioDTO>(`/api/dashboard/portfolio/${item.id}`, json("PATCH", { alt: caption, replace }));
      onSaved(saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setSaving(false);
    }
  }

  return (
    <Shell title="Edit photo" onClose={onClose} busy={saving}>
      <div className="grid gap-5 sm:grid-cols-[150px_1fr]">
        <div>
          <div className="aspect-[4/5] overflow-hidden rounded-md border border-neutral-800 bg-neutral-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="" className="h-full w-full object-contain" />
          </div>
          <label className="mt-2 block cursor-pointer rounded-md border border-neutral-700 px-3 py-1.5 text-center text-xs text-neutral-300 hover:border-neutral-500">
            Replace photo
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={saving}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <a
            href={item.downloadUrl}
            className="mt-2 block text-center text-xs text-neutral-500 underline-offset-2 hover:text-neutral-200 hover:underline"
          >
            Download original
          </a>
        </div>

        <div>
          <label htmlFor="e-alt" className="mb-1 block text-xs text-neutral-400">
            Caption
          </label>
          <input
            id="e-alt"
            list="e-captions"
            className={inputCls}
            value={alt}
            maxLength={ALT_MAX}
            disabled={saving}
            onChange={(e) => setAlt(e.target.value)}
          />
          <datalist id="e-captions">
            {captions.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <p className="mt-2 text-[11px] leading-snug text-neutral-600">
            Shown on hover and used as the image description. Thumbnail and display versions are generated
            automatically as WebP.
          </p>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-md border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="mt-6 flex justify-end gap-2">
        <button className={btnGhost} onClick={onClose} disabled={saving}>
          Cancel
        </button>
        <button className={btnPrimary} onClick={save} disabled={saving}>
          {saving && <Spinner />}
          {saving ? (file ? "Uploading" : "Saving") : "Save changes"}
        </button>
      </div>
    </Shell>
  );
}