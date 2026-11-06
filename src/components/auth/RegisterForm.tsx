"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { AuthCard } from "./AuthCard";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import type { en } from "@/lib/i18n/dictionaries/en";

export function RegisterForm({ labels }: { labels: typeof en.auth }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    if (form.password.length < 8) {
      setError(labels.weak);
      setBusy(false);
      return;
    }
    if (form.password !== form.confirm) {
      setError(labels.mismatch);
      setBusy(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          confirmPassword: form.confirm,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        if (res.status === 409) setError(labels.taken);
        else if (res.status === 400 && data.error?.includes("PASSWORD")) setError(labels.weak);
        else setError(data.error ?? labels.networkError);
        setBusy(false);
        return;
      }

      const session = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
        redirectTo: "/account",
      });
      if (!session || session.error || !session.ok) {
        setError(labels.sessionFailed);
        setBusy(false);
        return;
      }

      router.push("/account");
      router.refresh();
    } catch {
      setError(labels.networkError);
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title={labels.registerTitle}
      lead={labels.registerLead}
      error={error}
      footer={
        <>
          {labels.haveAccount}{" "}
          <Link href="/auth/login" className="text-sand hover:underline">
            {labels.submitSignIn}
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field id="name" label={labels.name}>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            required
            value={form.name}
            onChange={set("name")}
          />
        </Field>
        <Field id="email" label={labels.email}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={set("email")}
          />
        </Field>
        <Field id="phone" label={labels.phone} hint={undefined}>
          <Input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={set("phone")}
          />
        </Field>
        <Field id="password" label={labels.password} hint={labels.weak}>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={form.password}
            onChange={set("password")}
          />
        </Field>
        <Field id="confirm" label={labels.confirmPassword}>
          <Input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
            value={form.confirm}
            onChange={set("confirm")}
          />
        </Field>
        <div className="pt-1">
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? "…" : labels.submitRegister}
          </Button>
        </div>
      </form>
    </AuthCard>
  );
}
