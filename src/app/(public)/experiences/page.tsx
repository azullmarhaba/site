import type { Metadata } from "next";
import Link from "next/link";
import { getDict, getLocale } from "@/lib/i18n";
import { listCategories, listDestinations, listExperiences, type ExperienceSort } from "@/server/services/catalog";
import { ExperienceCard } from "@/components/catalog/ExperienceCard";
import { Reveal } from "@/components/motion/Reveal";
import { Section, SectionHead } from "@/components/ui/Section";
import { EmptyState } from "@/components/ui/States";
import { siteConfig } from "@/config/site";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDict(await getLocale());
  return {
    title: dict.catalog.experiences.title,
    description: dict.catalog.experiences.lead,
    alternates: { canonical: "/experiences" },
  };
}

const SORTS: ExperienceSort[] = ["featured", "priceAsc", "priceDesc", "rating"];

function buildQuery(params: { category?: string; destination?: string; sort?: string }, patch: Partial<{ category: string; destination: string; sort: string }>) {
  const next = { ...params, ...patch };
  const q = new URLSearchParams();
  if (next.category) q.set("category", next.category);
  if (next.destination) q.set("destination", next.destination);
  if (next.sort && next.sort !== "featured") q.set("sort", next.sort);
  const s = q.toString();
  return s ? `?${s}` : "/experiences";
}

export default async function ExperiencesPage(props: {
  searchParams: Promise<{ category?: string; destination?: string; sort?: string }>;
}) {
  const sp = await props.searchParams;
  const locale = await getLocale();
  const dict = getDict(locale);
  const d = dict.catalog.experiences;

  const sort: ExperienceSort = SORTS.includes(sp.sort as ExperienceSort)
    ? (sp.sort as ExperienceSort)
    : "featured";

  const [data, categories, destinations] = await Promise.all([
    listExperiences({ category: sp.category, destination: sp.destination, sort }),
    listCategories(),
    listDestinations(),
  ]);

  const sortLabels: Record<ExperienceSort, string> = {
    featured: d.sortFeatured,
    priceAsc: d.sortPriceAsc,
    priceDesc: d.sortPriceDesc,
    rating: d.sortRating,
  };

  const hasFilters = Boolean(sp.category || sp.destination);

  const pill = (active: boolean) =>
    `rounded-full border px-4 py-1.5 text-xs transition-colors ${
      active
        ? "border-sand bg-sand text-obsidian"
        : "border-ivory/15 text-ivory/65 hover:border-sand hover:text-sand"
    }`;

  return (
    <Section tone="obsidian">
      <div className="container-azul">
        <SectionHead as="h1" eyebrow={siteConfig.descriptor} title={d.title} lead={d.lead} />

        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-wrap items-center gap-2" aria-label={d.filters}>
            <span className="me-1 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-ivory/40">
              {d.filters}
            </span>
            <a href={buildQuery(sp, { category: "" })} className={pill(!sp.category)}>
              {d.allCategories}
            </a>
            {categories.map((c) => (
              <a
                key={c.slug}
                href={buildQuery(sp, { category: c.slug })}
                className={pill(sp.category === c.slug)}
              >
                {c.name} ({c._count.experiences})
              </a>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a href={buildQuery(sp, { destination: "" })} className={pill(!sp.destination)}>
              {d.allDestinations}
            </a>
            {destinations.map((dest) => (
              <a
                key={dest.slug}
                href={buildQuery(sp, { destination: dest.slug })}
                className={pill(sp.destination === dest.slug)}
              >
                {dest.name}
              </a>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-ivory/10 pt-4">
            <span className="me-1 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-ivory/40">
              {d.sortLabel}
            </span>
            {SORTS.map((s) => (
              <a key={s} href={buildQuery(sp, { sort: s })} className={pill(sort === s)}>
                {sortLabels[s]}
              </a>
            ))}
            {hasFilters ? (
              <Link href="/experiences" className="ms-auto text-xs text-sand hover:underline">
                {d.clear}
              </Link>
            ) : null}
          </div>
        </div>

        <p className="mb-6 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ivory/40" aria-live="polite">
          {data.total} {d.results}
        </p>

        {data.experiences.length === 0 ? (
          <EmptyState
            title={d.empty}
            action={
              hasFilters ? (
                <Link href="/experiences" className="text-sm text-sand hover:underline">
                  {d.clear}
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.experiences.map((exp, i) => (
              <Reveal key={exp.id} delay={(i % 3) * 0.08}>
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
  );
}
