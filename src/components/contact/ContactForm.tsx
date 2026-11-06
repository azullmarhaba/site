"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import type { en } from "@/lib/i18n/dictionaries/en";

export function ContactForm({ labels }: { labels: typeof en.contact }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const set = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.message.trim().length < 10 || !form.name.trim() || !form.email.trim()) {
      setStatus("error");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      setStatus("sent");
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {status === "sent" ? (
        <p
          role="status"
          className="rounded-2xl border border-sand/40 bg-sand/10 px-4 py-3 text-sm text-sand"
        >
          {labels.success}
        </p>
      ) : null}
      {status === "error" ? (
        <p role="alert" className="rounded-2xl border border-clay/40 bg-clay/10 px-4 py-3 text-sm text-clay">
          {labels.error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="name" label={labels.name} tone="light">
          <Input
            id="name"
            tone="light"
            autoComplete="name"
            required
            value={form.name}
            onChange={set("name")}
          />
        </Field>
        <Field id="email" label={labels.email} tone="light">
          <Input
            id="email"
            tone="light"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={set("email")}
          />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="phone" label={labels.phone} tone="light">
          <Input
            id="phone"
            tone="light"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={set("phone")}
          />
        </Field>
        <Field id="subject" label={labels.subject} tone="light">
          <Input id="subject" tone="light" value={form.subject} onChange={set("subject")} />
        </Field>
      </div>
      <Field id="message" label={labels.message} tone="light">
        <Textarea
          id="message"
          tone="light"
          rows={6}
          required
          value={form.message}
          onChange={set("message")}
        />
      </Field>
      <Button type="submit" variant="dark" size="lg" disabled={status === "sending"}>
        {status === "sending" ? labels.sending : labels.send}
      </Button>
    </form>
  );
}
