"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function CancelBookingButton({
  reference,
  labels,
}: {
  reference: string;
  labels: {
    cancelBooking: string;
    cancelConfirm: string;
    cancelled: string;
    cancelTooLate: string;
    generic: string;
  };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onCancel() {
    if (!window.confirm(labels.cancelConfirm)) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/account/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (String(data.error ?? "").includes("WINDOW")) setMessage(labels.cancelTooLate);
        else if (res.status === 401) {
          router.push(`/auth/login?callbackUrl=/booking/${reference}`);
          return;
        } else setMessage(labels.generic);
        setBusy(false);
        return;
      }
      setDone(true);
      setMessage(labels.cancelled);
      router.refresh();
    } catch {
      setMessage(labels.generic);
    }
    setBusy(false);
  }

  if (done) {
    return (
      <p role="status" className="text-sm text-clay">
        {labels.cancelled}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="danger" size="md" disabled={busy} onClick={onCancel}>
        {busy ? "…" : labels.cancelBooking}
      </Button>
      {message ? (
        <p role="status" className="text-sm text-clay">
          {message}
        </p>
      ) : null}
    </div>
  );
}
