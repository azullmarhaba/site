"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const STATUS_OPTIONS = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

export function ExperienceStatusSelect({
  experienceId,
  status,
  labels,
}: {
  experienceId: string;
  status: string;
  labels: { status: string; saved: string };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function onChange(next: string) {
    setBusy(true);
    setDone(false);
    try {
      const res = await fetch("/api/admin/experiences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          experienceId,
          status: next,
        }),
      });
      if (res.ok) {
        setDone(true);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <label htmlFor={`status-${experienceId}`} className="sr-only">
        {labels.status}
      </label>
      <select
        id={`status-${experienceId}`}
        value={status}
        disabled={busy}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 rounded-full border border-ivory/20 bg-carbon px-3 text-xs text-ivory outline-none focus:border-sand disabled:opacity-50"
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      {done ? <span className="text-xs text-atlas">{labels.saved}</span> : null}
    </span>
  );
}

export function FeaturedToggle({
  experienceId,
  featured,
  label,
}: {
  experienceId: string;
  featured: boolean;
  label: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [value, setValue] = useState(featured);

  async function toggle() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/experiences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ experienceId, featured: !value }),
      });
      if (res.ok) {
        setValue(!value);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={toggle}
      aria-pressed={value}
      className={`rounded-full border px-3 py-1 text-xs transition-colors disabled:opacity-50 ${
        value ? "border-sand bg-sand/10 text-sand" : "border-ivory/20 text-ivory/50"
      }`}
    >
      {label}
      {value ? " ✓" : ""}
    </button>
  );
}
