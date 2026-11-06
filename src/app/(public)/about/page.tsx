import type { Metadata } from "next";
import { getDict, getLocale } from "@/lib/i18n";
import { prisma } from "@/lib/db/prisma";
import { getReviewStats } from "@/server/services/content";
import { Reveal } from "@/components/motion/Reveal";
import { Section, SectionHead } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/Button";
import { siteConfig } from "@/config/site";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDict(await getLocale());
  return {
    title: dict.about.title,
    description: dict.about.lead,
    alternates: { canonical: "/about" },
  };
}

export default async function AboutPage() {
  const locale = await getLocale();
  const dict = getDict(locale);
  const a = dict.about;

  const [experienceCount, destinationCount, tourCount, stats] = await Promise.all([
    prisma.experience.count({ where: { status: "PUBLISHED", deletedAt: null } }),
    prisma.destination.count({ where: { deletedAt: null } }),
    prisma.tour.count({ where: { status: "PUBLISHED", deletedAt: null } }),
    getReviewStats(),
  ]);

  const numbers = [
    { value: String(experienceCount), label: dict.home.hero.statExperiences },
    { value: String(destinationCount), label: dict.home.hero.statDestinations },
    { value: String(tourCount), label: dict.catalog.tours.title },
    { value: stats.average > 0 ? `${stats.average}/5` : "—", label: dict.home.hero.statRating },
  ];

  return (
    <>
      {/* Hero */}
      <header className="bg-obsidian pb-16 pt-32 text-ivory md:pb-20 md:pt-40">
        <div className="container-azul">
          <p className="eyebrow mb-4">{siteConfig.descriptor}</p>
          <h1 className="max-w-3xl text-4xl md:text-5xl lg:text-6xl">{a.title}</h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-ivory/65 md:text-lg">
            {a.lead}
          </p>
        </div>
      </header>

      {/* Story */}
      <Section tone="ivory">
        <div className="container-azul grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          <h2 className="text-3xl md:text-4xl">{a.storyTitle}</h2>
          <p className="whitespace-pre-line text-base leading-relaxed text-obsidian/80 md:text-lg">
            {a.story}
          </p>
        </div>
      </Section>

      {/* Values */}
      <Section tone="deep">
        <div className="container-azul">
          <SectionHead eyebrow={siteConfig.descriptor} title={a.valuesTitle} />
          <div className="grid gap-6 sm:grid-cols-2">
            {a.values.map((v, i) => (
              <Reveal key={v.title} delay={(i % 2) * 0.1}>
                <article className="h-full rounded-3xl border border-ivory/10 bg-obsidian/60 p-6">
                  <span className="font-display text-3xl text-sand/60" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-3 text-xl text-ivory">{v.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ivory/65">{v.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      {/* Numbers */}
      <Section tone="obsidian">
        <div className="container-azul">
          <SectionHead eyebrow={siteConfig.descriptor} title={a.numbersTitle} />
          <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {numbers.map((n) => (
              <div
                key={n.label}
                className="rounded-3xl border border-ivory/10 bg-deep p-6 text-center"
              >
                <dt className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-ivory/45">
                  {n.label}
                </dt>
                <dd className="mt-2 font-display text-4xl text-sand">{n.value}</dd>
              </div>
            ))}
          </dl>

          {/* CTA */}
          <div className="mt-14 rounded-[2rem] border border-ivory/10 bg-gradient-to-br from-deep via-carbon to-obsidian p-8 text-center md:p-14">
            <h2 className="text-3xl md:text-4xl">{a.ctaTitle}</h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-ivory/65">
              {a.ctaBody}
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <LinkButton href="/plan-my-trip" size="lg">
                {dict.planner.generate}
              </LinkButton>
              <LinkButton href="/contact" variant="outline" size="lg">
                {dict.contact.title}
              </LinkButton>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
