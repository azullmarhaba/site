"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Copy, RotateCcw, Sparkles, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { formatPrice } from "@/lib/format";
import { track } from "@/lib/analytics";
import type { en } from "@/lib/i18n/dictionaries/en";

type PlannerDay = {
  day: number;
  destination: { name: string; slug: string };
  experience: { title: string; slug: string } | null;
  duration: string;
  description: string;
  costMinor: number;
};

type Result = {
  days: PlannerDay[];
  totalMinor: number;
  currency: string;
  shareSlug?: string;
  id?: string;
};

const STYLES = ["solo", "couple", "family", "friends", "group"] as const;
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
const BUDGETS = ["economy", "comfort", "premium"] as const;

export function PlannerForm({
  labels,
  locale,
  signedIn,
}: {
  labels: typeof en.planner;
  locale: string;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [days, setDays] = useState(7);
  const [style, setStyle] = useState<(typeof STYLES)[number]>("couple");
  const [interests, setInterests] = useState<string[]>(["culture", "food"]);
  const [budget, setBudget] = useState<(typeof BUDGETS)[number]>("comfort");
  const [groupType, setGroupType] = useState("");

  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleInterest = (key: string) =>
    setInterests((list) =>
      list.includes(key) ? list.filter((i) => i !== key) : [...list, key]
    );

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    if (interests.length === 0) {
      setError(labels.emptyHint);
      return;
    }
    setBusy(true);
    setError(null);
    setSaved(false);
    setResult(null);
    track("trip_planner_started", { days, style });
    try {
      const res = await fetch("/api/trip-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days, style, interests, budget, groupType }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error === "NO_MATCHES" ? labels.emptyHint : "…");
        setBusy(false);
        return;
      }
      setResult(data);
      track("trip_planner_completed", { days, style });
    } catch {
      setError("…");
    }
    setBusy(false);
  }

  async function save() {
    if (!result) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/trip-plans?save=1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days, style, interests, budget, groupType }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/auth/login?callbackUrl=/plan-my-trip");
          return;
        }
        setError("…");
        setSaving(false);
        return;
      }
      setResult(data);
      setSaved(true);
    } catch {
      setError("…");
    }
    setSaving(false);
  }

  async function share() {
    if (!result?.shareSlug) return;
    const url = `${window.location.origin}/plan-my-trip/${result.shareSlug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Share", url);
    }
  }

  const chip = (active: boolean) =>
    `rounded-full border px-4 py-2 text-sm transition-colors ${
      active
        ? "border-sand bg-sand text-obsidian"
        : "border-ivory/15 text-ivory/70 hover:border-sand hover:text-sand"
    }`;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
      {/* Form */}
      <form onSubmit={generate} className="space-y-7">
        <div className="space-y-3">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-ivory/45">
            {labels.days}
          </p>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={1}
              max={21}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              aria-label={labels.days}
              className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-ivory/15 accent-[#c99b6d]"
            />
            <span className="w-16 text-end font-display text-3xl text-sand">{days}</span>
          </div>
        </div>

        <div className="space-y-3">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-ivory/45">
            {labels.style}
          </p>
          <div className="flex flex-wrap gap-2" role="group" aria-label={labels.style}>
            {STYLES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStyle(s)}
                aria-pressed={style === s}
                className={chip(style === s)}
              >
                {labels.styles[s]}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
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

        <div className="space-y-3">
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

        <Field id="groupType" label={labels.groupType}>
          <Input
            id="groupType"
            value={groupType}
            onChange={(e) => setGroupType(e.target.value)}
            placeholder="2 adults, 1 child…"
          />
        </Field>

        {error ? (
          <p role="alert" className="rounded-2xl border border-clay/40 bg-clay/10 px-4 py-3 text-sm text-clay">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" size="lg" disabled={busy}>
            <Sparkles className="size-4" aria-hidden="true" />
            {busy ? labels.generating : labels.generate}
          </Button>
          {result ? (
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => {
                setResult(null);
                setSaved(false);
              }}
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              {labels.restart}
            </Button>
          ) : null}
        </div>
        {!result ? (
          <p className="text-sm leading-relaxed text-ivory/50">{labels.emptyHint}</p>
        ) : null}
      </form>

      {/* Result */}
      <div className="space-y-4">
        {busy ? (
          <div className="rounded-3xl border border-ivory/10 bg-deep p-8 text-center">
            <p className="animate-pulse font-display text-xl text-sand">{labels.generating}</p>
          </div>
        ) : result ? (
          <div className="rounded-3xl border border-ivory/10 bg-deep p-5 md:p-7">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="eyebrow">{labels.yourItinerary}</p>
                <p className="mt-2 font-display text-2xl text-ivory">
                  {labels.title} · {result.days.length} {labels.day}
                </p>
              </div>
              <div className="text-end">
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-ivory/45">
                  {labels.estimated}
                </p>
                <p className="font-display text-2xl text-sand">
                  {formatPrice(result.totalMinor, locale)}
                </p>
              </div>
            </div>

            <ol className="space-y-3">
              {result.days.map((d) => (
                <li
                  key={d.day}
                  className="rounded-2xl border border-ivory/10 bg-obsidian/60 p-4"
                >
                  <div className="flex items-start gap-4">
                    <span className="font-display text-2xl text-sand/70" aria-hidden="true">
                      {String(d.day).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-3">
                        <p className="font-medium text-ivory">{d.destination.name}</p>
                        <p className="font-mono text-[0.58rem] uppercase tracking-[0.16em] text-ivory/40">
                          {d.duration}
                        </p>
                      </div>
                      {d.experience ? (
                        <Link
                          href={`/experiences/${d.experience.slug}`}
                          className="mt-0.5 block text-sm text-sand hover:underline"
                        >
                          {d.experience.title}
                        </Link>
                      ) : null}
                      <p className="mt-1 text-xs leading-relaxed text-ivory/55">{d.description}</p>
                    </div>
                    <span className="shrink-0 text-sm text-ivory/60">
                      {formatPrice(d.costMinor, locale)}
                    </span>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-6 flex flex-wrap gap-3 border-t border-ivory/10 pt-5">
              {signedIn || result.shareSlug ? (
                <Button type="button" size="md" onClick={save} disabled={saving}>
                  <Check className="size-4" aria-hidden="true" />
                  {saved ? labels.saved : labels.save}
                </Button>
              ) : (
                <Link
                  href="/auth/login?callbackUrl=/plan-my-trip"
                  className="inline-flex h-11 items-center rounded-full border border-ivory/30 px-6 text-sm text-ivory transition-colors hover:border-sand hover:text-sand"
                >
                  {labels.saveLogin}
                </Link>
              )}
              {result.shareSlug ? (
                <Button type="button" variant="outline" size="md" onClick={share}>
                  {copied ? <Copy className="size-4 text-sand" aria-hidden="true" /> : null}
                  {copied ? labels.shareCopied : labels.share}
                </Button>
              ) : null}
              <Link
                href="/experiences"
                className="inline-flex h-11 items-center rounded-full bg-sand px-6 text-sm font-medium text-obsidian transition-colors hover:bg-sand-bright"
              >
                {labels.book}
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-ivory/15 bg-deep/50 p-8 text-center">
            <CalendarDays className="mx-auto size-8 text-sand/50" aria-hidden="true" />
            <p className="mt-4 text-sm text-ivory/55">{labels.lead}</p>
          </div>
        )}
      </div>
    </div>
  );
}
