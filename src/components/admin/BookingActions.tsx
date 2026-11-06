"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Action = "CONFIRMED" | "PAID" | "COMPLETED" | "CANCELLED" | "REFUNDED";

const NEXT: Record<string, Action[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PAID", "COMPLETED", "CANCELLED"],
  PAID: ["COMPLETED", "REFUNDED", "CANCELLED"],
  COMPLETED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  NO_SHOW: [],
};

export function BookingActions({
  bookingId,
  status,
  labels,
}: {
  bookingId: string;
  status: string;
  labels: { confirm: string; cancel: string; refund: string; complete: string; markPaid: string };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const actionLabel: Record<Action, string> = {
    CONFIRMED: labels.confirm,
    PAID: labels.markPaid,
    COMPLETED: labels.complete,
    CANCELLED: labels.cancel,
    REFUNDED: labels.refund,
  };

  const allowed = (NEXT as Record<string, Action[]>)[status] ?? [];

  async function run(action: Action) {
    if (action === "CANCELLED" || action === "REFUNDED") {
      const ok = window.confirm(`${actionLabel[action]} — ${status} → ${action}?`);
      if (!ok) return;
    }
    setBusy(action);
    setError(null);
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status: action }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(String(data.error ?? ""));
        return;
      }
      router.refresh();
    } catch {
      setError("…");
    } finally {
      setBusy(null);
    }
  }

  if (allowed.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {allowed.map((action) => (
        <button
          key={action}
          type="button"
          disabled={busy !== null}
          onClick={() => run(action)}
          className={`rounded-full border px-3 py-1.5 text-xs transition-colors disabled:opacity-50 ${
            action === "CANCELLED" || action === "REFUNDED"
              ? "border-clay/40 text-clay hover:bg-clay/10"
              : "border-atlas/40 text-atlas hover:bg-atlas/10"
          }`}
        >
          {busy === action ? "…" : actionLabel[action]}
        </button>
      ))}
      {error ? <span className="text-xs text-clay">{error}</span> : null}
    </div>
  );
}

export function BookingNotes({
  bookingId,
  initial,
  labels,
}: {
  bookingId: string;
  initial: string;
  labels: { notes: string; save: string; saved: string };
}) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, internalNotes: value }),
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
    <div className="space-y-2">
      <label
        htmlFor={`notes-${bookingId}`}
        className="block font-mono text-[0.6rem] uppercase tracking-[0.2em] text-ivory/45"
      >
        {labels.notes}
      </label>
      <textarea
        id={`notes-${bookingId}`}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setDone(false);
        }}
        rows={3}
        className="w-full rounded-xl border border-ivory/15 bg-carbon px-4 py-3 text-sm text-ivory outline-none focus:border-sand"
      />
      <button
        type="button"
        disabled={busy}
        onClick={save}
        className="rounded-full border border-sand/50 px-4 py-1.5 text-xs text-sand transition-colors hover:bg-sand/10 disabled:opacity-50"
      >
        {busy ? "…" : done ? labels.saved : labels.save}
      </button>
    </div>
  );
}

export function BookingAssign({
  bookingId,
  guides,
  vehicles,
  initialGuideId,
  initialVehicleId,
  labels,
}: {
  bookingId: string;
  guides: { id: string; name: string }[];
  vehicles: { id: string; label: string }[];
  initialGuideId: string;
  initialVehicleId: string;
  labels: { guide: string; vehicle: string; assign: string; saved: string };
}) {
  const router = useRouter();
  const [guideId, setGuideId] = useState(initialGuideId);
  const [vehicleId, setVehicleId] = useState(initialVehicleId);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, guideId, vehicleId }),
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
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <label
          htmlFor={`guide-${bookingId}`}
          className="block font-mono text-[0.6rem] uppercase tracking-[0.2em] text-ivory/45"
        >
          {labels.guide}
        </label>
        <select
          id={`guide-${bookingId}`}
          value={guideId}
          onChange={(e) => {
            setGuideId(e.target.value);
            setDone(false);
          }}
          className="mt-1 w-full rounded-full border border-ivory/15 bg-carbon px-4 py-2.5 text-sm text-ivory outline-none focus:border-sand"
        >
          <option value="">—</option>
          {guides.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label
          htmlFor={`vehicle-${bookingId}`}
          className="block font-mono text-[0.6rem] uppercase tracking-[0.2em] text-ivory/45"
        >
          {labels.vehicle}
        </label>
        <select
          id={`vehicle-${bookingId}`}
          value={vehicleId}
          onChange={(e) => {
            setVehicleId(e.target.value);
            setDone(false);
          }}
          className="mt-1 w-full rounded-full border border-ivory/15 bg-carbon px-4 py-2.5 text-sm text-ivory outline-none focus:border-sand"
        >
          <option value="">—</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <button
          type="button"
          disabled={busy}
          onClick={save}
          className="rounded-full border border-sand/50 px-4 py-1.5 text-xs text-sand transition-colors hover:bg-sand/10 disabled:opacity-50"
        >
          {busy ? "…" : done ? labels.saved : labels.assign}
        </button>
      </div>
    </div>
  );
}
