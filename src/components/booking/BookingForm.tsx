"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Banknote, CalendarDays, Check, Minus, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { formatDate, formatPrice } from "@/lib/format";
import { track } from "@/lib/analytics";
import type { en } from "@/lib/i18n/dictionaries/en";

type Labels = typeof en.booking;

type Experience = {
  slug: string;
  title: string;
  priceMinor: number;
  currency: string;
  capacityMin: number;
  capacityMax: number;
  cancelWindowHours: number;
  meetingPoint: string | null;
  pickupIncluded: boolean;
};

type PickupLocation = { id: string; name: string; address: string | null };

const CHILD_FACTOR = 0.5;

function mapError(code: string, labels: Labels): string {
  if (code.includes("SOLD_OUT")) return labels.errors.soldOut;
  if (code.includes("DEPARTURE_UNAVAILABLE")) return labels.errors.closed;
  if (code.includes("DATE_CLOSED") || code.includes("DATE_PAST")) return labels.errors.closed;
  if (code.includes("NOTICE")) return labels.errors.notice;
  if (code.includes("CAPACITY")) return labels.errors.capacity;
  if (code.includes("COUPON")) return labels.errors.coupon;
  return labels.errors.generic;
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

export function BookingForm({
  labels,
  experience,
  pickupLocations,
  date,
  guests,
  locale,
  prefilled,
  tourDateId,
  departureTime,
  backHref,
  backLabel,
}: {
  labels: Labels;
  experience: Experience;
  pickupLocations: PickupLocation[];
  date: string;
  guests: number;
  locale: string;
  prefilled: { name: string; email: string; phone: string } | null;
  tourDateId?: string;
  departureTime?: string;
  backHref?: string;
  backLabel?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const initialName = prefilled?.name ?? "";
  const [adults, setAdults] = useState(() => Math.max(1, Math.min(guests, experience.capacityMax)));
  const [children, setChildren] = useState(0);
  const [mode, setMode] = useState<"PRIVATE" | "GROUP">("PRIVATE");
  const [pickupLocationId, setPickupLocationId] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [special, setSpecial] = useState("");
  const [firstName, setFirstName] = useState(initialName.split(" ")[0] ?? "");
  const [lastName, setLastName] = useState(initialName.split(" ").slice(1).join(" "));
  const [email, setEmail] = useState(prefilled?.email ?? "");
  const [phone, setPhone] = useState(prefilled?.phone ?? "");
  const [coupon, setCoupon] = useState("");

  const total = adults + children;
  const inCapacity = total >= experience.capacityMin && total <= experience.capacityMax;

  const subtotal = useMemo(
    () =>
      adults * experience.priceMinor +
      Math.round(children * experience.priceMinor * CHILD_FACTOR),
    [adults, children, experience.priceMinor]
  );

  function goDetails() {
    setError(null);
    if (!inCapacity) {
      setError(labels.errors.capacity);
      return;
    }
    setStep(2);
    setError(null);
  }

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!inCapacity) {
      setError(labels.errors.capacity);
      return;
    }
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
      setError(labels.errors.generic);
      return;
    }

    setBusy(true);
    track("booking_started", { slug: experience.slug });
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          experienceSlug: experience.slug,
          date,
          adults,
          children,
          mode,
          pickupLocationId,
          pickupAddress,
          specialRequests: special,
          couponCode: coupon,
          leadFirstName: firstName,
          leadLastName: lastName,
          email,
          phone,
          ...(tourDateId ? { tourDateId } : {}),
          paymentMethod: "COD",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(mapError(String(data.error ?? ""), labels));
        setBusy(false);
        return;
      }
      router.push(`/booking/${data.reference}`);
    } catch {
      setError(labels.errors.generic);
      setBusy(false);
    }
  }

  const stepLabel = `${labels.step} ${step} ${labels.of} 2`;
  const stepName = step === 1 ? labels.steps.details : labels.steps.confirm;

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-ivory/10 bg-[radial-gradient(circle_at_top,_rgba(201,155,109,0.18),_transparent_42%),linear-gradient(180deg,rgba(11,17,21,0.96),rgba(11,17,21,0.8))] p-4 shadow-[0_30px_80px_rgba(0,0,0,0.35)] md:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.04),transparent_30%,transparent_70%,rgba(201,155,109,0.08))]" aria-hidden="true" />

      <div className="relative flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-ivory/10 bg-obsidian/50 p-3">
          <div>
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-ivory/45">
              {stepLabel} — {stepName}
            </p>
            <p className="mt-2 font-display text-xl text-ivory">{experience.title}</p>
          </div>
          <div className="flex gap-1.5" aria-hidden="true">
            {[1, 2].map((s) => (
              <span
                key={s}
                className={`h-1.5 w-10 rounded-full transition-all ${s <= step ? "bg-sand shadow-[0_0_18px_rgba(201,155,109,0.7)]" : "bg-ivory/15"}`}
              />
            ))}
          </div>
        </div>

        {tourDateId ? (
          <div className="grid gap-3 rounded-[1.5rem] border border-sand/25 bg-[linear-gradient(120deg,rgba(201,155,109,0.13),rgba(11,17,21,0.8))] p-4 sm:grid-cols-2">
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sand/10 text-sand">
                <CalendarDays className="size-4" aria-hidden="true" />
              </span>
              <div>
                <p className="font-mono text-[0.58rem] uppercase tracking-[0.16em] text-ivory/45">
                  {labels.date}
                </p>
                <p className="mt-1 text-sm text-ivory">
                  {formatDate(new Date(`${date}T00:00:00.000Z`), locale)}
                  {departureTime ? ` · ${departureTime}` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sand/10 text-sand">
                <Users className="size-4" aria-hidden="true" />
              </span>
              <div>
                <p className="font-mono text-[0.58rem] uppercase tracking-[0.16em] text-ivory/45">
                  {labels.guestsLabel}
                </p>
                <p className="mt-1 text-sm text-ivory">{total}</p>
              </div>
            </div>
          </div>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="rounded-2xl border border-clay/40 bg-clay/10 px-4 py-3 text-sm text-clay"
          >
            {error}
          </p>
        ) : null}

        {step === 1 ? (
          <div className="space-y-5">
            <div className="space-y-3 rounded-[1.5rem] border border-ivory/10 bg-obsidian/45 p-4">
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-ivory/45">
                {labels.guests}
              </p>
              <div className="space-y-3">
                <Stepper
                  label={`${labels.adults} — ${labels.adultsHint}`}
                  value={adults}
                  min={1}
                  max={Math.max(1, experience.capacityMax - children)}
                  onChange={setAdults}
                />
                <Stepper
                  label={`${labels.children} — ${labels.childrenHint}`}
                  value={children}
                  min={0}
                  max={Math.max(0, experience.capacityMax - adults)}
                  onChange={setChildren}
                />
              </div>
              {!inCapacity ? (
                <p className="text-xs text-clay">{labels.errors.capacity}</p>
              ) : null}
            </div>

            <div className="rounded-[1.5rem] border border-ivory/10 bg-obsidian/45 p-4">
              <Field id="mode" label={labels.mode}>
                <Select id="mode" value={mode} onChange={(e) => setMode(e.target.value as "PRIVATE" | "GROUP")}>
                  <option value="PRIVATE">
                    {labels.private} — {labels.privateHint}
                  </option>
                  <option value="GROUP">
                    {labels.group} — {labels.groupHint}
                  </option>
                </Select>
              </Field>
            </div>

            {pickupLocations.length > 0 || experience.pickupIncluded ? (
              <div className="space-y-3 rounded-[1.5rem] border border-ivory/10 bg-obsidian/45 p-4">
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-ivory/45">
                  {labels.pickup}
                </p>
                <div className="space-y-2">
                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-ivory/10 bg-obsidian/60 px-4 py-3 transition-colors hover:border-sand/45">
                    <input
                      type="radio"
                      name="pickup"
                      checked={pickupLocationId === ""}
                      onChange={() => setPickupLocationId("")}
                      className="mt-1 accent-[#c99b6d]"
                    />
                    <span className="text-sm text-ivory/75">
                      {labels.pickupNone}
                      {experience.meetingPoint ? (
                        <span className="block text-xs text-ivory/45">
                          {labels.meetingPoint}: {experience.meetingPoint}
                        </span>
                      ) : null}
                    </span>
                  </label>
                  {pickupLocations.map((loc) => (
                    <label
                      key={loc.id}
                      className="flex cursor-pointer items-start gap-3 rounded-2xl border border-ivory/10 bg-obsidian/60 px-4 py-3 transition-colors hover:border-sand/45"
                    >
                      <input
                        type="radio"
                        name="pickup"
                        checked={pickupLocationId === loc.id}
                        onChange={() => setPickupLocationId(loc.id)}
                        className="mt-1 accent-[#c99b6d]"
                      />
                      <span className="text-sm text-ivory/75">
                        {loc.name}
                        <span className="block text-xs text-ivory/45">{loc.address}</span>
                      </span>
                    </label>
                  ))}
                </div>
                {pickupLocationId ? (
                  <Field id="pickupAddress" label={labels.pickupAddress} hint={labels.pickupHint}>
                    <Input
                      id="pickupAddress"
                      value={pickupAddress}
                      onChange={(e) => setPickupAddress(e.target.value)}
                      placeholder="12 Rue de la Liberté, Guéliz…"
                    />
                  </Field>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-3 rounded-[1.5rem] border border-ivory/10 bg-obsidian/45 p-4">
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-ivory/45">
                {labels.details}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field id="firstName" label={labels.firstName}>
                  <Input
                    id="firstName"
                    autoComplete="given-name"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </Field>
                <Field id="lastName" label={labels.lastName}>
                  <Input
                    id="lastName"
                    autoComplete="family-name"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field id="email" label={labels.email}>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Field>
                <Field id="phone" label={labels.phone}>
                  <Input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </Field>
              </div>
              <Field id="special" label={labels.special} hint={labels.specialHint}>
                <Textarea
                  id="special"
                  rows={3}
                  value={special}
                  onChange={(e) => setSpecial(e.target.value)}
                />
              </Field>
            </div>

            <div className="rounded-[1.5rem] border border-sand/20 bg-[linear-gradient(180deg,rgba(201,155,109,0.08),rgba(9,12,15,0.7))] p-5">
              <p className="mb-3 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-ivory/45">
                {labels.summary}
              </p>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ivory/60">
                    {labels.adults} × {formatPrice(experience.priceMinor, locale)}
                  </dt>
                  <dd className="text-ivory">{formatPrice(adults * experience.priceMinor, locale)}</dd>
                </div>
                {children > 0 ? (
                  <div className="flex justify-between">
                    <dt className="text-ivory/60">
                      {labels.children} × {formatPrice(Math.round(experience.priceMinor * CHILD_FACTOR), locale)}
                    </dt>
                    <dd className="text-ivory">
                      {formatPrice(Math.round(children * experience.priceMinor * CHILD_FACTOR), locale)}
                    </dd>
                  </div>
                ) : null}
                <div className="flex justify-between border-t border-ivory/10 pt-2">
                  <dt className="text-ivory/60">{labels.subtotal}</dt>
                  <dd className="font-display text-lg text-sand">{formatPrice(subtotal, locale)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-ivory/45">
                {labels.freeCancellation} — {experience.cancelWindowHours}h
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link
                href={backHref ?? `/book/${experience.slug}`}
                className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ivory/50 hover:text-sand"
              >
                {backLabel ?? labels.chooseDate}
              </Link>
              <Button
                type="button"
                size="lg"
                disabled={!inCapacity}
                onClick={goDetails}
              >
                {labels.review} →
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={pay} className="space-y-5" noValidate>
            <div className="space-y-3 rounded-[1.5rem] border border-ivory/10 bg-obsidian/45 p-4">
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-ivory/45">
                {labels.summary}
              </p>
              <div className="rounded-3xl border border-ivory/10 bg-obsidian/60 p-5 text-sm">
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-ivory/60">{labels.date}</dt>
                    <dd className="text-ivory">{date}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ivory/60">{labels.guestsLabel}</dt>
                    <dd className="text-ivory">
                      {adults} + {children}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ivory/60">{labels.subtotal}</dt>
                    <dd className="text-ivory">{formatPrice(subtotal, locale)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-ivory/10 pt-2">
                    <dt className="text-ivory/60">{labels.total}</dt>
                    <dd className="font-display text-lg text-sand">{formatPrice(subtotal, locale)}</dd>
                  </div>
                </dl>
                <div className="mt-4 flex gap-2">
                  <Input
                    aria-label={labels.coupon}
                    placeholder={labels.coupon}
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    className="flex-1"
                  />
                </div>
                <p className="mt-2 text-xs text-ivory/40">{labels.apply}: {labels.coupon}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-[1.5rem] border border-sand/30 bg-[linear-gradient(180deg,rgba(201,155,109,0.14),rgba(13,18,22,0.7))] p-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-sand/10 text-sand">
                <Banknote className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-display text-lg text-ivory">{labels.payOnArrival}</p>
                <p className="mt-1 text-sm leading-relaxed text-ivory/60">{labels.payLead}</p>
                <p className="mt-3 rounded-xl bg-ivory/[0.05] px-3 py-2 font-display text-xl text-sand">
                  {labels.amountDueOnArrival}: {formatPrice(subtotal, locale)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ivory/50 hover:text-sand"
              >
                ← {labels.steps.details}
              </button>
              <Button type="submit" size="lg" disabled={busy}>
                <Check className="size-4" aria-hidden="true" />
                {busy ? labels.processing : labels.confirmBooking}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
