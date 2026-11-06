"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthCard } from "./AuthCard";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import type { en } from "@/lib/i18n/dictionaries/en";

export function ForgotForm({ labels }: { labels: typeof en.auth }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "…");
        setBusy(false);
        return;
      }
      setSent(true);
    } catch {
      setError("…");
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title={labels.forgotTitle}
      lead={labels.forgotLead}
      error={error}
      success={sent ? labels.forgotSent : null}
      footer={
        <Link href="/auth/login" className="text-sand hover:underline">
          {labels.submitSignIn}
        </Link>
      }
    >
      {sent ? null : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field id="email" label={labels.email}>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <div className="pt-1">
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? "…" : labels.forgot}
            </Button>
          </div>
        </form>
      )}
      <p className="text-center text-xs leading-relaxed text-ivory/45">{labels.verifyNote}</p>
    </AuthCard>
  );
}
