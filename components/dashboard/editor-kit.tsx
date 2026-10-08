"use client";

import * as React from "react";
import type { SectionKey, SiteImage } from "@/lib/site-content";
import { Spinner } from "./spinner";

export const inputCls =
  "w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-neutral-400 disabled:opacity-60";
export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-neutral-200 disabled:opacity-60";
export const btnGhost =
  "rounded-md border border-neutral-700 px-4 py-2 text-sm text-neutral-300 transition-colors hover:border-neutral-500 disabled:opacity-50";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 60 * 1024 * 1024;

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

/* ------------------------------ editor state ------------------------------ */

export function useSectionEditor<T extends object>(section: SectionKey, initial: T) {
  const [value, setValue] = React.useState<T>(initial);
  const [saved, setSaved] = React.useState<T>(initial);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [justSaved, setJustSaved] = React.useState(false);

  const dirty = React.useMemo(() => JSON.stringify(value) !== JSON.stringify(saved), [value, saved]);

  React.useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  React.useEffect(() => {
    if (!justSaved) return;
    const t = window.setTimeout(() => setJustSaved(false), 3000);
    return () => window.clearTimeout(t);
  }, [justSaved]);

  const update = React.useCallback((patch: Partial<T>) => {
    setValue((v) => ({ ...v, ...patch }));
    setJustSaved(false);
  }, []);

  const trackUpload = React.useCallback((delta: number) => setUploading((n) => n + delta), []);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await api<{ data: T }>(`/api/dashboard/site/${section}`, json("PUT", value));
      setSaved(res.data);
      setValue(res.data);
      setJustSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  function discard() {
    setValue(saved);
    setError(null);
  }

  return { value, update, dirty, saving, uploading, error, justSaved, save, discard, trackUpload };
}

/* --------------------------------- layout --------------------------------- */

export function EditorShell({
  description,
  viewHref,
  ed,
  children,
}: {
  description: string;
  viewHref: string;
  ed: Pick<
    ReturnType<typeof useSectionEditor>,
    "dirty" | "saving" | "uploading" | "error" | "justSaved" | "save" | "discard"
  >;
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-neutral-500">{description}</p>
        <a
          href={viewHref}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-neutral-400 underline-offset-2 hover:text-white hover:underline"
        >
          View on site ↗
        </a>
      </div>

      <div className="space-y-6">{children}</div>

      <div className="sticky bottom-4 z-20 mt-8 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-800 bg-neutral-950/95 px-4 py-3 backdrop-blur">
        <p role="status" className="min-h-5 text-sm">
          {ed.error ? (
            <span role="alert" className="text-red-400">
              {ed.error}
            </span>
          ) : ed.uploading > 0 ? (
            <span className="inline-flex items-center gap-2 text-neutral-300">
              <Spinner className="h-3.5 w-3.5" /> Uploading photo
            </span>
          ) : ed.justSaved ? (
            <span className="text-emerald-400">Saved. The website is updated.</span>
          ) : ed.dirty ? (
            <span className="text-neutral-400">Unsaved changes</span>
          ) : (
            <span className="text-neutral-600">No changes</span>
          )}
        </p>
        <div className="flex gap-2">
          <button className={btnGhost} onClick={ed.discard} disabled={!ed.dirty || ed.saving}>
            Discard
          </button>
          <button className={btnPrimary} onClick={ed.save} disabled={!ed.dirty || ed.saving || ed.uploading > 0}>
            {ed.saving && <Spinner />}
            {ed.saving ? "Saving" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Card({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-neutral-800 p-5">
      <h2 className="text-sm font-medium text-neutral-100">{title}</h2>
      {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

/* --------------------------------- fields --------------------------------- */

export function TextField({
  label,
  value,
  onChange,
  max,
  hint,
  multiline,
  rows = 5,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  max: number;
  hint?: string;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "url";
}) {
  const id = React.useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs text-neutral-400">
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          rows={rows}
          className={`${inputCls} resize-y leading-relaxed`}
          value={value}
          maxLength={max}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          id={id}
          type={type}
          className={inputCls}
          value={value}
          maxLength={max}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      <div className="mt-1 flex justify-between gap-3 text-[11px] text-neutral-600">
        <span>{hint}</span>
        {(multiline || max <= 80) && (
          <span className="shrink-0">
            {value.length}/{max}
          </span>
        )}
      </div>
    </div>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  max = 99999,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  max?: number;
}) {
  const id = React.useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs text-neutral-400">
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        max={max}
        className={inputCls}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Math.max(0, Math.min(max, Math.floor(Number(e.target.value) || 0))))}
      />
    </div>
  );
}

/* ------------------------------- image upload ------------------------------ */

async function uploadSiteImage(file: File, preset: "hero" | "about") {
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error("Only JPG, PNG or WebP files are supported");
  if (file.size > MAX_BYTES) throw new Error("File is larger than 60 MB");

  // Original goes browser -> R2 directly (presigned), so file size isn't limited by the server.
  const { assetId, originalKey, uploadUrl } = await api<{
    assetId: string;
    originalKey: string;
    uploadUrl: string;
  }>("/api/dashboard/site/upload-url", json("POST", { contentType: file.type }));

  let res: Response;
  try {
    res = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
  } catch {
    throw new Error("Could not reach storage. Check the R2 CORS rule for this site.");
  }
  if (!res.ok) throw new Error(`Storage rejected the upload (${res.status})`);

  return api<Pick<SiteImage, "key" | "url" | "width" | "height">>(
    "/api/dashboard/site/image",
    json("POST", { assetId, originalKey, preset }),
  );
}

export function ImageField({
  label,
  hint,
  image,
  onChange,
  onBusy,
  preset,
  frameClass,
}: {
  label: string;
  hint?: string;
  image: SiteImage;
  onChange: (next: SiteImage) => void;
  onBusy: (delta: number) => void;
  preset: "hero" | "about";
  frameClass: string;
}) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const altId = React.useId();

  async function pick(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(true);
    onBusy(1);
    try {
      const uploaded = await uploadSiteImage(file, preset);
      onChange({ ...image, ...uploaded });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      onBusy(-1);
    }
  }

  return (
    <div className="flex gap-4">
      <div className="w-28 shrink-0">
        <div className={`relative overflow-hidden rounded-md border border-neutral-800 bg-neutral-900 ${frameClass}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.url} alt="" className="h-full w-full object-contain" />
          {busy && (
            <div className="absolute inset-0 grid place-items-center bg-black/70">
              <Spinner className="h-5 w-5 text-neutral-100" />
            </div>
          )}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs text-neutral-400">{label}</p>
        {hint && <p className="mt-0.5 text-[11px] text-neutral-600">{hint}</p>}

        <label className="mt-2 inline-block cursor-pointer rounded-md border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:border-neutral-500">
          {busy ? "Uploading…" : "Replace photo"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={busy}
            onChange={(e) => {
              void pick(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>

        <label htmlFor={altId} className="mt-3 mb-1 block text-xs text-neutral-400">
          Description (for accessibility and search)
        </label>
        <input
          id={altId}
          className={inputCls}
          value={image.alt}
          maxLength={120}
          onChange={(e) => onChange({ ...image, alt: e.target.value })}
        />

        {error && (
          <p role="alert" className="mt-2 text-xs text-red-400">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
