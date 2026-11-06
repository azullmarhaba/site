"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { AuthCard } from "./AuthCard";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import type { en } from "@/lib/i18n/dictionaries/en";

export function LoginForm({ labels }: { labels: typeof en.auth }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("callbackUrl") ?? params.get("next") ?? "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        redirectTo: next,
      });
      if (res?.error) {
        setError(labels.invalid);
        setBusy(false);
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError(labels.invalid);
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title={labels.signInTitle}
      lead={labels.signInLead}
      error={error}
      footer={
        <>
          {labels.noAccount}{" "}
          <Link href="/auth/register" className="text-sand hover:underline">
            {labels.submitRegister}
          </Link>
        </>
      }
    >
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
        <Field id="password" label={labels.password}>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <div className="pt-1">
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? "…" : labels.submitSignIn}
          </Button>
        </div>
        <p className="text-center text-sm">
          <Link href="/auth/forgot" className="text-ivory/55 hover:text-sand">
            {labels.forgot}
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
