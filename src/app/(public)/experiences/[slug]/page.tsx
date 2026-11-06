import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarCheck,
  Check,
  Clock,
  Gauge,
  MapPin,
  Star,
  Users,
  X,
} from "lucide-react";
import { getDict, getLocale } from "@/lib/i18n";
import { getExperience } from "@/server/services/catalog";
import { ExperienceCard } from "@/components/catalog/ExperienceCard";
import { AvailabilityCalendar } from "@/components/catalog/AvailabilityCalendar";
import { Reveal } from "@/components/motion/Reveal";
import { Section, SectionHead } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { formatDuration, formatPrice } from "@/lib/format";
import { siteConfig } from "@/config/site";
import { TrackEvent } from "@/components/analytics/TrackEvent";
import { experienceJsonLd, JsonLdSlot } from "@/components/seo/JsonLd";

function strList(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

type ItinItem = { day?: number; title?: string; description?: string; duration?: string };

function itinList(v: unknown): ItinItem[] {
  return Array.isArray(v) ? (v as ItinItem[]) : [];
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const locale = await getLocale();
  const dict = getDict(locale);
  const data = await getExperience(slug);
  if (!data) return { title: dict.errors.notFoundTitle };
  const e = data.experience;
  return {
    title: e.seoTitle ?? `${e.title} — ${dict.catalog.experiences.title}`,
    description: e.seoDescription ?? e.summary ?? dict.catalog.experiences.lead,
    alternates: { canonical: `/experiences/${e.slug}` },
    openGraph: {
      title: e.title,
      description: e.summary ?? undefined,
      images: e.coverImage ? [{ url: e.coverImage.path }] : undefined,
    },
  };
}

export default async function ExperienceDetailPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const locale = await getLocale();
  const dict = getDict(locale);
  const data = await getExperience(slug);
  if (!data) notFound();

  const { experience: e, availability, reviews, related } = data;
  const d = dict.catalog.experiences.detail;
  const days = availability.map((a) => ({
    date: a.date.toISOString().slice(0, 10),
    capacityTotal: a.capacityTotal,
    capacityBooked: a.capacityBooked,
    closed: a.closed,
  }));

  const highlights = strList(e.highlights);
  const includes = strList(e.includes);
  const excludes = strList(e.excludes);
  const itinerary = itinList(e.itinerary);

  const hours = Math.floor(e.durationMinutes / 60);
  const minutes = e.durationMinutes % 60;
  const jsonLd = experienceJsonLd({
    url: `${siteConfig.url}/experiences/${e.slug}`,
    name: e.title,
    description: e.summary ?? e.description.slice(0, 300),
    priceMinor: e.priceMinor,
    currency: e.currency,
    ratingAvg: e.ratingAvg,
    ratingCount: e.ratingCount,
    durationISO8601: `PT${hours > 0 ? `${hours}H` : ""}${minutes > 0 ? `${minutes}M` : ""}`,
    image: e.coverImage?.path,
  });

  const facts = [
    { icon: Clock, label: d.duration, value: formatDuration(e.durationMinutes) },
    {
      icon: Gauge,
      label: d.difficulty,
      value:
        dict.catalog.experiences.detail.levels[
          e.difficulty as keyof typeof dict.catalog.experiences.detail.levels
        ] ?? e.difficulty,
    },
    { icon: Users, label: d.capacity, value: `${e.capacityMin}–${e.capacityMax}` },
    { icon: MapPin, label: d.meeting, value: e.meetingPoint ?? "—" },
  ];

  return (
    <>
      <JsonLdSlot data={jsonLd} />
      <TrackEvent name="experience_view" props={{ slug: e.slug }} />
      {/* Hero */}
      <header className="relative flex min-h-[60vh] items-end overflow-hidden bg-obsidian pt-28 text-ivory">
        {e.coverImage ? (
          <Image
            src={e.coverImage.path}
            alt={e.coverImage.alt ?? e.title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/60 to-obsidian/30" />
        <div className="container-azul relative z-10 pb-14 md:pb-20">
          <Link
            href="/experiences"
            className="mb-6 inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-ivory/60 transition-colors hover:text-sand"
          >
            <ArrowLeft className="size-3.5 rtl:rotate-180" aria-hidden="true" />
            {dict.catalog.destinations.backTo}
          </Link>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-sand">
            <span>{e.category.name}</span>
            <Link href={`/destinations/${e.destination.slug}`} className="hover:text-sand-bright">
              {e.destination.name}
            </Link>
            {e.ratingCount > 0 ? (
              <span className="inline-flex items-center gap-1 text-ivory/70">
                <Star className="size-3 fill-sand text-sand" aria-hidden="true" />
                {e.ratingAvg.toFixed(1)} ({e.ratingCount})
              </span>
            ) : null}
          </div>
          <h1 className="mt-3 max-w-4xl text-4xl md:text-5xl lg:text-6xl">{e.title}</h1>
          {e.summary ? (
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-ivory/75 md:text-lg">
              {e.summary}
            </p>
          ) : null}
          <p className="mt-6 font-display text-3xl text-sand">
            {formatPrice(e.priceMinor, locale)}{" "}
            <span className="text-base font-normal text-ivory/60">
              / {dict.home.experiences.perPerson}
            </span>
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <LinkButton
              href={`/book/${e.slug}`}
              variant="primary"
              size="lg"
              data-event="cta_clicked"
              data-track-id={`book:${e.slug}`}
            >
              <CalendarCheck className="size-4" aria-hidden="true" />
              {dict.common.bookNow}
            </LinkButton>
            <LinkButton href="#availability" variant="outline" size="lg">
              {d.availability}
            </LinkButton>
          </div>
        </div>
      </header>

      {/* Overview + facts */}
      <Section tone="ivory">
        <div className="container-azul grid gap-10 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-8">
            <div>
              <h2 className="mb-4 text-2xl md:text-3xl">{d.overview}</h2>
              <p className="whitespace-pre-line text-base leading-relaxed text-obsidian/80 md:text-lg">
                {e.description}
              </p>
            </div>
            {highlights.length > 0 ? (
              <div>
                <h2 className="mb-4 text-2xl md:text-3xl">{d.highlights}</h2>
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
          </div>

          <dl className="h-fit space-y-4 rounded-3xl border border-obsidian/10 bg-white/50 p-6">
            {facts.map((f) => (
              <div key={f.label} className="flex items-start gap-3">
                <f.icon className="mt-0.5 size-4 text-clay" aria-hidden="true" />
                <div className="min-w-0">
                  <dt className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-obsidian/50">
                    {f.label}
                  </dt>
                  <dd className="break-words text-obsidian">{f.value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </Section>

      {/* Itinerary + includes/excludes */}
      <Section tone="deep">
        <div className="container-azul space-y-12">
          {itinerary.length > 0 ? (
            <div>
              <h2 className="mb-6 text-2xl md:text-3xl">{d.itinerary}</h2>
              <ol className="space-y-5">
                {itinerary.map((step, i) => (
                  <li
                    key={i}
                    className="flex gap-5 rounded-3xl border border-ivory/10 bg-obsidian/50 p-6"
                  >
                    <span className="font-display text-3xl text-sand/70" aria-hidden="true">
                      {String(step.day ?? i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="text-lg text-ivory">{step.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-ivory/70">
                        {step.description}
                      </p>
                      {step.duration ? (
                        <p className="mt-2 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-sand">
                          {step.duration}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h2 className="mb-4 text-2xl md:text-3xl">{d.includes}</h2>
              <ul className="space-y-2.5">
                {includes.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-ivory/75">
                    <Check className="mt-0.5 size-4 shrink-0 text-atlas" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="mb-4 text-2xl md:text-3xl">{d.excludes}</h2>
              <ul className="space-y-2.5">
                {excludes.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-ivory/75">
                    <X className="mt-0.5 size-4 shrink-0 text-clay" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* Availability + booking */}
      <Section tone="obsidian" ariaLabelledBy="availability">
        <div className="container-azul">
          <SectionHead id="availability" eyebrow={siteConfig.descriptor} title={d.availability} />
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
                  chooseDate: d.chooseDate,
                  guests: d.guests,
                  bookThisDate: d.bookThisDate,
                  selectHint: d.selectHint,
                  closed: d.closed,
                  full: d.full,
                  available: d.available,
                  noAvailability: d.noAvailability,
                  prevMonth: d.prevMonth,
                  nextMonth: d.nextMonth,
                }}
              />
            </div>

            <aside className="h-fit space-y-5">
              <div className="rounded-3xl border border-sand/30 bg-sand/10 p-6">
                <p className="font-display text-4xl text-sand">
                  {formatPrice(e.priceMinor, locale)}
                </p>
                <p className="mt-1 text-sm text-ivory/60">
                  {d.fromPrice} · {d.perPerson}
                </p>
                <p className="mt-4 text-sm text-ivory/75">
                  {d.cancel}: {d.cancelValue.replace("{h}", String(e.cancelWindowHours))}
                </p>
                <LinkButton
                  href={`/book/${e.slug}`}
                  variant="dark"
                  size="md"
                  className="mt-5 w-full"
                  data-event="cta_clicked"
                  data-track-id={`book:${e.slug}`}
                >
                  <CalendarCheck className="size-4" aria-hidden="true" />
                  {dict.common.bookNow}
                </LinkButton>
              </div>
              <ul className="space-y-3 rounded-3xl border border-ivory/10 bg-deep p-6 text-sm text-ivory/75">
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-sand" aria-hidden="true" />
                  <span>
                    <span className="block font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ivory/40">
                      {d.meeting}
                    </span>
                    {e.meetingPoint ?? "—"}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Clock className="mt-0.5 size-4 shrink-0 text-sand" aria-hidden="true" />
                  <span>
                    <span className="block font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ivory/40">
                      {d.pickup}
                    </span>
                    {e.pickupIncluded
                      ? e.pickupNotes ?? "Included"
                      : dict.catalog.experiences.detail.excludes}
                  </span>
                </li>
              </ul>
            </aside>
          </div>
        </div>
      </Section>

      {/* Gallery */}
      {e.gallery.length > 0 ? (
        <Section tone="deep" className="!py-16 md:!py-20">
          <div className="container-azul">
            <h2 className="mb-6 text-2xl md:text-3xl">{d.gallery}</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {e.gallery.slice(0, 4).map((g, i) => (
                <div
                  key={i}
                  className={`relative overflow-hidden rounded-2xl ${i === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-[4/3]"}`}
                >
                  <Image
                    src={g.media.path}
                    alt={g.media.alt ?? e.title}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </Section>
      ) : null}

      {/* Reviews */}
      <Section tone="ivory">
        <div className="container-azul">
          <SectionHead
            as="h2"
            eyebrow={siteConfig.descriptor}
            title={d.reviews}
            lead={
              e.ratingCount > 0
                ? `${e.ratingAvg.toFixed(1)} / 5 · ${e.ratingCount}`
                : undefined
            }
          />
          {reviews.length === 0 ? (
            <EmptyState title={d.noReviews} />
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {reviews.map((r) => (
                <article key={r.id} className="rounded-3xl border border-obsidian/10 bg-white/60 p-6">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="font-medium text-obsidian">{r.customer.fullName}</p>
                    <span
                      className="flex items-center gap-0.5"
                      aria-label={`${r.rating}/5`}
                    >
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`size-4 ${i < r.rating ? "fill-sand text-sand" : "text-obsidian/20"}`}
                          aria-hidden="true"
                        />
                      ))}
                    </span>
                  </div>
                  {r.title ? (
                    <h3 className="mb-1 text-lg text-obsidian">{r.title}</h3>
                  ) : null}
                  <p className="text-sm leading-relaxed text-obsidian/75">{r.body}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </Section>

      {/* FAQ + related */}
      <Section tone="obsidian">
        <div className="container-azul space-y-14">
          {e.faqs.length > 0 ? (
            <div className="max-w-3xl">
              <h2 className="mb-6 text-2xl md:text-3xl">{d.faq}</h2>
              <div className="space-y-3">
                {e.faqs.map((f) => (
                  <details
                    key={f.id}
                    className="group rounded-2xl border border-ivory/10 bg-deep px-6 py-4 [&::-webkit-details-marker]:hidden"
                  >
                    <summary className="cursor-pointer list-none text-ivory marker:hidden">
                      {f.question}
                    </summary>
                    <p className="mt-3 text-sm leading-relaxed text-ivory/70">{f.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          ) : null}

          {related.length > 0 ? (
            <div>
              <SectionHead eyebrow={siteConfig.descriptor} title={d.related} />
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((exp, i) => (
                  <Reveal key={exp.id} delay={(i % 3) * 0.1}>
                    <ExperienceCard
                      experience={exp}
                      locale={locale}
                      perPerson={dict.home.experiences.perPerson}
                    />
                  </Reveal>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </Section>
    </>
  );
}
