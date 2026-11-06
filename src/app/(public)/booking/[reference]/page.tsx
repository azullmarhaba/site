import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Banknote, CalendarDays, CheckCircle2, MapPin, Users, XCircle } from "lucide-react";
import { getDict, getLocale } from "@/lib/i18n";
import { getBookingByReference } from "@/server/services/booking";
import { auth } from "@/lib/auth";
import { CancelBookingButton } from "@/components/booking/CancelBookingButton";
import { PrintButton } from "@/components/booking/PrintButton";
import { BookingBadge } from "@/components/booking/BookingBadge";
import { DownloadBadgeButton } from "@/components/booking/DownloadBadgeButton";
import { PdfLink } from "@/components/documents/PdfLink";
import { TrackEvent } from "@/components/analytics/TrackEvent";
import { Section } from "@/components/ui/Section";
import { formatDate, formatPrice } from "@/lib/format";

const REFERENCE_PATTERN = /^AZL-\d{4}-\d{6}$/;

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDict(await getLocale());
  return {
    title: dict.booking.successTitle,
    robots: { index: false, follow: false },
  };
}

const STATUS_TONE: Record<string, string> = {
  PAID: "border-sand/40 bg-sand/15 text-sand",
  CONFIRMED: "border-sand/40 bg-sand/15 text-sand",
  PENDING: "border-ivory/30 bg-ivory/10 text-ivory/70",
  COMPLETED: "border-atlas/40 bg-atlas/15 text-atlas",
  CANCELLED: "border-clay/40 bg-clay/15 text-clay",
  REFUNDED: "border-clay/40 bg-clay/15 text-clay",
};

export default async function BookingReferencePage(props: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await props.params;
  const locale = await getLocale();
  const dict = getDict(locale);
  const b = dict.booking;

  if (!REFERENCE_PATTERN.test(reference)) {
    return (
      <Section tone="obsidian">
        <div className="container-azul max-w-2xl text-center">
          <h1 className="text-3xl">{b.notFound}</h1>
          <Link href="/" className="mt-6 inline-block text-sand hover:underline">
            {b.backHome}
          </Link>
        </div>
      </Section>
    );
  }

  const booking = await getBookingByReference(reference);
  if (!booking) {
    return (
      <Section tone="obsidian">
        <div className="container-azul max-w-2xl text-center">
          <h1 className="text-3xl">{b.notFound}</h1>
          <Link href="/" className="mt-6 inline-block text-sand hover:underline">
            {b.backHome}
          </Link>
        </div>
      </Section>
    );
  }

  const session = await auth();
  const bookingTitle = booking.tourDate?.tour.title ?? booking.experience.title;
  const bookingCoverImage =
    booking.tourDate?.tour.coverImage ?? booking.experience.coverImage;
  const user = session?.user ?? null;
  const canCancel =
    user != null &&
    ["PENDING", "CONFIRMED"].includes(booking.status);
  const paid = booking.payments.filter((p) => p.status === "PAID");
  const cod = booking.payments.some((p) => p.provider === "CASH");
  const outstanding = Math.max(
    0,
    booking.totalMinor - paid.reduce((s, p) => s + p.amountMinor, 0)
  );

  const steps = [
    {
      icon: CalendarDays,
      label: b.date,
      value: `${formatDate(booking.date, locale)}${
        booking.tourDate?.startTime
          ? ` · ${booking.tourDate.startTime.toISOString().slice(11, 16)}`
          : ""
      }`,
    },
    { icon: Users, label: b.guestsLabel, value: `${booking.adults} + ${booking.children}` },
    {
      icon: MapPin,
      label: b.meetingPoint,
      value: booking.experience.meetingPoint ?? booking.pickupLocation?.name ?? "—",
    },
  ];

  return (
    <Section tone="obsidian">
      <div className="container-azul max-w-3xl">
        <TrackEvent name="booking_completed" props={{ status: booking.status }} />
        {/* Hero */}
        {booking.status === "CANCELLED" || booking.status === "REFUNDED" ? (
          <div className="rounded-[2rem] border border-ivory/10 bg-gradient-to-br from-deep via-carbon to-[#17130f] p-7 text-center md:p-12">
            <span
              className={`mx-auto inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.2em] ${
                STATUS_TONE[booking.status] ?? STATUS_TONE.PENDING
              }`}
            >
              <XCircle className="size-3.5" aria-hidden="true" />
              {booking.status}
            </span>
            <h1 className="mt-5 text-3xl md:text-4xl">{b.cancelled}</h1>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-ivory/60">
              {b.successLead}
            </p>
            <p className="mt-6 font-mono text-[0.68rem] uppercase tracking-[0.28em] text-ivory/45">
              {b.reference}
            </p>
            <p className="font-display text-3xl text-sand md:text-4xl">{booking.reference}</p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <PdfLink kind="cancellation" reference={booking.reference} label={dict.documents.downloadCancellation} tone="solid" />
              <PrintButton label={b.print} />
              <Link
                href="/"
                className="inline-flex h-11 items-center rounded-full border border-ivory/25 px-6 text-sm text-ivory transition-colors hover:border-sand hover:text-sand"
              >
                {b.backHome}
              </Link>
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-[2rem] border border-ivory/10 shadow-[0_40px_90px_rgba(0,0,0,0.45)]">
            {bookingCoverImage ? (
              <Image
                src={bookingCoverImage.path}
                alt={bookingCoverImage.alt ?? bookingTitle}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 768px"
                className="absolute inset-0 object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(201,155,109,0.22),transparent_45%),linear-gradient(135deg,#121a1e,#0d1417)]" aria-hidden="true" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/25" aria-hidden="true" />

            <div className="relative flex min-h-[460px] flex-col items-center justify-center p-7 text-center md:p-12">
              <span className="relative grid size-20 place-items-center rounded-full border border-sand/50 bg-sand/15 shadow-[0_0_50px_rgba(201,155,109,0.45)] backdrop-blur">
                <CheckCircle2 className="size-10 text-sand" aria-hidden="true" />
              </span>

              <span
                className={`mt-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.2em] ${
                  STATUS_TONE[booking.status] ?? STATUS_TONE.PENDING
                }`}
              >
                {booking.status}
              </span>

              <h1 className="mt-5 max-w-2xl text-3xl leading-tight md:text-5xl">
                {b.successTitle}
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-ivory/70 md:text-base">
                {b.successLead}
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-ivory/75">
                <span className="font-display text-lg text-sand">{bookingTitle}</span>
                <span aria-hidden="true" className="text-ivory/30">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-4 text-sand" aria-hidden="true" />
                  {formatDate(booking.date, locale)}
                  {booking.tourDate?.startTime
                    ? ` · ${booking.tourDate.startTime.toISOString().slice(11, 16)}`
                    : ""}
                </span>
              </div>

              <p className="mt-8 font-mono text-[0.68rem] uppercase tracking-[0.28em] text-ivory/45">
                {b.reference}
              </p>
              <p className="font-display text-3xl tracking-wide text-sand md:text-4xl">
                {booking.reference}
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <DownloadBadgeButton
                  data={{
                    reference: booking.reference,
                    status: booking.status,
                    date: booking.date.toISOString().split("T")[0],
                    departureTime: booking.tourDate?.startTime?.toISOString().slice(11, 16),
                    adults: booking.adults,
                    childCount: booking.children,
                    experienceTitle: bookingTitle,
                    coverImage: bookingCoverImage,
                    customerName: booking.customer.fullName,
                    customerEmail: booking.customer.user?.email ?? "",
                    discountMinor: booking.discountMinor,
                    totalMinor: booking.totalMinor,
                    currency: booking.currency,
                    couponCode: booking.coupon?.code ?? null,
                    couponPercentOff: booking.coupon?.percentOff ?? null,
                    locale,
                  }}
                  label={b.downloadBadge}
                  preparingLabel={b.badgePreparing}
                />
                <PdfLink kind="contract" reference={booking.reference} label={dict.documents.downloadContract} />
                {paid.length > 0 ? (
                  <PdfLink kind="invoice" reference={booking.reference} label={dict.documents.downloadInvoice} tone="solid" />
                ) : null}
                <PrintButton label={b.print} />
                <Link
                  href="/"
                  className="inline-flex h-11 items-center rounded-full border border-ivory/25 px-6 text-sm text-ivory transition-colors hover:border-sand hover:text-sand"
                >
                  {b.backHome}
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Booking Badge */}
        <div className="mt-8">
          <BookingBadge
            reference={booking.reference}
            status={booking.status}
            date={booking.date.toISOString().split("T")[0]}
            departureTime={booking.tourDate?.startTime?.toISOString().slice(11, 16)}
            adults={booking.adults}
            childCount={booking.children}
            experienceTitle={bookingTitle}
            coverImage={bookingCoverImage}
            customerName={booking.customer.fullName}
            customerEmail={booking.customer.user?.email ?? ""}
            discountMinor={booking.discountMinor}
            totalMinor={booking.totalMinor}
            currency={booking.currency}
            couponCode={booking.coupon?.code ?? null}
            couponPercentOff={booking.coupon?.percentOff ?? null}
            locale={locale}
          />
          {booking.status !== "CANCELLED" && booking.status !== "REFUNDED" ? (
            <div className="mt-5 flex flex-col items-center gap-2 text-center">
              <DownloadBadgeButton
                data={{
                  reference: booking.reference,
                  status: booking.status,
                  date: booking.date.toISOString().split("T")[0],
                  departureTime: booking.tourDate?.startTime?.toISOString().slice(11, 16),
                  adults: booking.adults,
                  childCount: booking.children,
                  experienceTitle: bookingTitle,
                  coverImage: bookingCoverImage,
                  customerName:booking.customer.fullName,
                  customerEmail: booking.customer.user?.email ?? "",
                  discountMinor: booking.discountMinor,
                  totalMinor: booking.totalMinor,
                  currency: booking.currency,
                  couponCode: booking.coupon?.code ?? null,
                  couponPercentOff: booking.coupon?.percentOff ?? null,
                  locale,
                }}
                label={b.downloadBadge}
                preparingLabel={b.badgePreparing}
                tone="outline"
              />
              <p className="text-xs text-ivory/45">{b.badgeHint}</p>
            </div>
          ) : null}
        </div>

        {/* Facts */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.label}
              className="rounded-3xl border border-ivory/10 bg-deep p-5"
            >
              <s.icon className="mb-3 size-4 text-sand" aria-hidden="true" />
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-ivory/45">
                {s.label}
              </p>
              <p className="mt-1 text-ivory">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Cash on Delivery */}
        {cod && outstanding > 0 ? (
          <div className="mt-6 flex flex-col gap-4 rounded-3xl border border-sand/30 bg-obsidian p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-sand/10 text-sand">
                <Banknote className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-display text-lg text-ivory">{b.payOnArrival}</p>
                <p className="mt-1 max-w-md text-sm leading-relaxed text-ivory/60">{b.payLead}</p>
              </div>
            </div>
            <div className="text-start sm:text-end">
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-ivory/45">
                {b.amountDueOnArrival}
              </p>
              <p className="font-display text-2xl text-sand">{formatPrice(outstanding, locale)}</p>
              <p className="text-xs text-ivory/45">{booking.currency}</p>
            </div>
          </div>
        ) : null}

        {/* What happens next */}
        <div className="mt-6 rounded-3xl border border-ivory/10 bg-deep p-6">
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-ivory/45">
            {b.whatsNext}
          </p>
          <ol className="mt-4 space-y-3">
            {[b.nextConfirm, b.nextReminder, cod ? b.nextPayment : b.nextInvoice].map(
              (item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-ivory/70">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-sand/40 font-mono text-[0.6rem] text-sand">
                    {i + 1}
                  </span>
                  {item}
                </li>
              )
            )}
          </ol>
        </div>

        {/* Experience + total */}
        <div className="mt-6 overflow-hidden rounded-3xl border border-ivory/10 bg-deep">
          <div className="flex flex-wrap items-center gap-5 p-6">
            {bookingCoverImage ? (
              <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-2xl">
                <Image
                  src={bookingCoverImage.path}
                  alt={bookingCoverImage.alt ?? bookingTitle}
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              </div>
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-ivory/45">
                {b.experience}
              </p>
              <p className="font-display text-lg text-ivory">{bookingTitle}</p>
              <p className="mt-1 text-xs text-ivory/50">{booking.customer.fullName}</p>
            </div>
            <div className="text-end">
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-ivory/45">
                {paid.length > 0 ? b.totalPaid : b.amountDueOnArrival}
              </p>
              <p className="font-display text-2xl text-sand">
                {formatPrice(paid.length > 0 ? paid.reduce((s, p) => s + p.amountMinor, 0) : outstanding, locale)}
              </p>
              <p className="text-xs text-ivory/45">{booking.currency}</p>
            </div>
          </div>
          {booking.pickupLocation || booking.pickupAddress ? (
            <div className="border-t border-ivory/10 px-6 py-4 text-sm text-ivory/60">
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-ivory/40">
                {b.pickup}
              </span>{" "}
              {booking.pickupAddress ?? booking.pickupLocation?.name}
              {booking.pickupLocation?.address ? ` — ${booking.pickupLocation.address}` : ""}
            </div>
          ) : null}
          <div className="border-t border-ivory/10 px-6 py-4">
            <p className="text-xs leading-relaxed text-ivory/45">
              {b.freeCancellation}: {booking.experience.cancelWindowHours} {dict.common.hours}
            </p>
          </div>
        </div>

        {canCancel ? (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-clay/25 bg-clay/5 p-5">
            <p className="text-sm text-ivory/60">{dict.account.cancelPolicy}</p>
            <CancelBookingButton
              reference={booking.reference}
              labels={{
                cancelBooking: b.cancelBooking,
                cancelConfirm: b.cancelConfirm,
                cancelled: b.cancelled,
                cancelTooLate: b.cancelTooLate,
                generic: dict.errors.serverBody,
              }}
            />
          </div>
        ) : null}
        {!user ? (
          <p className="mt-6 text-center text-sm text-ivory/50">
            <Link href={`/auth/login?callbackUrl=/booking/${reference}`} className="text-sand hover:underline">
              {dict.auth.submitSignIn}
            </Link>{" "}
            {dict.booking.myBookings.toLowerCase()}
          </p>
        ) : null}
      </div>
    </Section>
  );
}
