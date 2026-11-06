import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getDict, getLocale } from "@/lib/i18n";
import { formatDate, formatPrice } from "@/lib/format";
import {
  getAdminBooking,
  listAdminGuides,
  listAdminVehicles,
} from "@/server/services/admin";
import { AdminPanel } from "@/components/admin/AdminKit";
import { StatusPill } from "@/components/admin/StatusPill";
import { PdfLink } from "@/components/documents/PdfLink";
import {
  BookingActions,
  BookingNotes,
  BookingAssign,
} from "@/components/admin/BookingActions";

export const metadata: Metadata = { title: "Admin — Booking" };

export default async function AdminBookingDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const locale = await getLocale();
  const dict = getDict(locale);
  const b = dict.admin.bookings;

  const [booking, guides, vehicles] = await Promise.all([
    getAdminBooking(id),
    listAdminGuides(),
    listAdminVehicles(),
  ]);
  if (!booking) notFound();

  const paid = booking.payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.amountMinor, 0);

  const guideOptions = guides
    .filter((g) => g.active)
    .map((g) => ({ id: g.id, name: g.name }));
  const vehicleOptions = vehicles
    .filter((v) => v.active)
    .map((v) => ({ id: v.id, label: `${v.make} ${v.model} — ${v.plate ?? v.category.name}` }));

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/admin/bookings"
            className="mb-2 inline-flex items-center gap-1.5 text-sm text-ivory/55 hover:text-sand"
          >
            <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
            {b.title}
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-xl text-sand md:text-2xl">{booking.reference}</h1>
            <StatusPill status={booking.status} />
          </div>
        </div>
        <BookingActions
          bookingId={booking.id}
          status={booking.status}
          labels={{
            confirm: b.confirm,
            cancel: b.cancel,
            refund: b.refund,
            complete: b.complete,
            markPaid: b.markPaid,
          }}
        />
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <PdfLink kind="contract" reference={booking.reference} label={dict.documents.downloadContract} tone="solid" />
        {paid > 0 ? (
          <PdfLink kind="invoice" reference={booking.reference} label={dict.documents.downloadInvoice} />
        ) : null}
        {booking.status === "CANCELLED" || booking.status === "REFUNDED" ? (
          <PdfLink kind="cancellation" reference={booking.reference} label={dict.documents.downloadCancellation} />
        ) : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <AdminPanel title={dict.booking.details}>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-ivory/40">
                {b.customer}
              </dt>
              <dd className="text-ivory">
                {booking.customer.fullName}
                <span className="block text-ivory/55">{booking.customer.user.email}</span>
                <span className="block text-ivory/55">{booking.customer.phone ?? "—"}</span>
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-ivory/40">
                {b.experience}
              </dt>
              <dd className="text-ivory">
                {booking.tourDate ? (
                  <>
                    <Link
                      href="/admin/tours"
                      className="hover:text-sand"
                    >
                      {booking.tourDate.tour.title}
                    </Link>
                    <span className="block text-ivory/55">{booking.experience.title}</span>
                  </>
                ) : (
                  <Link
                    href={`/admin/experiences/${booking.experience.id}`}
                    className="hover:text-sand"
                  >
                    {booking.experience.title}
                  </Link>
                )}
                <span className="block text-ivory/55">
                  {formatDate(booking.date, locale)} · {booking.mode}
                </span>
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-ivory/40">
                {b.guests}
              </dt>
              <dd className="text-ivory">
                {booking.guests} ({booking.adults} + {booking.children})
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-ivory/40">
                {dict.booking.pickup}
              </dt>
              <dd className="break-words text-ivory">
                {booking.pickupLocation?.name ?? booking.pickupAddress ?? dict.booking.pickupNone}
              </dd>
            </div>
            {booking.specialRequests ? (
              <div className="sm:col-span-2">
                <dt className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-ivory/40">
                  {dict.booking.special}
                </dt>
                <dd className="text-ivory/70">{booking.specialRequests}</dd>
              </div>
            ) : null}
          </dl>
        </AdminPanel>

        <AdminPanel title={dict.booking.summary}>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-ivory/55">{dict.booking.subtotal}</dt>
              <dd className="text-ivory">{formatPrice(booking.subtotalMinor, locale)}</dd>
            </div>
            {booking.discountMinor > 0 ? (
              <div className="flex justify-between">
                <dt className="text-ivory/55">
                  {dict.booking.discount}
                  {booking.coupon ? ` · ${booking.coupon.code}` : ""}
                </dt>
                <dd className="text-atlas">−{formatPrice(booking.discountMinor, locale)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between">
              <dt className="text-ivory/55">{dict.booking.tax ?? "Tax"}</dt>
              <dd className="text-ivory">{formatPrice(booking.taxMinor, locale)}</dd>
            </div>
            <div className="flex justify-between border-t border-ivory/10 pt-2">
              <dt className="font-medium text-ivory">{b.total}</dt>
              <dd className="font-display text-lg text-sand">
                {formatPrice(booking.totalMinor, locale)}
              </dd>
            </div>
            <div className="flex justify-between pt-1">
              <dt className="text-ivory/55">{b.payment}</dt>
              <dd className="text-atlas">{formatPrice(paid, locale)}</dd>
            </div>
          </dl>

          <div className="mt-4 space-y-2 border-t border-ivory/10 pt-4">
            {booking.payments.length === 0 ? (
              <p className="text-sm text-ivory/45">{dict.common.empty}</p>
            ) : (
              booking.payments.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-ivory/10 px-3 py-2 text-sm"
                >
                  <span className="font-mono text-xs text-ivory/60">
                    {p.providerRef ?? p.provider}
                  </span>
                  <span className="text-ivory/70">{formatPrice(p.amountMinor, locale)}</span>
                  <StatusPill status={p.status} />
                </div>
              ))
            )}
          </div>
        </AdminPanel>

        <AdminPanel title={b.guide}>
          <BookingAssign
            bookingId={booking.id}
            guides={guideOptions}
            vehicles={vehicleOptions}
            initialGuideId={booking.guide?.id ?? ""}
            initialVehicleId={booking.vehicle?.id ?? ""}
            labels={{
              guide: b.guide,
              vehicle: b.vehicle,
              assign: b.assign,
              saved: dict.common.saved,
            }}
          />
          <div className="mt-3 text-sm text-ivory/55">
            {b.guide}: {booking.guide?.user.name ?? "—"} · {b.vehicle}:{" "}
            {booking.vehicle ? `${booking.vehicle.make} ${booking.vehicle.model}` : "—"}
          </div>
        </AdminPanel>

        <AdminPanel title={b.notes}>
          <BookingNotes
            bookingId={booking.id}
            initial={booking.internalNotes ?? ""}
            labels={{
              notes: b.notes,
              save: b.saveNotes,
              saved: dict.common.saved,
            }}
          />
        </AdminPanel>
      </div>
    </div>
  );
}
