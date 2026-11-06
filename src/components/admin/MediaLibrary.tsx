"use client";

import { useRef, useState } from "react";
import type { CrudLabels } from "@/components/admin/ResourceCrud";

export type MediaItem = {
  id: string;
  path: string;
  filename: string;
  alt: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
  mimeType: string;
};

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = (await res.json().catch(() => ({}))) as { data?: T; error?: string };
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data.data as T;
}

export function MediaLibrary({
  initial,
  labels,
}: {
  initial: MediaItem[];
  labels: CrudLabels;
}) {
  const [items, setItems] = useState<MediaItem[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ alt: string; caption: string }>({ alt: "", caption: "" });
  const fileRef = useRef<HTMLInputElement>(null);

  async function onUpload(files: FileList) {
    setBusy(true);
    setError(null);
    try {
      const uploaded: MediaItem[] = [];
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.append("file", file);
        const media = await apiJson<MediaItem>("/api/admin/media", { method: "POST", body });
        uploaded.push(media);
      }
      setItems((prev) => [...uploaded, ...prev]);
    } catch (e) {
      setError(e instanceof Error ? e.message : labels.error);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function startEdit(item: MediaItem) {
    setEditing(item.id);
    setDraft({ alt: item.alt ?? "", caption: item.caption ?? "" });
  }

  async function saveEdit(id: string) {
    try {
      const media = await apiJson<MediaItem>("/api/admin/media", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, alt: draft.alt, caption: draft.caption }),
      });
      setItems((prev) => prev.map((m) => (m.id === id ? { ...m, ...media } : m)));
      setEditing(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : labels.error);
    }
  }

  async function remove(id: string) {
    if (!window.confirm(labels.deleteConfirm)) return;
    try {
      await apiJson(`/api/admin/media?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      setItems((prev) => prev.filter((m) => m.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : labels.error);
    }
  }

  const INPUT =
    "mt-1 h-9 w-full rounded-full border border-ivory/15 bg-carbon px-3 text-xs text-ivory outline-none focus:border-sand";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-ivory/10 bg-ivory/[0.03] p-4">
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) void onUpload(e.target.files);
          }}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="h-10 rounded-full bg-sand px-5 text-sm font-medium text-obsidian transition-colors hover:bg-sand-bright disabled:opacity-50"
        >
          {busy ? labels.uploading : labels.upload}
        </button>
        <p className="text-xs text-ivory/45">{items.length}</p>
        {error ? <p className="text-xs text-clay">{error}</p> : null}
      </div>

      {items.length === 0 ? (
        <p className="py-10 text-center text-sm text-ivory/45">{labels.noImage}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <li key={item.id} className="overflow-hidden rounded-xl border border-ivory/10 bg-ivory/[0.03]">
              <div className="relative aspect-[4/3] bg-carbon">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.path} alt={item.alt ?? item.filename} className="h-full w-full object-cover" />
              </div>
              <div className="space-y-2 p-3">
                {editing === item.id ? (
                  <div className="space-y-1">
                    <input
                      value={draft.alt}
                      placeholder={labels.edit}
                      onChange={(e) => setDraft((d) => ({ ...d, alt: e.target.value }))}
                      className={INPUT}
                    />
                    <input
                      value={draft.caption}
                      onChange={(e) => setDraft((d) => ({ ...d, caption: e.target.value }))}
                      className={INPUT}
                    />
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => void saveEdit(item.id)}
                        className="rounded-full bg-sand px-3 py-1 text-xs font-medium text-obsidian"
                      >
                        {labels.save}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing(null)}
                        className="rounded-full border border-ivory/20 px-3 py-1 text-xs text-ivory/70"
                      >
                        {labels.cancel}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="truncate text-xs text-ivory/75">{item.filename}</p>
                    <p className="font-mono text-[0.55rem] uppercase tracking-[0.14em] text-ivory/40">
                      {item.mimeType}
                      {item.width && item.height ? ` · ${item.width}×${item.height}` : ""}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="rounded-full border border-ivory/20 px-3 py-1 text-xs text-ivory/80 transition-colors hover:border-sand hover:text-ivory"
                      >
                        {labels.edit}
                      </button>
                      <button
                        type="button"
                        onClick={() => void remove(item.id)}
                        className="rounded-full border border-ivory/10 px-3 py-1 text-xs text-ivory/55 transition-colors hover:border-clay hover:text-clay"
                      >
                        {labels.delete}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
