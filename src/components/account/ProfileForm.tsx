"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";

export function ProfileForm({
  initial,
  labels,
}: {
  initial: { name: string; email: string; phone: string };
  labels: {
    firstName: string;
    phone: string;
    email: string;
    save: string;
    saved: string;
    error: string;
    readonly: string;
  };
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      if (!res.ok) {
        setMessage({ tone: "err", text: labels.error });
        return;
      }
      setMessage({ tone: "ok", text: labels.saved });
      router.refresh();
    } catch {
      setMessage({ tone: "err", text: labels.error });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-5">
      <Field id="profile-name" label={labels.firstName}>
        <Input
          id="profile-name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
          autoComplete="name"
        />
      </Field>
      <Field id="profile-phone" label={labels.phone}>
        <Input
          id="profile-phone"
          name="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          type="tel"
          autoComplete="tel"
        />
      </Field>
      <Field id="profile-email" label={labels.email} hint={labels.readonly}>
        <Input id="profile-email" name="email" value={initial.email} readOnly />
      </Field>
      {message ? (
        <p
          role="status"
          className={`text-sm ${message.tone === "ok" ? "text-atlas" : "text-clay"}`}
        >
          {message.text}
        </p>
      ) : null}
      <Button type="submit" variant="primary" size="md" disabled={busy}>
        {busy ? "…" : labels.save}
      </Button>
    </form>
  );
}
