"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Labels = {
  timeline: string;
  addNote: string;
  notePlaceholder: string;
  submit: string;
  noActivity: string;
  activityType: { NOTE: string; CALL: string; EMAIL: string; MEETING: string; STAGE: string };
  removeActivity: string;
};

type Item = { id: string; type: string; body: string; createdAt: string; authorName: string | null };

export function CrmTimeline({
  customerId,
  items,
  labels,
  locale,
}: {
  customerId: string;
  items: Item[];
  labels: Labels;
  locale: string;
}) {
  const router = useRouter();
  const [type, setType] = useState("NOTE");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const typeLabel = (t: string) =>
    labels.activityType[t as keyof typeof labels.activityType] ?? t;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/crm/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, type, body }),
      });
      if (res.ok) {
        setBody("");
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    await fetch(`/api/admin/crm/activity/${id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-lg border border-ivory/15 bg-deep px-3 py-2 text-sm text-ivory focus:border-sand/60 focus:outline-none"
          >
            {(["NOTE", "CALL", "EMAIL", "MEETING"] as const).map((t) => (
              <option key={t} value={t}>
                {labels.activityType[t]}
              </option>
            ))}
          </select>
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={labels.notePlaceholder}
            className="min-w-0 flex-1 rounded-lg border border-ivory/15 bg-deep px-3 py-2 text-sm text-ivory placeholder:text-ivory/35 focus:border-sand/60 focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy || !body.trim()}
            className="rounded-lg bg-sand px-4 py-2 text-sm font-medium text-obsidian hover:brightness-110 disabled:opacity-40"
          >
            {labels.submit}
          </button>
        </div>
      </form>

      {items.length === 0 ? (
        <p className="text-sm text-ivory/45">{labels.noActivity}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((it) => (
            <li key={it.id} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-sm text-ivory">
                  <span className="rounded-full border border-ivory/20 px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.16em] text-ivory/60">
                    {typeLabel(it.type)}
                  </span>
                  <span className="text-xs text-ivory/40">
                    {new Date(it.createdAt).toLocaleString(
                      locale === "ar" ? "ar-MA" : locale === "fr" ? "fr-MA" : "en-GB",
                      { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }
                    )}
                  </span>
                  {it.authorName ? (
                    <span className="text-xs text-ivory/40">{it.authorName}</span>
                  ) : null}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-ivory/80">{it.body}</p>
              </div>
              <button
                type="button"
                onClick={() => void remove(it.id)}
                className="shrink-0 text-xs text-ivory/35 hover:text-clay"
              >
                {labels.removeActivity}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}