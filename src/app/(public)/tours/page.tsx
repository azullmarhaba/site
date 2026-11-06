import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { getDict, getLocale } from "@/lib/i18n";
import { listTours, type TourCardData } from "@/server/services/catalog";
import { Reveal } from "@/components/motion/Reveal";
import { Section, SectionHead } from "@/components/ui/Section";
import { EmptyState } from "@/components/ui/States";
import { formatDate, formatPrice } from "@/lib/format";
import { siteConfig } from "@/config/site";

function tourBookingHref(tour: TourCardData, departureId?: string, date?: Date) {
  if (!departureId || !date) return `/tours/${tour.slug}#departures`;
  const params = new URLSearchParams({
    date: date.toISOString().slice(0, 10),
    tour: tour.slug,
    tourDateId: departureId,
  });
  return `/book/${tour.experience.slug}?${params.toString()}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDict(await getLocale());
  return {
    title: dict.catalog.tours.title,
    description: dict.catalog.tours.lead,
    alternates: { canonical: "/tours" },
  };
}

export default async function ToursPage() {
  const locale = await getLocale();
  const dict = getDict(locale);
  const t = dict.catalog.tours;
  const tours = await listTours();

  return (
    <Section tone="obsidian">
      <div className="container-azul">
        <SectionHead as="h1" eyebrow={siteConfig.descriptor} title={t.title} lead={t.lead} />

        {tours.length === 0 ? (
          <EmptyState title={t.empty} />
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {tours.map((tour, i) => {
              const next = tour.dates.find(
                (dt) =>
                  dt.capacityTotal - dt.capacityBooked >= tour.experience.capacityMin,
              );
              const seatsLeft = next ? next.capacityTotal - next.capacityBooked : 0;
              return (
                <Reveal key={tour.id} delay={(i % 2) * 0.1}>
                  <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-ivory/10 bg-obsidian transition-colors hover:border-sand/50">
                    <Link href={`/tours/${tour.slug}`} className="group flex flex-1 flex-col">
                      <div className="relative aspect-[16/9] overflow-hidden">
                        <Image
                          src={tour.coverImage?.path ?? "/images/placeholders/kasbah.svg"}
                          alt={tour.coverImage?.alt ?? tour.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-obsidian/70 via-transparent to-transparent" />
                        <span className="absolute start-4 top-4 rounded-full border border-ivory/25 bg-obsidian/70 px-3 py-1 font-mono text-[0.58rem] uppercase tracking-[0.2em] text-ivory/80 backdrop-blur">
                          {tour.destination.name}
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col gap-3 p-6">
                        <h2 className="text-xl leading-snug transition-colors group-hover:text-sand">
                          {tour.title}
                        </h2>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ivory/50">
                          {next ? (
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarDays className="size-3 text-sand" aria-hidden="true" />
                              {formatDate(new Date(next.date), locale)}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarDays className="size-3 text-sand" aria-hidden="true" />
                              {tour.dates.length > 0
                                ? dict.catalog.experiences.detail.full
                                : dict.common.comingSoon}
                            </span>
                          )}
                          {next ? (
                            <span className="inline-flex items-center gap-1.5">
                              <Users className="size-3 text-sand" aria-hidden="true" />
                              {seatsLeft} {t.seatsLeft}
                            </span>
                          ) : null}
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="size-3 text-sand" aria-hidden="true" />
                            {tour.experience.durationMinutes
                              ? `${Math.round(tour.experience.durationMinutes / 60)} h`
                              : ""}
                          </span>
                        </div>
                        <p className="mt-auto border-t border-ivory/10 pt-4 text-sm text-ivory/50">
                          <span className="font-display text-lg text-sand">
                            {formatPrice(tour.priceMinor, locale)}
                          </span>{" "}
                          / {t.perPerson}
                        </p>
                      </div>
                    </Link>
                    <div className="px-6 pb-6">
                      <Link
                        href={tourBookingHref(tour, next?.id, next?.date)}
                        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-clay px-6 text-sm font-medium text-ivory transition-colors hover:bg-clay/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sand"
                      >
                        {dict.common.bookNow}
                      </Link>
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>
    </Section>
  );
}
