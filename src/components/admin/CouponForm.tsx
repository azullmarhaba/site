"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CouponForm({
  labels,
}: {
  labels: {
    new: string;
    code: string;
    discount: string;
    redemptions: string;
    expires: string;
    save: string;
    saved: string;
    error: string;
  };
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [percent, setPercent] = useState("");
  const [limit, setLimit] = useState("");
  const [expires, setExpires] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const body: Record<string, unknown> = { code: code.trim() };
      if (percent) body.percentOff = Number(percent);
      if (limit) body.redemptionLimit = Number(limit);
      if (expires) body.expiresAt = new Date(`${expires}T23:59:59.000Z`).toISOString();

      const res = await fetch("/api/admin/misc?kind=coupon", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage({ tone: "err", text: String(data.error ?? labels.error) });
        return;
      }
      setMessage({ tone: "ok", text: labels.saved });
      setCode("");
      setPercent("");
      setLimit("");
      setExpires("");
      router.refresh();
    } catch {
      setMessage({ tone: "err", text: labels.error });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <div>
        <label
          htmlFor="coupon-code"
          className="block font-mono text-[0.58rem] uppercase tracking-[0.18em] text-ivory/45"
        >
          {labels.code}
        </label>
        <input
          id="coupon-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          minLength={3}
          maxLength={30}
          className="mt-1 h-9 w-full rounded-full border border-ivory/15 bg-carbon px-4 text-sm text-ivory outline-none focus:border-sand"
        />
      </div>
      <div>
        <label
          htmlFor="coupon-percent"
          className="block font-mono text-[0.58rem] uppercase tracking-[0.18em] text-ivory/45"
        >
          {labels.discount} %
        </label>
        <input
          id="coupon-percent"
          type="number"
          min={1}
          max={100}
          value={percent}
          onChange={(e) => setPercent(e.target.value)}
          className="mt-1 h-9 w-full rounded-full border border-ivory/15 bg-carbon px-4 text-sm text-ivory outline-none focus:border-sand"
        />
      </div>
      <div>
        <label
          htmlFor="coupon-limit"
          className="block font-mono text-[0.58rem] uppercase tracking-[0.18em] text-ivory/45"
        >
          {labels.redemptions}
        </label>
        <input
          id="coupon-limit"
          type="number"
          min={1}
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
          className="mt-1 h-9 w-full rounded-full border border-ivory/15 bg-carbon px-4 text-sm text-ivory outline-none focus:border-sand"
        />
      </div>
      <div>
        <label
          htmlFor="coupon-expires"
          className="block font-mono text-[0.58rem] uppercase tracking-[0.18em] text-ivory/45"
        >
          {labels.expires}
        </label>
        <input
          id="coupon-expires"
          type="date"
          value={expires}
          onChange={(e) => setExpires(e.target.value)}
          className="mt-1 h-9 w-full rounded-full border border-ivory/15 bg-carbon px-4 text-sm text-ivory outline-none focus:border-sand"
        />
      </div>
      <div className="flex items-end">
        <button
          type="submit"
          disabled={busy}
          className="h-9 w-full rounded-full bg-sand px-5 text-sm font-medium text-obsidian transition-colors hover:bg-sand-bright disabled:opacity-50"
        >
          {busy ? "…" : labels.save}
        </button>
      </div>
      {message ? (
        <p
          role="status"
          className={`text-sm sm:col-span-2 xl:col-span-5 ${message.tone === "ok" ? "text-atlas" : "text-clay"}`}
        >
          {message.text}
        </p>
      ) : null}
    </form>
  );
}
