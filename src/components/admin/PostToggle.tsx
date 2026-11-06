"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PostToggle({
  postId,
  status,
  labels,
}: {
  postId: string;
  status: string;
  labels: { publish: string; unpublish: string };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const published = status === "PUBLISHED";

  async function toggle() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/misc?kind=post", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          status: published ? "DRAFT" : "PUBLISHED",
        }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={toggle}
      className={`rounded-full border px-3 py-1 text-xs transition-colors disabled:opacity-50 ${
        published
          ? "border-atlas/40 text-atlas hover:bg-atlas/10"
          : "border-sand/40 text-sand hover:bg-sand/10"
      }`}
    >
      {busy ? "…" : published ? labels.unpublish : labels.publish}
    </button>
  );
}
