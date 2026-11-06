import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, MapPin, Users } from "lucide-react";
import { getDict, getLocale } from "@/lib/i18n";
import { getExperience, getTour } from "@/server/services/catalog";
import { listPickupLocations } from "@/server/services/content";
import { auth } from "@/lib/auth";
import { AvailabilityCalendar } from "@/components/catalog/AvailabilityCalendar";
import { BookingForm } from "@/components/booking/BookingForm";
import { Section } from "@/components/ui/Section";
import { formatDuration, formatPrice } from "@/lib/format";
import { siteConfig } from "@/config/site";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function queryValue(value: string | string[] | undefined): string | null {
  return typeof value === "string" ? value : null;
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const locale = await getLocale();
  const dict = getDict(locale);
  const data = await getExperience(slug);
  if (!data) return { title: dict.errors.notFoundTitle };
  return {
    title: `${dict.booking.title} — ${data.experience.title}`,
    description: data.experience.summary ?? dict.booking.title,
    alternates: { canonical: `/book/${data.experience.slug}` },
    robots: { index: false, follow: true },
  };
}

export default async function BookPage(props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    date?: string | string[];
    guests?: string | string[];
    tour?: string | string[];
    tourDateId?: string | string[];
  }>;
}) {
  const { slug } = await props.params;
  const sp = await props.searchParams;
  const locale = await getLocale();
  const dict = getDict(locale);

  const tourSlug = queryValue(sp.tour);
  const tourDateId = queryValue(sp.tourDateId);
  const hasTourParams = sp.tour !== undefined || sp.tourDateId !== undefined;
  if (hasTourParams && (!tourSlug || !tourDateId)) notFound();

  const [data, tourData] = await Promise.all([
    getExperience(slug),
    tourSlug ? getTour(tourSlug) : Promise.resolve(null),
  ]);
  if (!data) notFound();

  const { experience: e, availability } = data;
  const b = dict.booking;

  const selectedDeparture =
    tourData?.tour.experience.slug === e.slug
      ? tourData.dates.find((departure) => departure.id === tourDateId)
      : undefined;
  if (hasTourParams && (!tourData || !selectedDeparture)) notFound();
  if (
    selectedDeparture &&
    selectedDeparture.capacityBooked >= selectedDeparture.capacityTotal
  ) {
    notFound();
  }

  const requestedDate = queryValue(sp.date);
  const date = selectedDeparture
    ? selectedDeparture.date.toISOString().slice(0, 10)
    : requestedDate && DATE_PATTERN.test(requestedDate)
      ? requestedDate
      : null;
  const departureTime = selectedDeparture?.startTime?.toISOString().slice(11, 16);
  const capacityMax =
    selectedDeparture && tourData
    ? Math.min(
        e.capacityMax,
        tourData.tour.capacity,
        selectedDeparture.capacityTotal - selectedDeparture.capacityBooked,
      )
    : e.capacityMax;
  const requestedGuests = Number(queryValue(sp.guests));
  const guests = Number.isFinite(requestedGuests)
    ? Math.min(Math.max(Math.trunc(requestedGuests), 1), capacityMax)
    : Math.min(Math.max(e.capacityMin, 1), capacityMax);

  const [session, pickupLocations] = await Promise.all([auth(), listPickupLocations()]);
  const user = session?.user ?? null;

  const days = availability.map((a) => ({
    date: a.date.toISOString().slice(0, 10),
    capacityTotal: a.capacityTotal,
    capacityBooked: a.capacityBooked,
    closed: a.closed,
  }));

  return (
    <Section tone="obsidian">
      <div className="container-azul">
        <div className="relative mb-8 overflow-hidden rounded-[2rem] border border-ivory/10 bg-[radial-gradient(circle_at_top,_rgba(201,155,109,0.18),_transparent_38%),linear-gradient(135deg,#121a1e,#0d1417)] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)] md:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_30%,rgba(255,255,255,0.04)_50%,transparent_70%)]" aria-hidden="true" />
          <div className="relative flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0">
              <Link
                href={tourData ? `/tours/${tourData.tour.slug}` : `/experiences/${e.slug}`}
                className="mb-4 inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-ivory/60 transition-colors hover:text-sand"
              >
                <ArrowLeft className="size-3.5 rtl:rotate-180" aria-hidden="true" />
                {dict.common.back}
              </Link>
              <p className="eyebrow mb-3">{siteConfig.descriptor}</p>
              <h1 className="max-w-3xl text-3xl md:text-4xl">
                {selectedDeparture && tourData ? tourData.tour.title : b.title}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ivory/60">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-4 text-sand" aria-hidden="true" />
                  {formatDuration(e.durationMinutes)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="size-4 text-sand" aria-hidden="true" />
                  {e.capacityMin}–{e.capacityMax}
                </span>
                {e.meetingPoint ? (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-4 text-sand" aria-hidden="true" />
                    {e.meetingPoint}
                  </span>
                ) : null}
                <span className="font-display text-xl text-sand">
                  {formatPrice(tourData && selectedDeparture ? tourData.tour.priceMinor : e.priceMinor, locale)}{" "}
                  <span className="text-xs font-normal text-ivory/50">/ {b.perPerson}</span>
                </span>
              </div>
            </div>

            {selectedDeparture && tourData ? (
              <div className="relative hidden h-32 w-52 shrink-0 overflow-hidden rounded-[1.5rem] border border-ivory/10 shadow-[0_18px_40px_rgba(0,0,0,0.25)] sm:block">
                <Image
                  src={tourData.tour.coverImage?.path ?? e.coverImage?.path ?? "/images/placeholders/kasbah.svg"}
                  alt={tourData.tour.coverImage?.alt ?? e.coverImage?.alt ?? tourData.tour.title}
                  fill
                  sizes="208px"
                  className="object-cover"
                />
              </div>
            ) : e.coverImage ? (
              <div className="relative hidden h-32 w-52 shrink-0 overflow-hidden rounded-[1.5rem] border border-ivory/10 shadow-[0_18px_40px_rgba(0,0,0,0.25)] sm:block">
                <Image
                  src={e.coverImage.path}
                  alt={e.coverImage.alt ?? e.title}
                  fill
                  sizes="208px"
                  className="object-cover"
                />
              </div>
            ) : null}
          </div>
        </div>

        {date ? (
          <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
            <div className="rounded-[2rem] border border-ivory/10 bg-[linear-gradient(180deg,rgba(12,17,20,0.96),rgba(13,17,19,0.82))] p-4 md:p-6">
              <BookingForm
                labels={b}
                experience={{
                  slug: e.slug,
                  title: tourData && selectedDeparture ? tourData.tour.title : e.title,
                  priceMinor: tourData && selectedDeparture ? tourData.tour.priceMinor : e.priceMinor,
                  currency: e.currency,
                  capacityMin: e.capacityMin,
                  capacityMax,
                  cancelWindowHours: e.cancelWindowHours,
                  meetingPoint: e.meetingPoint,
                  pickupIncluded: e.pickupIncluded,
                }}
                pickupLocations={pickupLocations}
                date={date}
                guests={guests}
                locale={locale}
                tourDateId={selectedDeparture?.id}
                departureTime={departureTime}
                backHref={tourData ? `/tours/${tourData.tour.slug}` : undefined}
                backLabel={tourData ? dict.common.back : undefined}
                prefilled={
                  user
                    ? { name: user.name ?? "", email: user.email ?? "", phone: "" }
                    : null
                }
              />
            </div>

            <aside className="h-fit space-y-4 rounded-[2rem] border border-ivory/10 bg-[linear-gradient(180deg,rgba(18,22,27,0.96),rgba(12,16,20,0.85))] p-6 text-sm text-ivory/70 shadow-[0_25px_60px_rgba(0,0,0,0.25)]">
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-ivory/45">
                {b.experience}
              </p>
              <p className="font-display text-lg text-ivory">
                {tourData && selectedDeparture ? tourData.tour.title : e.title}
              </p>
              <dl className="space-y-2 border-t border-ivory/10 pt-4">
                <div className="flex justify-between gap-4">
                  <dt>{b.date}</dt>
                  <dd className="text-ivory">
                    {date}{departureTime ? ` · ${departureTime}` : ""}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>{b.guests}</dt>
                  <dd className="text-ivory">{guests}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>{b.perPerson}</dt>
                  <dd className="text-sand">
                    {formatPrice(tourData && selectedDeparture ? tourData.tour.priceMinor : e.priceMinor, locale)}
                  </dd>
                </div>
              </dl>
              <p className="border-t border-ivory/10 pt-4 text-xs text-ivory/50">
                {b.freeCancellation} — {e.cancelWindowHours} {dict.common.hours}
              </p>
              <Link
                href={tourData ? `/tours/${tourData.tour.slug}` : `/experiences/${e.slug}`}
                className="inline-block font-mono text-[0.62rem] uppercase tracking-[0.18em] text-sand hover:underline"
              >
                {b.chooseDate}
              </Link>
            </aside>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-3xl border border-ivory/10 bg-deep p-5 md:p-8">
              <AvailabilityCalendar
                slug={e.slug}
                days={days}
                locale={locale}
                priceMinor={e.priceMinor}
                capacityMin={e.capacityMin}
                capacityMax={e.capacityMax}
                labels={{
                  chooseDate: b.chooseDate,
                  guests: b.guests,
                  bookThisDate: dict.common.bookNow,
                  selectHint: b.noDate,
                  closed: dict.catalog.experiences.detail.closed,
                  full: dict.catalog.experiences.detail.full,
                  available: dict.catalog.experiences.detail.available,
                  noAvailability: dict.catalog.experiences.detail.noAvailability,
                  prevMonth: dict.catalog.experiences.detail.prevMonth,
                  nextMonth: dict.catalog.experiences.detail.nextMonth,
                }}
              />
            </div>
            <aside className="h-fit space-y-4 rounded-3xl border border-ivory/10 bg-obsidian p-6 text-sm text-ivory/70">
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-ivory/45">
                {b.steps.date}
              </p>
              <p className="font-display text-lg text-ivory">{e.title}</p>
              {e.summary ? <p className="text-xs leading-relaxed text-ivory/55">{e.summary}</p> : null}
              <p className="border-t border-ivory/10 pt-4 font-display text-3xl text-sand">
                {formatPrice(e.priceMinor, locale)}
              </p>
              <p className="text-xs text-ivory/50">{b.freeCancellation}</p>
            </aside>
          </div>
        )}
      </div>
    </Section>
  );
}
