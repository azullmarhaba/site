"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type FormState = {
  title: string;
  summary: string;
  description: string;
  priceMinor: number;
  capacityMin: number;
  capacityMax: number;
  meetingPoint: string;
  cancelWindowHours: number;
  coverImageId: string | null;
  galleryMediaIds: string[];
};

type ExperienceMediaItem = {
  id: string;
  path: string;
  filename: string;
  alt: string | null;
  mimeType: string;
};

function ExperienceMediaFields({
  items: initialItems,
  coverImageId,
  galleryMediaIds,
  onChange,
  labels,
}: {
  items: ExperienceMediaItem[];
  coverImageId: string | null;
  galleryMediaIds: string[];
  onChange: (value: { coverImageId: string | null; galleryMediaIds: string[] }) => void;
  labels: {
    mediaTitle: string;
    uploadMedia: string;
    uploading: string;
    cover: string;
    addToGallery: string;
    removeFromGallery: string;
    noMedia: string;
    uploadError: string;
  };
}) {
  const [items, setItems] = useState(initialItems);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadMany(files: File[]) {
    if (files.length === 0) return;
    setBusy(true);
    setError(null);
    const uploaded: ExperienceMediaItem[] = [];
    try {
      for (const file of files) {
        const body = new FormData();
        body.append("file", file);
        const response = await fetch("/api/admin/media", { method: "POST", body });
        const result = await response.json();
        if (!response.ok) {
          setError(result.error ?? labels.uploadError);
          continue;
        }
        uploaded.push(result.data as ExperienceMediaItem);
      }
      if (uploaded.length > 0) {
        setItems((current) => [...uploaded, ...current]);
        const newIds = uploaded.map((item) => item.id);
        onChange({
          coverImageId: coverImageId ?? newIds[0],
          galleryMediaIds: [...galleryMediaIds, ...newIds],
        });
      }
    } catch {
      setError(labels.uploadError);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <section className="space-y-3 rounded-2xl border border-ivory/10 bg-ivory/[0.025] p-4 md:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-ivory">{labels.mediaTitle}</h3>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
          className="sr-only"
          aria-label={labels.uploadMedia}
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            if (files.length > 0) void uploadMany(files);
          }}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="min-h-10 rounded-full border border-ivory/20 px-4 text-xs text-ivory/80 transition-colors hover:border-sand hover:text-ivory disabled:opacity-50"
        >
          {busy ? labels.uploading : labels.uploadMedia}
        </button>
      </div>
      {error ? <p role="alert" className="text-sm text-clay">{error}</p> : null}
      {items.length === 0 ? (
        <p className="text-sm text-ivory/45">{labels.noMedia}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => {
            const inGallery = galleryMediaIds.includes(item.id);
            const position = galleryMediaIds.indexOf(item.id);
            return (
              <li key={item.id} className="overflow-hidden rounded-xl border border-ivory/10 bg-carbon">
                <div className="relative aspect-[4/3] bg-deep">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.path} alt={item.alt ?? item.filename} className="h-full w-full object-cover" />
                </div>
                <div className="space-y-2 p-2.5">
                  <p className="truncate text-xs text-ivory/65">{item.filename}</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      aria-pressed={coverImageId === item.id}
                      onClick={() => onChange({ coverImageId: item.id, galleryMediaIds })}
                      className={`min-h-9 rounded-full border px-3 text-xs ${coverImageId === item.id ? "border-sand bg-sand/10 text-sand" : "border-ivory/20 text-ivory/70 hover:border-sand"}`}
                    >
                      {labels.cover}
                    </button>
                    <button
                      type="button"
                      aria-pressed={inGallery}
                      onClick={() => onChange({
                        coverImageId,
                        galleryMediaIds: inGallery
                          ? galleryMediaIds.filter((id) => id !== item.id)
                          : [...galleryMediaIds, item.id],
                      })}
                      className="min-h-9 rounded-full border border-ivory/20 px-3 text-xs text-ivory/70 hover:border-sand"
                    >
                      {inGallery ? labels.removeFromGallery : labels.addToGallery}
                    </button>
                    {inGallery && position > 0 ? (
                      <button
                        type="button"
                        aria-label={`Move ${item.filename} up`}
                        onClick={() => {
                          const next = [...galleryMediaIds];
                          [next[position - 1], next[position]] = [next[position], next[position - 1]];
                          onChange({ coverImageId, galleryMediaIds: next });
                        }}
                        className="min-h-9 rounded-full border border-ivory/20 px-3 text-xs text-ivory/70 hover:border-sand"
                      >
                        ↑
                      </button>
                    ) : null}
                    {inGallery && position < galleryMediaIds.length - 1 ? (
                      <button
                        type="button"
                        aria-label={`Move ${item.filename} down`}
                        onClick={() => {
                          const next = [...galleryMediaIds];
                          [next[position], next[position + 1]] = [next[position + 1], next[position]];
                          onChange({ coverImageId, galleryMediaIds: next });
                        }}
                        className="min-h-9 rounded-full border border-ivory/20 px-3 text-xs text-ivory/70 hover:border-sand"
                      >
                        ↓
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function ExperienceEditForm({
  experienceId,
  initial,
  mediaItems,
  labels,
}: {
  experienceId: string;
  initial: FormState;
  mediaItems: ExperienceMediaItem[];
  labels: {
    titleField: string;
    summary: string;
    description: string;
    price: string;
    capacity: string;
    meetingPoint: string;
    cancelWindow: string;
    publish: string;
    saved: string;
    error: string;
    edit: string;
    mediaTitle: string;
    uploadMedia: string;
    uploading: string;
    cover: string;
    addToGallery: string;
    removeFromGallery: string;
    noMedia: string;
    uploadError: string;
  };
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setMedia(value: { coverImageId: string | null; galleryMediaIds: string[] }) {
    setForm((prev) => ({ ...prev, ...value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/experiences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ experienceId, ...form }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage({ tone: "err", text: String(data.error ?? labels.error) });
        return;
      }
      setMessage({ tone: "ok", text: labels.saved });
      router.refresh();
    } catch {
      setMessage({ tone: "err", text: labels.error });
    } finally {
      setBusy(false);
    }
  }

  const input =
    "mt-1 h-10 w-full rounded-full border border-ivory/15 bg-carbon px-4 text-sm text-ivory outline-none focus:border-sand";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label htmlFor="exp-title" className="block font-mono text-[0.58rem] uppercase tracking-[0.18em] text-ivory/45">
            {labels.titleField}
          </label>
          <input
            id="exp-title"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            required
            minLength={3}
            maxLength={200}
            className={input}
          />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="exp-summary" className="block font-mono text-[0.58rem] uppercase tracking-[0.18em] text-ivory/45">
            {labels.summary}
          </label>
          <input
            id="exp-summary"
            value={form.summary}
            onChange={(e) => set("summary", e.target.value)}
            maxLength={400}
            className={input}
          />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="exp-description" className="block font-mono text-[0.58rem] uppercase tracking-[0.18em] text-ivory/45">
            {labels.description}
          </label>
          <textarea
            id="exp-description"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={6}
            required
            minLength={10}
            className="mt-1 w-full rounded-2xl border border-ivory/15 bg-carbon px-4 py-3 text-sm text-ivory outline-none focus:border-sand"
          />
        </div>
        <div>
          <label htmlFor="exp-price" className="block font-mono text-[0.58rem] uppercase tracking-[0.18em] text-ivory/45">
            {labels.price}
          </label>
          <input
            id="exp-price"
            type="number"
            min={0}
            value={form.priceMinor}
            onChange={(e) => set("priceMinor", Number(e.target.value))}
            className={input}
          />
        </div>
        <div>
          <label htmlFor="exp-meeting" className="block font-mono text-[0.58rem] uppercase tracking-[0.18em] text-ivory/45">
            {labels.meetingPoint}
          </label>
          <input
            id="exp-meeting"
            value={form.meetingPoint}
            onChange={(e) => set("meetingPoint", e.target.value)}
            maxLength={255}
            className={input}
          />
        </div>
        <div>
          <label htmlFor="exp-capmin" className="block font-mono text-[0.58rem] uppercase tracking-[0.18em] text-ivory/45">
            {labels.capacity} — min
          </label>
          <input
            id="exp-capmin"
            type="number"
            min={1}
            value={form.capacityMin}
            onChange={(e) => set("capacityMin", Number(e.target.value))}
            className={input}
          />
        </div>
        <div>
          <label htmlFor="exp-capmax" className="block font-mono text-[0.58rem] uppercase tracking-[0.18em] text-ivory/45">
            {labels.capacity} — max
          </label>
          <input
            id="exp-capmax"
            type="number"
            min={1}
            value={form.capacityMax}
            onChange={(e) => set("capacityMax", Number(e.target.value))}
            className={input}
          />
        </div>
        <div>
          <label htmlFor="exp-cancel" className="block font-mono text-[0.58rem] uppercase tracking-[0.18em] text-ivory/45">
            {labels.cancelWindow}
          </label>
          <input
            id="exp-cancel"
            type="number"
            min={0}
            value={form.cancelWindowHours}
            onChange={(e) => set("cancelWindowHours", Number(e.target.value))}
            className={input}
          />
        </div>
        <ExperienceMediaFields
          items={mediaItems}
          coverImageId={form.coverImageId}
          galleryMediaIds={form.galleryMediaIds}
          onChange={setMedia}
          labels={labels}
        />
      </div>
      {message ? (
        <p role="status" className={`text-sm ${message.tone === "ok" ? "text-atlas" : "text-clay"}`}>
          {message.text}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={busy}
        className="h-10 rounded-full bg-sand px-6 text-sm font-medium text-obsidian transition-colors hover:bg-sand-bright disabled:opacity-50"
      >
        {busy ? "…" : labels.publish}
      </button>
    </form>
  );
}
