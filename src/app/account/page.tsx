import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck, Heart, Star, Ticket } from "lucide-react";
import { getDict, getLocale } from "@/lib/i18n";
import { requireUser } from "@/lib/auth/guards";
import { formatDate, formatPrice } from "@/lib/format";
import { getAccountStats, listUserBookings } from "@/server/services/account";
import { listNotifications } from "@/server/services/notifications";
import { EmptyState } from "@/components/ui/States";

export const metadata: Metadata = { robots: { index: false } };

const STATUS_TONE: Record<string, string> = {
  PENDING: "bg-sand/15 text-sand border-sand/30",
  CONFIRMED: "bg-atlas/15 text-atlas border-atlas/40",
  PAID: "bg-atlas/15 text-atlas border-atlas/40",
  COMPLETED: "bg-ivory/10 text-ivory/70 border-ivory/20",
  CANCELLED: "bg-clay/15 text-clay border-clay/40",
  REFUNDED: "bg-clay/15 text-clay border-clay/40",
};

export default async function AccountOverviewPage() {
  const user = await requireUser("/account");
  const locale = await getLocale();
  const dict = getDict(locale);
  const a = dict.account;

  const [stats, bookings, notifications] = await Promise.all([
    getAccountStats(user.id),
    listUserBookings(user.id),
    listNotifications(user.id, 5),
  ]);

  const now = new Date();
  const upcoming = bookings
    .filter(
      (b) =>
        b.date >= now && ["PENDING", "CONFIRMED", "PAID"].includes(b.status)
    )
    .slice(0, 3);
  const past = bookings.filter((b) => b.date < now).slice(0, 3);

  const cards = [
    { label: a.stats.bookings, value: stats.bookings, icon: Ticket },
    { label: a.stats.upcoming, value: stats.upcoming, icon: CalendarCheck },
    { label: a.stats.favorites, value: stats.favorites, icon: Heart },
    { label: a.stats.reviews, value: stats.reviews, icon: Star },
  ];

  return (
    <div className="space-y-10">
      {/* Stats */}
      <section aria-label={a.title} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-ivory/10 bg-ivory/[0.04] p-5"
          >
            <div className="flex items-center justify-between">
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-ivory/50">
                {c.label}
              </p>
              <c.icon className="size-4 text-sand" aria-hidden="true" />
            </div>
            <p className="mt-2 font-display text-4xl text-ivory">{c.value}</p>
          </div>
        ))}
      </section>

      {/* Upcoming */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl md:text-2xl">{a.upcoming}</h2>
          <Link href="/account/bookings" className="text-sm text-sand hover:underline">
            {dict.common.viewAll} →
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <EmptyState
            title={dict.booking.empty}
            action={
              <Link
                href="/experiences"
                className="text-sm text-sand hover:underline"
              >
                {dict.common.discover} →
              </Link>
            }
          />
        ) : (
          <ul className="space-y-3">
            {upcoming.map((b) => (
              <li
                key={b.id}
                className="flex flex-wrap items-center gap-4 rounded-2xl border border-ivory/10 bg-ivory/[0.04] p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-0.5 font-mono text-[0.56rem] uppercase tracking-[0.16em] ${STATUS_TONE[b.status] ?? STATUS_TONE.PENDING}`}>
                      {b.status}
                    </span>
                    <span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ivory/45">
                      {b.reference}
                    </span>
                  </div>
                  <p className="mt-1 truncate font-display text-lg text-ivory">
                    {b.experience.title}
                  </p>
                  <p className="text-sm text-ivory/55">
                    {formatDate(b.date, locale)} · {b.guests}{" "}
                    {dict.booking.guestsLabel.toLowerCase()}
                  </p>
                </div>
                <div className="text-end">
                  <p className="font-display text-lg text-sand">
                    {formatPrice(b.totalMinor, locale)}
                  </p>
                  <Link
                    href={`/booking/${b.reference}`}
                    className="text-sm text-sand hover:underline"
                  >
                    {dict.booking.viewBooking} →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Past */}
      {past.length > 0 ? (
        <section>
          <h2 className="mb-4 text-xl md:text-2xl">{a.past}</h2>
          <ul className="space-y-3">
            {past.map((b) => (
              <li
                key={b.id}
                className="flex flex-wrap items-center gap-4 rounded-2xl border border-ivory/10 bg-ivory/[0.03] p-4 opacity-80"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-lg text-ivory">
                    {b.experience.title}
                  </p>
                  <p className="text-sm text-ivory/50">
                    {formatDate(b.date, locale)} · {b.reference}
                  </p>
                </div>
                <Link
                  href={`/booking/${b.reference}`}
                  className="text-sm text-sand hover:underline"
                >
                  {dict.booking.viewBooking} →
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Recent notifications */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl md:text-2xl">{dict.account.nav.notifications}</h2>
          <Link
            href="/account/notifications"
            className="text-sm text-sand hover:underline"
          >
            {dict.common.viewAll} →
          </Link>
        </div>
        {notifications.length === 0 ? (
          <p className="text-sm text-ivory/55">{a.notificationsEmpty}</p>
        ) : (
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`rounded-xl border border-ivory/10 p-4 ${n.readAt ? "opacity-60" : "bg-ivory/[0.04]"}`}
              >
                <p className="text-sm font-medium text-ivory">{n.title}</p>
                {n.body ? <p className="mt-0.5 text-sm text-ivory/55">{n.body}</p> : null}
                <p className="mt-1 font-mono text-[0.56rem] uppercase tracking-[0.16em] text-ivory/40">
                  {formatDate(n.createdAt, locale)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
