"use client";

import { useState } from "react";
import { CalendarDays, Check, Compass, Minus, Plus, RotateCcw, Send, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { track } from "@/lib/analytics";
import type { en } from "@/lib/i18n/dictionaries/en";

type Labels = typeof en.customTour;

const STYLES = ["solo", "couple", "family", "friends", "group"] as const;
const BUDGETS = ["economy", "comfort", "premium"] as const;
const INTERESTS = [
  "adventure",
  "culture",
  "nature",
  "food",
  "luxury",
  "desert",
  "photography",
  "relaxation",
] as const;

function todayISO() {
  const now = new Date();
  const utc = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return utc.toISOString().slice(0, 10);
}

function Stepper({
  value,
  min,
  max,
  onChange,
  label,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-ivory/10 bg-obsidian/60 px-4 py-3">
      <span className="text-sm text-ivory/75">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`- ${label}`}
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="grid size-11 place-items-center rounded-full border border-ivory/15 text-ivory/70 transition-colors hover:border-sand hover:text-sand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sand disabled:pointer-events-none disabled:opacity-30"
        >
          <Minus className="size-3.5" aria-hidden="true" />
        </button>
        <span className="w-6 text-center font-display text-lg text-ivory">{value}</span>
        <button
          type="button"
          aria-label={`+ ${label}`}
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="grid size-11 place-items-center rounded-full border border-ivory/15 text-ivory/70 transition-colors hover:border-sand hover:text-sand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sand disabled:pointer-events-none disabled:opacity-30"
        >
          <Plus className="size-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export function CustomTourForm({ labels, locale }: { labels: Labels; locale: string }) {
  const [startDate, setStartDate] = useState("");
  const [days, setDays] = useState(7);
  const [travelers, setTravelers] = useState(2);
  const [travelStyle, setTravelStyle] = useState<(typeof STYLES)[number]>("couple");
  const [budget, setBudget] = useState<(typeof BUDGETS)[number]>("comfort");
  const [interests, setInterests] = useState<string[]>(["culture"]);
  const [destinations, setDestinations] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const toggleInterest = (key: string) =>
    setInterests((list) =>
      list.includes(key) ? list.filter((i) => i !== key) : [...list, key]
    );

  const chip = (active: boolean) =>
    `rounded-full border px-4 py-2 text-sm transition-colors ${
      active
        ? "border-sand bg-sand text-obsidian"
        : "border-ivory/15 text-ivory/70 hover:border-sand hover:text-sand"
    }`;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!startDate) {
      setError(labels.errors.date);
      return;
    }
    if (name.trim().length < 2 || !email.trim()) {
      setError(labels.errors.generic);
      return;
    }
    setBusy(true);
    track("custom_tour_started", { days, travelers, travelStyle });
    try {
      const res = await fetch("/api/custom-tour", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          startDate,
          days,
          travelers,
          travelStyle,
          budget,
          interests,
          destinations: destinations.trim(),
          message: message.trim(),
          locale,
        }),
      });
      if (!res.ok) {
        setError(labels.errors.generic);
        setBusy(false);
        return;
      }
      setSent(true);
      track("custom_tour_completed", { days, travelers });
    } catch {
      setError(labels.errors.generic);
      setBusy(false);
    }
  }

  function reset() {
    setSent(false);
    setStartDate("");
    setDays(7);
    setTravelers(2);
    setTravelStyle("couple");
    setBudget("comfort");
    setInterests(["culture"]);
    setDestinations("");
    setName("");
    setEmail("");
    setPhone("");
    setMessage("");
    setError(null);
  }

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-ivory/10 bg-[radial-gradient(circle_at_top,_rgba(201,155,109,0.18),_transparent_42%),linear-gradient(180deg,rgba(11,17,21,0.96),rgba(11,17,21,0.8))] p-4 shadow-[0_30px_80px_rgba(0,0,0,0.35)] md:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.04),transparent_30%,transparent_70%,rgba(201,155,109,0.08))]" aria-hidden="true" />

      <div className="relative flex flex-col gap-6">
        <div className="flex items-center gap-3 rounded-2xl border border-ivory/10 bg-obsidian/50 p-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sand/10 text-sand">
            <Compass className="size-4" aria-hidden="true" />
          </span>
          <div>
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-ivory/45">
              {labels.eyebrow}
            </p>
            <p className="mt-2 font-display text-xl text-ivory">{labels.title}</p>
          </div>
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-2xl border border-clay/40 bg-clay/10 px-4 py-3 text-sm text-clay"
          >
            {error}
          </p>
        ) : null}

        {sent ? (
          <div className="space-y-5">
            <div className="rounded-[1.5rem] border border-sand/30 bg-[linear-gradient(180deg,rgba(201,155,109,0.14),rgba(13,18,22,0.7))] p-6 text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-sand/15 text-sand">
                <Check className="size-6" aria-hidden="true" />
              </span>
              <p className="mt-4 font-display text-2xl text-ivory">{labels.successTitle}</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ivory/60">
                {labels.successLead}
              </p>
            </div>
            <ul className="space-y-2.5">
              {labels.nextSteps.map((step) => (
                <li
                  key={step}
                  className="flex items-start gap-3 rounded-2xl border border-ivory/10 bg-obsidian/45 px-4 py-3 text-sm text-ivory/75"
                >
                  <Check className="mt-0.5 size-4 shrink-0 text-sand" aria-hidden="true" />
                  {step}
                </li>
              ))}
            </ul>
            <Button type="button" variant="outline" size="lg" onClick={reset}>
              <RotateCcw className="size-4" aria-hidden="true" />
              {labels.submitAnother}
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            <div className="space-y-3 rounded-[1.5rem] border border-ivory/10 bg-obsidian/45 p-4">
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-ivory/45">
                {labels.journey}
              </p>
              <Field id="startDate" label={labels.startDate}>
                <Input
                  id="startDate"
                  type="date"
                  min={todayISO()}
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </Field>
              <Stepper label={labels.days} value={days} min={1} max={30} onChange={setDays} />
              <Stepper
                label={labels.travelers}
                value={travelers}
                min={1}
                max={40}
                onChange={setTravelers}
              />
            </div>

            <div className="space-y-3 rounded-[1.5rem] border border-ivory/10 bg-obsidian/45 p-4">
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-ivory/45">
                {labels.travelStyle}
              </p>
              <div className="flex flex-wrap gap-2" role="group" aria-label={labels.travelStyle}>
                {STYLES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setTravelStyle(s)}
                    aria-pressed={travelStyle === s}
                    className={chip(travelStyle === s)}
                  >
                    {labels.styles[s]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 rounded-[1.5rem] border border-ivory/10 bg-obsidian/45 p-4">
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-ivory/45">
                {labels.budget}
              </p>
              <div className="flex flex-wrap gap-2" role="group" aria-label={labels.budget}>
                {BUDGETS.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBudget(b)}
                    aria-pressed={budget === b}
                    className={chip(budget === b)}
                  >
                    {labels.budgets[b]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 rounded-[1.5rem] border border-ivory/10 bg-obsidian/45 p-4">
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-ivory/45">
                {labels.interests}
              </p>
              <div className="flex flex-wrap gap-2" role="group" aria-label={labels.interests}>
                {INTERESTS.map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleInterest(i)}
                    aria-pressed={interests.includes(i)}
                    className={chip(interests.includes(i))}
                  >
                    {labels.interestList[i]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 rounded-[1.5rem] border border-ivory/10 bg-obsidian/45 p-4">
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-ivory/45">
                {labels.details}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field id="ct-name" label={labels.name}>
                  <Input
                    id="ct-name"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Field>
                <Field id="ct-email" label={labels.email}>
                  <Input
                    id="ct-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field id="ct-phone" label={labels.phone}>
                  <Input
                    id="ct-phone"
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </Field>
                <Field id="ct-destinations" label={labels.destinations}>
                  <Input
                    id="ct-destinations"
                    value={destinations}
                    onChange={(e) => setDestinations(e.target.value)}
                    placeholder="Marrakech, Atlas, Merzouga…"
                  />
                </Field>
              </div>
              <Field id="ct-message" label={labels.message} hint={labels.messageHint}>
                <Textarea
                  id="ct-message"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </Field>
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-xs text-ivory/45">
                <CalendarDays className="size-3.5 text-sand/70" aria-hidden="true" />
                {labels.noFees}
              </p>
              <Button type="submit" size="lg" disabled={busy}>
                <Send className="size-4" aria-hidden="true" />
                {busy ? labels.sending : labels.submit}
              </Button>
            </div>
            <p className="flex items-center gap-2 text-xs text-ivory/40">
              <Users className="size-3.5" aria-hidden="true" />
              {labels.responseTime}
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
