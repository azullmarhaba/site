"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function MessageActions({
  messageId,
  status,
  labels,
}: {
  messageId: string;
  status: string;
  labels: { open: string; markProgress: string; markResolved: string };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function run(next: "IN_PROGRESS" | "RESOLVED") {
    setBusy(next);
    try {
      const res = await fetch("/api/admin/misc?kind=message", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, status: next }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {status !== "IN_PROGRESS" ? (
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => run("IN_PROGRESS")}
          className="rounded-full border border-sand/40 px-3 py-1 text-xs text-sand transition-colors hover:bg-sand/10 disabled:opacity-50"
        >
          {busy === "IN_PROGRESS" ? "…" : labels.markProgress}
        </button>
      ) : null}
      {status !== "RESOLVED" ? (
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => run("RESOLVED")}
          className="rounded-full border border-atlas/40 px-3 py-1 text-xs text-atlas transition-colors hover:bg-atlas/10 disabled:opacity-50"
        >
          {busy === "RESOLVED" ? "…" : labels.markResolved}
        </button>
      ) : (
        <span className="text-xs text-ivory/45">✓ {labels.markResolved}</span>
      )}
    </div>
  );
}
