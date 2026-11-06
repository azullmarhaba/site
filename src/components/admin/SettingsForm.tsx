"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Values = {
  taxRate: number;
  minBookingNoticeHours: number;
  defaultCancelWindowHours: number;
  whatsappNumber: string;
  contactEmail: string;
};

export function SettingsForm({
  initial,
  labels,
}: {
  initial: Values;
  labels: {
    taxRate: string;
    bookingNotice: string;
    cancelWindow: string;
    whatsapp: string;
    contactEmail: string;
    save: string;
    saved: string;
    error: string;
  };
}) {
  const router = useRouter();
  const [values, setValues] = useState<Values>(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/misc?kind=settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
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

  const fields: [keyof Values, string, string, string][] = [
    ["taxRate", labels.taxRate, "number", "0.01"],
    ["minBookingNoticeHours", labels.bookingNotice, "number", "1"],
    ["defaultCancelWindowHours", labels.cancelWindow, "number", "1"],
    ["whatsappNumber", labels.whatsapp, "text", ""],
    ["contactEmail", labels.contactEmail, "email", ""],
  ];

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map(([key, label, type, step]) => (
          <div key={key}>
            <label
              htmlFor={`settings-${key}`}
              className="block font-mono text-[0.58rem] uppercase tracking-[0.18em] text-ivory/45"
            >
              {label}
            </label>
            <input
              id={`settings-${key}`}
              type={type}
              step={step || undefined}
              value={String(values[key])}
              onChange={(e) =>
                set(
                  key,
                  type === "number" ? (Number(e.target.value) as Values[typeof key]) : (e.target.value as Values[typeof key])
                )
              }
              className="mt-1 h-10 w-full rounded-full border border-ivory/15 bg-carbon px-4 text-sm text-ivory outline-none focus:border-sand"
            />
          </div>
        ))}
      </div>
      {message ? (
        <p
          role="status"
          className={`text-sm ${message.tone === "ok" ? "text-atlas" : "text-clay"}`}
        >
          {message.text}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={busy}
        className="h-10 rounded-full bg-sand px-6 text-sm font-medium text-obsidian transition-colors hover:bg-sand-bright disabled:opacity-50"
      >
        {busy ? "…" : labels.save}
      </button>
    </form>
  );
}
