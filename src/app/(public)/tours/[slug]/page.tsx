import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, Check, MapPin, Users } from "lucide-react";
import { notFound } from "next/navigation";
import { getDict, getLocale } from "@/lib/i18n";
import { getTour } from "@/server/services/catalog";
import { Section } from "@/components/ui/Section";
import { formatDate, formatPrice } from "@/lib/format";
import { siteConfig } from "@/config/site";

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const locale = await getLocale();
  const dict = getDict(locale);
  const data = await getTour(slug);
  if (!data) return { title: dict.errors.notFoundTitle };
  return {
    title: data.tour.title,
    description: data.tour.description.slice(0, 300),
    alternates: { canonical: `/tours/${data.tour.slug}` },
    openGraph: {
      title: data.tour.title,
      description: data.tour.description.slice(0, 200),
      images: data.tour.coverImage ? [{ url: data.tour.coverImage.path }] : undefined,
    },
  };
}

function strList(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

function tourBookingHref(experienceSlug: string, tourSlug: string, departureId: string, date: Date) {
  const params = new URLSearchParams({
    date: date.toISOString().slice(0, 10),
    tour: tourSlug,
    tourDateId: departureId,
  });
  return `/book/${experienceSlug}?${params.toString()}`;
}

export default async function TourDetailPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const locale = await getLocale();
  const dict = getDict(locale);
  const data = await getTour(slug);
  if (!data) notFound();

  const { tour, dates } = data;
  const t = dict.catalog.tours;
  const b = dict.booking;

  const highlights = strList(tour.experience.highlights);
  const includes = strList(tour.experience.includes);
  const nextDeparture = dates.find(
    (d) => d.capacityTotal - d.capacityBooked >= tour.experience.capacityMin,
  );

  return (
    <>
      {/* Hero */}
      <header className="relative flex min-h-[55vh] items-end overflow-hidden bg-obsidian pt-28 text-ivory">
        {tour.coverImage ? (
          <Image
            src={tour.coverImage.path}
            alt={tour.coverImage.alt ?? tour.title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/60 to-obsidian/30" />
        <div className="container-azul relative z-10 pb-14 md:pb-20">
          <Link
            href="/tours"
            className="mb-6 inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-ivory/60 transition-colors hover:text-sand"
          >
            <ArrowLeft className="size-3.5 rtl:rotate-180" aria-hidden="true" />
            {dict.catalog.destinations.backTo}
          </Link>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-sand">
            <span>{tour.destination.name}</span>
            <span className="text-ivory/60">{tour.destination.region}</span>
          </div>
          <h1 className="mt-3 max-w-4xl text-4xl md:text-5xl lg:text-6xl">{tour.title}</h1>
          <p className="mt-6 font-display text-3xl text-sand">
            {formatPrice(tour.priceMinor, locale)}{" "}
            <span className="text-base font-normal text-ivory/60">/ {b.perPerson}</span>
          </p>
          <Link
            href={
              nextDeparture
                ? tourBookingHref(
                    tour.experience.slug,
                    tour.slug,
                    nextDeparture.id,
                    nextDeparture.date,
                  )
                : "#departures"
            }
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-clay px-7 text-sm font-medium text-ivory transition-colors hover:bg-clay/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sand"
          >
            {dict.common.bookNow}
            <ArrowRight className="ms-2 size-4 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </div>
      </header>

      {/* Overview + departures */}
      <Section tone="ivory">
        <div className="container-azul grid gap-10 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-8">
            <div>
              <h2 className="mb-4 text-2xl md:text-3xl">{dict.catalog.experiences.detail.overview}</h2>
              <p className="whitespace-pre-line text-base leading-relaxed text-obsidian/80 md:text-lg">
                {tour.description}
              </p>
            </div>

            {highlights.length > 0 ? (
              <div>
                <h2 className="mb-4 text-2xl md:text-3xl">
                  {dict.catalog.experiences.detail.highlights}
                </h2>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {highlights.map((h) => (
                    <li key={h} className="flex items-start gap-3 text-obsidian/80">
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-sand/25 text-clay">
                        <Check className="size-3" aria-hidden="true" />
                      </span>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {includes.length > 0 ? (
              <div>
                <h2 className="mb-4 text-2xl md:text-3xl">
                  {dict.catalog.experiences.detail.includes}
                </h2>
                <ul className="space-y-2.5">
                  {includes.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-obsidian/75">
                      <Check className="mt-0.5 size-4 shrink-0 text-atlas" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {/* Departures card */}
          <aside className="h-fit space-y-5">
            <div className="rounded-3xl border border-obsidian/10 bg-white/70 p-6">
              <p className="font-display text-4xl text-clay">
                {formatPrice(tour.priceMinor, locale)}
              </p>
              <p className="mt-1 text-sm text-obsidian/55">
                {b.perPerson} · {b.freeCancellation}
              </p>
              <dl className="mt-5 space-y-3 border-t border-obsidian/10 pt-4 text-sm">
                <div className="flex items-start gap-3">
                  <CalendarDays className="mt-0.5 size-4 text-clay" aria-hidden="true" />
                  <div>
                    <dt className="font-mono text-[0.58rem] uppercase tracking-[0.16em] text-obsidian/45">
                      {t.departures}
                    </dt>
                    <dd className="text-obsidian">
                      {nextDeparture
                        ? formatDate(new Date(nextDeparture.date), locale)
                        : dict.common.comingSoon}
                    </dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="mt-0.5 size-4 text-clay" aria-hidden="true" />
                  <div>
                    <dt className="font-mono text-[0.58rem] uppercase tracking-[0.16em] text-obsidian/45">
                      {dict.admin.tours.seats}
                    </dt>
                    <dd className="text-obsidian">
                      {nextDeparture
                        ? `${nextDeparture.capacityTotal - nextDeparture.capacityBooked} / ${nextDeparture.capacityTotal}`
                        : `— / ${tour.capacity}`}
                    </dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 size-4 text-clay" aria-hidden="true" />
                  <div>
                    <dt className="font-mono text-[0.58rem] uppercase tracking-[0.16em] text-obsidian/45">
                      {dict.catalog.experiences.detail.meeting}
                    </dt>
                    <dd className="break-words text-obsidian">
                      {tour.experience.meetingPoint ?? tour.destination.name}
                    </dd>
                  </div>
                </div>
              </dl>
              {nextDeparture ? (
                <Link
                  href={tourBookingHref(
                    tour.experience.slug,
                    tour.slug,
                    nextDeparture.id,
                    nextDeparture.date,
                  )}
                  className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-clay px-8 text-sm font-medium text-ivory transition-all hover:brightness-110 active:scale-[0.98]"
                >
                  {dict.common.bookNow}
                </Link>
              ) : null}
              <Link
                href={`/experiences/${tour.experience.slug}`}
                className="mt-3 block text-center text-sm text-obsidian/60 hover:text-clay"
              >
                {dict.common.viewExperience} →
              </Link>
            </div>
          </aside>
        </div>
      </Section>

      {/* Upcoming departures */}
      <Section tone="deep" id="departures">
        <div className="container-azul">
          <h2 className="mb-6 text-2xl md:text-3xl">{t.departures}</h2>
          {dates.length === 0 ? (
            <p className="text-ivory/60">{dict.common.comingSoon}</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {dates.map((d) => {
                const left = d.capacityTotal - d.capacityBooked;
                const canBook = left >= tour.experience.capacityMin;
                return (
                  <li
                    key={d.id}
                    className={`rounded-2xl border p-4 ${
                      canBook
                        ? "border-sand/30 bg-obsidian/60"
                        : "border-ivory/10 bg-obsidian/40"
                    }`}
                  >
                    <p className="font-display text-lg text-ivory">
                      {formatDate(new Date(d.date), locale)}
                    </p>
                    <p className="mt-1 font-mono text-[0.58rem] uppercase tracking-[0.16em] text-ivory/45">
                      {d.startTime ? d.startTime.toISOString().slice(11, 16) : ""} ·{" "}
                      {canBook
                        ? `${left} ${t.seatsLeft}`
                        : dict.catalog.experiences.detail.full}
                    </p>
                    {canBook ? (
                      <Link
                        href={tourBookingHref(
                          tour.experience.slug,
                          tour.slug,
                          d.id,
                          d.date,
                        )}
                        className="mt-3 inline-flex min-h-11 items-center rounded-full border border-sand/40 px-4 text-sm text-sand transition-colors hover:bg-sand/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sand"
                      >
                        {dict.common.bookNow} →
                      </Link>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-6 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-ivory/40">
            {siteConfig.descriptor}
          </p>
        </div>
      </Section>
    </>
  );
}
