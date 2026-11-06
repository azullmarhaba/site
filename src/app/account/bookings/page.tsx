import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { FileText } from "lucide-react";
import { getDict, getLocale } from "@/lib/i18n";
import { requireUser } from "@/lib/auth/guards";
import { formatDate, formatPrice } from "@/lib/format";
import { listUserBookings } from "@/server/services/account";
import { CancelBookingButton } from "@/components/booking/CancelBookingButton";
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

export default async function AccountBookingsPage() {
  const user = await requireUser("/account/bookings");
  const locale = await getLocale();
  const dict = getDict(locale);
  const bookings = await listUserBookings(user.id);
  const now = new Date();

  const active = bookings.filter(
    (b) => b.date >= now && ["PENDING", "CONFIRMED", "PAID"].includes(b.status)
  );
  const rest = bookings.filter((b) => !active.includes(b));

  function bookingRow(b: (typeof bookings)[number], cancellable: boolean) {
    const bookingTitle = b.tourDate?.tour.title ?? b.experience.title;
    const coverImage = b.tourDate?.tour.coverImage ?? b.experience.coverImage;
    const canCancel =
      cancellable &&
      ["PENDING", "CONFIRMED", "PAID"].includes(b.status) &&
      b.experience.cancelWindowHours !== null;
    return (
      <li
        key={b.id}
        className="flex flex-wrap items-center gap-4 rounded-2xl border border-ivory/10 bg-ivory/[0.04] p-4"
      >
        <div className="relative size-16 shrink-0 overflow-hidden rounded-xl">
          {coverImage ? (
            <Image
              src={coverImage.path}
              alt={coverImage.alt ?? bookingTitle}
              fill
              sizes="64px"
              className="object-cover"
            />
          ) : (
            <div className="grid size-full place-items-center bg-ivory/10 text-ivory/40">
              ✈
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-0.5 font-mono text-[0.56rem] uppercase tracking-[0.16em] ${
                STATUS_TONE[b.status] ?? STATUS_TONE.PENDING
              }`}
            >
              {b.status}
            </span>
            <span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ivory/45">
              {b.reference}
            </span>
            {b.mode === "PRIVATE" ? (
              <span className="rounded-full border border-ivory/20 px-2.5 py-0.5 font-mono text-[0.56rem] uppercase tracking-[0.16em] text-ivory/60">
                {dict.booking.private}
              </span>
            ) : null}
          </div>
          <p className="mt-1 truncate font-display text-lg text-ivory">
            {bookingTitle}
          </p>
          <p className="text-sm text-ivory/55">
            {formatDate(b.date, locale)} · {b.adults} {dict.booking.adults}
            {b.children > 0 ? ` + ${b.children} ${dict.booking.children}` : ""}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <p className="font-display text-lg text-sand">
            {formatPrice(b.totalMinor, locale)}
          </p>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <a
              href={`/api/documents/contract/${encodeURIComponent(b.reference)}`}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1 text-sm text-ivory/70 hover:text-sand"
            >
              <FileText className="size-3.5" aria-hidden="true" />
              {dict.documents.downloadContract}
            </a>
            <Link
              href={`/booking/${b.reference}`}
              className="text-sm text-sand hover:underline"
            >
              {dict.booking.viewBooking}
            </Link>
            {canCancel ? (
              <CancelBookingButton
                reference={b.reference}
                labels={{
                  cancelBooking: dict.booking.cancelBooking,
                  cancelConfirm: dict.booking.cancelConfirm,
                  cancelled: dict.booking.cancelled,
                  cancelTooLate: dict.booking.cancelTooLate,
                  generic: dict.common.error,
                }}
              />
            ) : null}
          </div>
        </div>
      </li>
    );
  }

  if (bookings.length === 0) {
    return (
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
    );
  }

  return (
    <div className="space-y-10">
      {active.length > 0 ? (
        <section>
          <h2 className="mb-4 text-xl md:text-2xl">{dict.account.upcoming}</h2>
          <ul className="space-y-3">{active.map((b) => bookingRow(b, true))}</ul>
        </section>
      ) : null}
      <section>
        <h2 className="mb-4 text-xl md:text-2xl">{dict.account.past}</h2>
        {rest.length === 0 ? (
          <p className="text-sm text-ivory/55">{dict.common.empty}</p>
        ) : (
          <ul className="space-y-3 opacity-90">
            {rest.map((b) => bookingRow(b, false))}
          </ul>
        )}
      </section>
    </div>
  );
}
