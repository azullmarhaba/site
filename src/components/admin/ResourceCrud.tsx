"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";

// ------------------------------------------------------------
// Generic admin CRUD client kit.
// Renders Add / Edit / Delete controls backed by the
// /api/admin/resources/[resource] endpoint, plus an image field
// backed by /api/admin/media (upload + pick from library).
// ------------------------------------------------------------

import type { CrudField, CrudLabels } from "./crud-fields";

export type { CrudField, CrudFieldOption, CrudLabels } from "./crud-fields";

type FieldValue = string | boolean;
type Values = Record<string, FieldValue>;

type MediaRow = {
  id: string;
  path: string;
  alt: string | null;
};

const INPUT =
  "h-10 w-full rounded-full border border-ivory/15 bg-carbon px-4 text-sm text-ivory outline-none focus:border-sand disabled:opacity-50";

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = (await res.json().catch(() => ({}))) as { data?: T; error?: string };
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data.data as T;
}

function initialValues(
  fields: CrudField[],
  row?: Record<string, unknown>,
  defaults?: Record<string, unknown>
): Values {
  const values: Values = {};
  for (const f of fields) {
    if (f.type === "checkbox") {
      const raw = row?.[f.name];
      values[f.name] = raw === undefined ? Boolean(f.defaultValue ?? false) : Boolean(raw);
      continue;
    }
    if (f.type === "media") {
      values[f.name] = row?.[f.name] == null ? "" : String(row[f.name]);
      continue;
    }
    const raw = row?.[f.name];
    if (raw === undefined || raw === null) {
      values[f.name] = f.defaultValue === undefined ? "" : String(f.defaultValue);
      continue;
    }
    if (f.money) {
      values[f.name] = String(Number(raw) / 100);
      continue;
    }
    if (f.type === "date") {
      values[f.name] = String(raw).slice(0, 10);
      continue;
    }
    values[f.name] = String(raw);
  }
  for (const f of fields) {
    if (f.type === "select" && f.required && !f.nullable && !values[f.name] && f.options?.length) {
      values[f.name] = f.options[0].value;
    }
  }
  if (defaults) {
    for (const [k, v] of Object.entries(defaults)) {
      if (v === undefined || v === null) continue;
      const field = fields.find((f) => f.name === k);
      values[k] = field?.type === "checkbox" ? Boolean(v) : String(v);
    }
  }
  return values;
}

function serialize(fields: CrudField[], values: Values): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const f of fields) {
    const v = values[f.name];
    if (f.type === "checkbox") {
      payload[f.name] = Boolean(v);
      continue;
    }
    const s = typeof v === "string" ? v : "";
    if (f.type === "number") {
      if (s.trim() === "") {
        if (f.nullable) payload[f.name] = null;
        continue;
      }
      payload[f.name] = f.money ? Math.round(Number(s) * 100) : Number(s);
      continue;
    }
    if (f.type === "date") {
      if (!s) {
        if (f.nullable) payload[f.name] = null;
        continue;
      }
      payload[f.name] = s;
      continue;
    }
    if (f.type === "media" || f.type === "select") {
      if (!s) {
        if (f.nullable || f.type === "media") payload[f.name] = null;
        continue;
      }
      payload[f.name] = s;
      continue;
    }
    if (f.type === "password") {
      if (!s) continue;
      payload[f.name] = s;
      continue;
    }
    payload[f.name] = s;
  }
  return payload;
}

// --- media field ----------------------------------------------------

function MediaField({
  id,
  value,
  preview,
  onChange,
  labels,
}: {
  id: string;
  value: string;
  preview: string;
  onChange: (id: string, path: string) => void;
  labels: CrudLabels;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);
  const [library, setLibrary] = useState<MediaRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onUpload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const media = await apiJson<MediaRow>("/api/admin/media", { method: "POST", body });
      onChange(media.id, media.path);
    } catch (e) {
      setError(e instanceof Error ? e.message : labels.error);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function openLibrary() {
    setPicking(true);
    setLibrary(null);
    try {
      const data = await apiJson<{ media: MediaRow[] }>("/api/admin/media?pick=1");
      setLibrary(data.media);
    } catch {
      setLibrary([]);
    }
  }

  return (
    <div id={id} className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-ivory/15 bg-carbon">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="px-1 text-center text-[0.6rem] text-ivory/35">{labels.noImage}</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onUpload(file);
            }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="h-9 rounded-full border border-ivory/20 px-4 text-xs text-ivory/80 transition-colors hover:border-sand hover:text-ivory disabled:opacity-50"
          >
            {busy ? labels.uploading : labels.upload}
          </button>
          <button
            type="button"
            onClick={() => void openLibrary()}
            className="h-9 rounded-full border border-ivory/20 px-4 text-xs text-ivory/80 transition-colors hover:border-sand hover:text-ivory"
          >
            {labels.library}
          </button>
          {(value || preview) && (
            <button
              type="button"
              onClick={() => onChange("", "")}
              className="h-9 rounded-full border border-ivory/10 px-4 text-xs text-ivory/60 transition-colors hover:text-clay"
            >
              {labels.clear}
            </button>
          )}
        </div>
      </div>
      {error ? <p className="text-xs text-clay">{error}</p> : null}
      {picking ? (
        <div className="rounded-xl border border-ivory/15 bg-obsidian/60 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-ivory/45">
              {labels.pickTitle}
            </p>
            <button
              type="button"
              onClick={() => setPicking(false)}
              className="text-xs text-ivory/50 hover:text-ivory"
            >
              {labels.close}
            </button>
          </div>
          {library === null ? (
            <p className="py-6 text-center text-xs text-ivory/45">{labels.loading}</p>
          ) : library.length === 0 ? (
            <p className="py-6 text-center text-xs text-ivory/45">{labels.noImage}</p>
          ) : (
            <div className="grid max-h-56 grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-6">
              {library.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    onChange(m.id, m.path);
                    setPicking(false);
                  }}
                  className={`overflow-hidden rounded-lg border transition-colors ${
                    value === m.id ? "border-sand" : "border-ivory/10 hover:border-sand/60"
                  }`}
                  title={m.alt ?? m.path}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.path} alt={m.alt ?? ""} className="h-16 w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

// --- modal form -----------------------------------------------------

function CrudModal({
  resourceKey,
  fields,
  labels,
  mode,
  id,
  title,
  defaults,
  onClose,
  onSaved,
}: {
  resourceKey: string;
  fields: CrudField[];
  labels: CrudLabels;
  mode: "create" | "edit";
  id?: string;
  title: string;
  defaults?: Record<string, unknown>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const uid = useId();
  const [values, setValues] = useState<Values>(() =>
    initialValues(
      fields.filter((f) => (mode === "create" ? !f.editOnly : !f.createOnly)),
      undefined,
      mode === "create" ? defaults : undefined
    )
  );
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(mode === "edit");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visible = fields.filter((f) => (mode === "create" ? !f.editOnly : !f.createOnly));

  useEffect(() => {
    if (mode !== "edit" || !id) return;
    let cancelled = false;
    apiJson<Record<string, unknown>>(`/api/admin/resources/${resourceKey}?id=${encodeURIComponent(id)}`)
      .then((row) => {
        if (cancelled) return;
        setValues(initialValues(visible, row));
        const media = (row.__media as Record<string, string | null> | undefined) ?? {};
        setPreviews(Object.fromEntries(Object.entries(media).map(([k, val]) => [k, val ?? ""])));
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : labels.error))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, id, resourceKey]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  function set(name: string, value: FieldValue) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const payload = serialize(visible, values);
    try {
      if (mode === "create") {
        await apiJson(`/api/admin/resources/${resourceKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await apiJson(`/api/admin/resources/${resourceKey}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, ...payload }),
        });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.error);
      setBusy(false);
    }
  }

  function renderField(f: CrudField) {
    const fieldId = `${uid}-${f.name}`;
    const v = values[f.name];
    if (f.type === "media") {
      return (
        <MediaField
          id={fieldId}
          value={typeof v === "string" ? v : ""}
          preview={previews[f.name] ?? ""}
          labels={labels}
          onChange={(mid, path) => {
            set(f.name, mid);
            setPreviews((p) => ({ ...p, [f.name]: path }));
          }}
        />
      );
    }
    if (f.type === "checkbox") {
      return (
        <label htmlFor={fieldId} className="flex items-center gap-2 pt-6 text-sm text-ivory/80">
          <input
            id={fieldId}
            type="checkbox"
            checked={Boolean(v)}
            disabled={f.readOnly}
            onChange={(e) => set(f.name, e.target.checked)}
            className="h-4 w-4 rounded border-ivory/30 bg-carbon accent-sand"
          />
          {f.label}
        </label>
      );
    }
    if (f.type === "textarea") {
      return (
        <textarea
          id={fieldId}
          value={typeof v === "string" ? v : ""}
          required={f.required}
          readOnly={f.readOnly}
          rows={f.rows ?? 4}
          maxLength={f.maxLength}
          placeholder={f.placeholder}
          onChange={(e) => set(f.name, e.target.value)}
          className="w-full rounded-2xl border border-ivory/15 bg-carbon px-4 py-3 text-sm text-ivory outline-none focus:border-sand disabled:opacity-50"
        />
      );
    }
    if (f.type === "select") {
      return (
        <select
          id={fieldId}
          value={typeof v === "string" ? v : ""}
          required={f.required}
          disabled={f.readOnly}
          onChange={(e) => set(f.name, e.target.value)}
          className={INPUT}
        >
          {(f.nullable || !f.required) && <option value="">—</option>}
          {(f.options ?? []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    }
    return (
      <input
        id={fieldId}
        type={f.type === "number" ? "number" : f.type === "date" ? "date" : f.type === "password" ? "password" : "text"}
        value={typeof v === "string" ? v : ""}
        required={f.required}
        readOnly={f.readOnly}
        min={f.min}
        max={f.max}
        step={f.step ?? (f.money ? "0.01" : undefined)}
        maxLength={f.maxLength}
        placeholder={f.placeholder}
        onChange={(e) => set(f.name, e.target.value)}
        className={`mt-1 ${INPUT}`}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-obsidian/70 p-4 backdrop-blur-sm sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={submit}
        className="my-4 w-full max-w-2xl rounded-2xl border border-ivory/15 bg-obsidian shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-ivory/10 px-5 py-4">
          <h2 className="text-base font-medium text-ivory">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={labels.close}
            className="text-ivory/50 transition-colors hover:text-ivory"
          >
            ✕
          </button>
        </header>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
          {loading ? (
            <p className="py-10 text-center text-sm text-ivory/45">{labels.loading}</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {visible.map((f) => (
                <div key={f.name} className={f.span === 2 || f.type === "textarea" || f.type === "media" ? "sm:col-span-2" : ""}>
                  {f.type !== "checkbox" && (
                    <label
                      htmlFor={`${uid}-${f.name}`}
                      className="mb-1 block font-mono text-[0.58rem] uppercase tracking-[0.18em] text-ivory/45"
                    >
                      {f.label}
                      {f.required ? <span className="text-clay"> *</span> : null}
                    </label>
                  )}
                  {renderField(f)}
                  {f.hint ? <p className="mt-1 text-xs text-ivory/40">{f.hint}</p> : null}
                </div>
              ))}
            </div>
          )}
          {error ? (
            <p role="alert" className="mt-4 text-sm text-clay">
              {error}
            </p>
          ) : null}
        </div>

        <footer className="flex items-center justify-end gap-3 border-t border-ivory/10 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-full border border-ivory/20 px-5 text-sm text-ivory/80 transition-colors hover:text-ivory"
          >
            {labels.cancel}
          </button>
          <button
            type="submit"
            disabled={busy || loading}
            className="h-10 rounded-full bg-sand px-6 text-sm font-medium text-obsidian transition-colors hover:bg-sand-bright disabled:opacity-50"
          >
            {busy ? labels.loading : labels.save}
          </button>
        </footer>
      </form>
    </div>
  );
}

// --- exported controls ---------------------------------------------

export function CreateButton({
  resourceKey,
  fields,
  labels,
  title,
  label,
  defaults,
}: {
  resourceKey: string;
  fields: CrudField[];
  labels: CrudLabels;
  title?: string;
  label?: string;
  defaults?: Record<string, unknown>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-10 rounded-full bg-sand px-5 text-sm font-medium text-obsidian transition-colors hover:bg-sand-bright"
      >
        + {label ?? labels.add}
      </button>
      {open && (
        <CrudModal
          resourceKey={resourceKey}
          fields={fields}
          labels={labels}
          mode="create"
          title={title ?? labels.add}
          defaults={defaults}
          onClose={() => setOpen(false)}
          onSaved={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

export function EditButton({
  resourceKey,
  id,
  fields,
  labels,
  title,
  label,
}: {
  resourceKey: string;
  id: string;
  fields: CrudField[];
  labels: CrudLabels;
  title?: string;
  label?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-ivory/20 px-3 py-1 text-xs text-ivory/80 transition-colors hover:border-sand hover:text-ivory"
      >
        {label ?? labels.edit}
      </button>
      {open && (
        <CrudModal
          resourceKey={resourceKey}
          fields={fields}
          labels={labels}
          mode="edit"
          id={id}
          title={title ?? labels.edit}
          onClose={() => setOpen(false)}
          onSaved={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

export function DeleteButton({
  resourceKey,
  id,
  labels,
  label,
}: {
  resourceKey: string;
  id: string;
  labels: CrudLabels;
  label?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const remove = useCallback(async () => {
    if (!window.confirm(labels.deleteConfirm)) return;
    setBusy(true);
    try {
      await apiJson(`/api/admin/resources/${resourceKey}?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      router.refresh();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : labels.error);
    } finally {
      setBusy(false);
    }
  }, [id, labels, resourceKey, router]);

  return (
    <button
      type="button"
      onClick={() => void remove()}
      disabled={busy}
      className="rounded-full border border-ivory/10 px-3 py-1 text-xs text-ivory/55 transition-colors hover:border-clay hover:text-clay disabled:opacity-50"
    >
      {label ?? labels.delete}
    </button>
  );
}
