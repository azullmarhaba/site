"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function MarkAllReadButton({ label }: { label: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    setBusy(true);
    try {
      await fetch("/api/account/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="rounded-full border border-ivory/20 px-4 py-1.5 text-sm text-ivory/70 transition-colors hover:border-sand hover:text-sand disabled:opacity-50"
    >
      {busy ? "…" : label}
    </button>
  );
}
