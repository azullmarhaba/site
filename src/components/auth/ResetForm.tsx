"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthCard } from "./AuthCard";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import type { en } from "@/lib/i18n/dictionaries/en";

export function ResetForm({
  labels,
  token,
}: {
  labels: typeof en.auth;
  token: string;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(token ? null : labels.tokenInvalid);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    if (password.length < 8) {
      setError(labels.weak);
      setBusy(false);
      return;
    }
    if (password !== confirm) {
      setError(labels.mismatch);
      setBusy(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirm }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.error === "MISMATCH") setError(labels.mismatch);
        else if (data.error === "TOKEN_INVALID") setError(labels.tokenInvalid);
        else setError(labels.tokenInvalid);
        setBusy(false);
        return;
      }
      setDone(true);
    } catch {
      setError(labels.tokenInvalid);
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title={labels.resetTitle}
      error={error}
      success={done ? labels.resetDone : null}
      footer={
        done ? (
          <Link href="/auth/login" className="text-sand hover:underline">
            {labels.submitSignIn}
          </Link>
        ) : undefined
      }
    >
      {done ? null : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field id="password" label={labels.newPassword} hint={labels.weak}>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Field id="confirm" label={labels.confirmPassword}>
            <Input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </Field>
          <div className="pt-1">
            <Button type="submit" size="lg" className="w-full" disabled={busy || !token}>
              {busy ? "…" : labels.resetSubmit}
            </Button>
          </div>
        </form>
      )}
    </AuthCard>
  );
}
