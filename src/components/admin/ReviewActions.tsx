"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ReviewActions({
  reviewId,
  status,
  labels,
}: {
  reviewId: string;
  status: string;
  labels: { approve: string; reject: string; moderated: string };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(next: "APPROVED" | "REJECTED") {
    setBusy(next);
    setError(null);
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, status: next }),
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

  if (status !== "PENDING") {
    return <span className="text-xs text-ivory/45">{labels.moderated}</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={busy !== null}
        onClick={() => run("APPROVED")}
        className="rounded-full border border-atlas/40 px-3 py-1 text-xs text-atlas transition-colors hover:bg-atlas/10 disabled:opacity-50"
      >
        {busy === "APPROVED" ? "…" : labels.approve}
      </button>
      <button
        type="button"
        disabled={busy !== null}
        onClick={() => run("REJECTED")}
        className="rounded-full border border-clay/40 px-3 py-1 text-xs text-clay transition-colors hover:bg-clay/10 disabled:opacity-50"
      >
        {busy === "REJECTED" ? "…" : labels.reject}
      </button>
      {error ? <span className="text-xs text-clay">{error}</span> : null}
    </div>
  );
}
