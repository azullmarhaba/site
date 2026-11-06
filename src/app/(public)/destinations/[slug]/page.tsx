import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Compass, Sparkles } from "lucide-react";
import { getDict, getLocale } from "@/lib/i18n";
import { getDestination } from "@/server/services/catalog";
import { ExperienceCard } from "@/components/catalog/ExperienceCard";
import { Reveal } from "@/components/motion/Reveal";
import { Section, SectionHead } from "@/components/ui/Section";
import { EmptyState } from "@/components/ui/States";
import { LinkButton } from "@/components/ui/Button";
import { formatDate, formatPrice } from "@/lib/format";
import { siteConfig } from "@/config/site";

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const locale = await getLocale();
  const dict = getDict(locale);
  const data = await getDestination(slug);
  if (!data) return { title: dict.errors.notFoundTitle };
  const { destination } = data;
  return {
    title: destination.seoTitle ?? `${destination.name} — ${dict.catalog.destinations.title}`,
    description: destination.seoDescription ?? destination.shortIntro ?? dict.catalog.destinations.lead,
    alternates: { canonical: `/destinations/${destination.slug}` },
  };
}

export default async function DestinationDetailPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const locale = await getLocale();
  const dict = getDict(locale);
  const data = await getDestination(slug);
  if (!data) notFound();

  const { destination, experiences, tours, gallery } = data;
  const t = dict.catalog.destinations;
  const images = gallery.map((g) => g.media).filter(Boolean);

  return (
    <>
      {/* Hero */}
      <header className="relative flex min-h-[55vh] items-end overflow-hidden bg-obsidian pt-28 text-ivory">
        {destination.coverImage ? (
          <Image
            src={destination.coverImage.path}
            alt={destination.coverImage.alt ?? destination.name}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/60 to-obsidian/30" />
        <div className="container-azul relative z-10 pb-14 md:pb-20">
          <Link
            href="/destinations"
            className="mb-6 inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-ivory/60 transition-colors hover:text-sand"
          >
            <ArrowLeft className="size-3.5 rtl:rotate-180" aria-hidden="true" />
            {t.backTo}
          </Link>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-sand">
            {destination.region ? <span>{destination.region}</span> : null}
            <span>
              {destination._count.experiences} {t.countExperiences}
            </span>
          </div>
          <h1 className="mt-3 max-w-3xl text-4xl md:text-5xl lg:text-6xl">{destination.name}</h1>
          {destination.shortIntro ? (
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-ivory/75 md:text-lg">
              {destination.shortIntro}
            </p>
          ) : null}
        </div>
      </header>

      {/* Facts + description */}
      <Section tone="ivory">
        <div className="container-azul grid gap-10 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-5">
            <p className="eyebrow !text-clay">{t.title}</p>
            <p className="whitespace-pre-line text-base leading-relaxed text-obsidian/80 md:text-lg">
              {destination.description}
            </p>
          </div>
          <dl className="h-fit space-y-4 rounded-3xl border border-obsidian/10 bg-white/50 p-6">
            <div className="flex items-start gap-3">
              <Compass className="mt-0.5 size-4 text-clay" aria-hidden="true" />
              <div>
                <dt className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-obsidian/50">
                  {t.region}
                </dt>
                <dd className="text-obsidian">{destination.region ?? "—"}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 size-4 text-clay" aria-hidden="true" />
              <div>
                <dt className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-obsidian/50">
                  {t.bestSeason}
                </dt>
                <dd className="text-obsidian">{destination.bestSeason ?? "—"}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 size-4 text-clay" aria-hidden="true" />
              <div>
                <dt className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-obsidian/50">
                  {t.suggested}
                </dt>
                <dd className="text-obsidian">{destination.duration ?? "—"}</dd>
              </div>
            </div>
          </dl>
        </div>
      </Section>

      {/* Experiences */}
      <Section tone="obsidian">
        <div className="container-azul">
          <SectionHead
            eyebrow={siteConfig.descriptor}
            title={t.viewExperiences}
            action={
              <LinkButton href={`/experiences?destination=${destination.slug}`} variant="outline" size="md">
                {dict.catalog.experiences.title}
              </LinkButton>
            }
          />
          {experiences.length === 0 ? (
            <EmptyState title={dict.catalog.experiences.empty} />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {experiences.map((exp, i) => (
                <Reveal key={exp.id} delay={(i % 3) * 0.1}>
                  <ExperienceCard
                    experience={exp}
                    locale={locale}
                    perPerson={dict.home.experiences.perPerson}
                  />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </Section>

      {/* Gallery */}
      {images.length > 0 ? (
        <Section tone="deep" className="!py-16 md:!py-20">
          <div className="container-azul">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {images.slice(0, 4).map((img, i) => (
                <div
                  key={i}
                  className={`relative overflow-hidden rounded-2xl ${i === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-[4/3]"}`}
                >
                  <Image
                    src={img.path}
                    alt={img.alt ?? destination.name}
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

      {/* Tours */}
      {tours.length > 0 ? (
        <Section tone="ivory">
          <div className="container-azul">
            <SectionHead
              as="h2"
              eyebrow={siteConfig.descriptor}
              title={dict.catalog.tours.title}
              lead={dict.catalog.tours.lead}
              action={
                <LinkButton href="/tours" variant="outline-dark" size="md">
                  {dict.catalog.tours.backTo}
                </LinkButton>
              }
            />
            <div className="grid gap-6 md:grid-cols-2">
              {tours.map((tour) => (
                <Link
                  key={tour.id}
                  href={`/tours/${tour.slug}`}
                  className="group flex gap-4 rounded-3xl border border-obsidian/10 bg-white/60 p-4 transition-colors hover:border-sand"
                >
                  <div className="relative aspect-square w-28 shrink-0 overflow-hidden rounded-2xl md:w-36">
                    <Image
                      src={tour.coverImage?.path ?? "/images/placeholders/kasbah.svg"}
                      alt={tour.coverImage?.alt ?? tour.title}
                      fill
                      sizes="160px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex min-w-0 flex-col gap-1">
                    <h3 className="truncate text-lg text-obsidian transition-colors group-hover:text-clay">
                      {tour.title}
                    </h3>
                    <p className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-obsidian/50">
                      {dict.catalog.tours.date}:{" "}
                      {tour.dates[0] ? formatDate(new Date(tour.dates[0].date), locale) : "—"}
                    </p>
                    <p className="mt-auto text-sm font-medium text-obsidian">
                      {formatPrice(tour.priceMinor, locale)}{" "}
                      <span className="font-normal text-obsidian/50">
                        / {dict.catalog.tours.perPerson}
                      </span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </Section>
      ) : null}
    </>
  );
}
