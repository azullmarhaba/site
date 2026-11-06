"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Minus, Plus, Users } from "lucide-react";
import { formatPrice } from "@/lib/format";

export type CalendarDay = {
  date: string; // YYYY-MM-DD (UTC)
  capacityTotal: number;
  capacityBooked: number;
  closed: boolean;
};

type Labels = {
  chooseDate: string;
  guests: string;
  bookThisDate: string;
  selectHint: string;
  closed: string;
  full: string;
  available: string;
  noAvailability: string;
  prevMonth: string;
  nextMonth: string;
};

const iso = (y: number, m: number, d: number) =>
  new Date(Date.UTC(y, m, d)).toISOString().slice(0, 10);

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

function monthLabel(year: number, month: number, locale: string) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-MA" : locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month, 1)));
}

export function AvailabilityCalendar({
  slug,
  days,
  locale,
  labels,
  priceMinor,
  capacityMin,
  capacityMax,
}: {
  slug: string;
  days: CalendarDay[];
  locale: string;
  labels: Labels;
  priceMinor: number;
  capacityMin: number;
  capacityMax: number;
}) {
  const dayMap = useMemo(() => {
    const m = new Map<string, CalendarDay>();
    for (const d of days) m.set(d.date, d);
    return m;
  }, [days]);

  const bounds = useMemo(() => {
    if (days.length === 0) return null;
    const first = new Date(days[0].date);
    const last = new Date(days[days.length - 1].date);
    return {
      firstYear: first.getUTCFullYear(),
      firstMonth: first.getUTCMonth(),
      lastYear: last.getUTCFullYear(),
      lastMonth: last.getUTCMonth(),
      minDate: days[0].date,
      maxDate: days[days.length - 1].date,
    };
  }, [days]);

  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getUTCFullYear(), month: now.getUTCMonth() };
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [guests, setGuests] = useState(() => Math.min(Math.max(capacityMin, 1), capacityMax));

  const todayIso = isoDay(new Date());

  if (!bounds) {
    return null;
  }

  const weekStart = locale === "ar" ? 6 : 1; // Sat in Arabic locales, Mon otherwise
  const firstOfMonth = new Date(Date.UTC(cursor.year, cursor.month, 1));
  const offset = (firstOfMonth.getUTCDay() - weekStart + 7) % 7;
  const daysInMonth = new Date(Date.UTC(cursor.year, cursor.month + 1, 0)).getUTCDate();

  const cells: Array<string | null> = [
    ...Array<string | null>(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => iso(cursor.year, cursor.month, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const weekdayFmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-MA" : locale, {
    weekday: "short",
    timeZone: "UTC",
  });
  const weekRef = Date.UTC(2024, 0, 1) - (((1 - weekStart + 7) % 7) * 86400000);
  const weekdayNames = Array.from({ length: 7 }, (_, i) =>
    weekdayFmt.format(new Date(weekRef + i * 86400000))
  );

  const canPrev =
    cursor.year > bounds.firstYear ||
    (cursor.year === bounds.firstYear && cursor.month > bounds.firstMonth);
  const canNext =
    cursor.year < bounds.lastYear ||
    (cursor.year === bounds.lastYear && cursor.month < bounds.lastMonth);

  const step = (dir: -1 | 1) => {
    setCursor((c) => {
      const m = c.month + dir;
      if (m < 0) return { year: c.year - 1, month: 11 };
      if (m > 11) return { year: c.year + 1, month: 0 };
      return { year: c.year, month: m };
    });
  };

  const dayState = (date: string): "available" | "full" | "closed" | "past" | "none" => {
    if (date < todayIso || date < bounds.minDate || date > bounds.maxDate) return "past";
    const d = dayMap.get(date);
    if (!d) return "none";
    if (d.closed) return "closed";
    if (d.capacityBooked >= d.capacityTotal) return "full";
    return "available";
  };

  const selectedDay = selected ? dayMap.get(selected) : undefined;
  const left = selectedDay
    ? Math.max(0, selectedDay.capacityTotal - selectedDay.capacityBooked)
    : 0;
  const estimate = priceMinor * guests;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={!canPrev}
          aria-label={labels.prevMonth}
          className="grid size-10 place-items-center rounded-full border border-ivory/15 text-ivory/70 transition-colors hover:border-sand hover:text-sand disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        <p className="font-display text-lg text-ivory" aria-live="polite">
          {monthLabel(cursor.year, cursor.month, locale)}
        </p>
        <button
          type="button"
          onClick={() => step(1)}
          disabled={!canNext}
          aria-label={labels.nextMonth}
          className="grid size-10 place-items-center rounded-full border border-ivory/15 text-ivory/70 transition-colors hover:border-sand hover:text-sand disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5" role="grid" aria-label={labels.chooseDate}>
        {weekdayNames.map((w) => (
          <div
            key={w}
            className="py-1 text-center font-mono text-[0.6rem] uppercase tracking-[0.14em] text-ivory/40"
          >
            {w}
          </div>
        ))}
        {cells.map((date, i) => {
          if (!date) return <div key={`e${i}`} aria-hidden="true" />;
          const state = dayState(date);
          const isSel = selected === date;
          const dayNum = Number(date.slice(8, 10));
          const base =
            "relative mx-auto grid size-10 place-items-center rounded-full text-sm transition-colors";
          if (state === "available")
            return (
              <button
                key={date}
                type="button"
                aria-pressed={isSel}
                aria-label={date}
                onClick={() => setSelected(date)}
                className={`${base} ${
                  isSel
                    ? "bg-sand font-semibold text-obsidian"
                    : "border border-sand/40 text-ivory hover:border-sand hover:bg-sand/10"
                }`}
              >
                {dayNum}
                {!isSel ? (
                  <span className="absolute bottom-1 size-1 rounded-full bg-sand" aria-hidden="true" />
                ) : null}
              </button>
            );
          if (state === "full" || state === "closed")
            return (
              <div
                key={date}
                className={`${base} text-ivory/25 line-through decoration-ivory/40`}
                title={state === "full" ? labels.full : labels.closed}
              >
                {dayNum}
              </div>
            );
          return (
            <div key={date} className={`${base} text-ivory/20`} aria-hidden="true">
              {dayNum}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-ivory/50">
        <span className="inline-flex items-center gap-2">
          <span className="size-2.5 rounded-full border border-sand/60" aria-hidden="true" />{" "}
          {labels.available}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-ivory/20" aria-hidden="true" /> {labels.full}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-ivory/10" aria-hidden="true" /> {labels.closed}
        </span>
      </div>

      <div className="rounded-3xl border border-ivory/10 bg-deep p-5 md:p-6">
        <div className="flex flex-col gap-4">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-ivory/50">
            {labels.guests}
          </p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setGuests((g) => Math.max(1, g - 1))}
              disabled={guests <= 1}
              aria-label="-"
              className="grid size-10 place-items-center rounded-full border border-ivory/15 text-ivory/70 transition-colors hover:border-sand hover:text-sand disabled:pointer-events-none disabled:opacity-30"
            >
              <Minus className="size-4" aria-hidden="true" />
            </button>
            <span className="flex min-w-10 items-center justify-center gap-2 font-display text-2xl text-ivory">
              <Users className="size-4 text-sand" aria-hidden="true" />
              {guests}
            </span>
            <button
              type="button"
              onClick={() => setGuests((g) => Math.min(capacityMax, g + 1))}
              disabled={guests >= capacityMax}
              aria-label="+"
              className="grid size-10 place-items-center rounded-full border border-ivory/15 text-ivory/70 transition-colors hover:border-sand hover:text-sand disabled:pointer-events-none disabled:opacity-30"
            >
              <Plus className="size-4" aria-hidden="true" />
            </button>
            <span className="text-sm text-ivory/50">≈ {formatPrice(estimate, locale)}</span>
          </div>

          {selected ? (
            <p className="text-sm text-sand" aria-live="polite">
              {selected}
              {selectedDay && left > 0 ? ` — ${left} ${labels.available}` : ""}
            </p>
          ) : (
            <p className="text-sm text-ivory/50">{labels.selectHint}</p>
          )}

          <Link
            href={
              selected
                ? `/book/${slug}?date=${selected}&guests=${guests}`
                : `#${labels.chooseDate}`
            }
            aria-disabled={!selected}
            onClick={(e) => {
              if (!selected) e.preventDefault();
            }}
            className={`inline-flex h-12 items-center justify-center rounded-full px-8 text-sm font-medium tracking-wide transition-all ${
              selected
                ? "bg-sand text-obsidian hover:bg-sand-bright active:scale-[0.98]"
                : "pointer-events-none bg-ivory/10 text-ivory/40"
            }`}
          >
            {labels.bookThisDate}
          </Link>
        </div>
      </div>
    </div>
  );
}
