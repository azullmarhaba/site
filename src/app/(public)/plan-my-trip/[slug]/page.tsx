import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDict, getLocale } from "@/lib/i18n";
import { getTripPlanBySlug } from "@/server/services/planner";
import { Section, SectionHead } from "@/components/ui/Section";
import { PdfLink } from "@/components/documents/PdfLink";
import { formatPrice } from "@/lib/format";
import { siteConfig } from "@/config/site";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDict(await getLocale());
  return {
    title: dict.planner.yourItinerary,
    robots: { index: false, follow: true },
  };
}

export default async function SharedTripPlanPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const locale = await getLocale();
  const dict = getDict(locale);
  const p = dict.planner;

  let plan;
  try {
    plan = await getTripPlanBySlug(slug);
  } catch {
    notFound();
  }

  type Day = {
    day: number;
    destination: { name: string; slug: string };
    experience: { title: string; slug: string } | null;
    duration: string;
    description: string;
    costMinor: number;
  };
  const days = Array.isArray(plan.itinerary) ? (plan.itinerary as Day[]) : [];

  return (
    <Section tone="obsidian">
      <div className="container-azul max-w-3xl">
        <SectionHead
          as="h1"
          eyebrow={siteConfig.descriptor}
          title={plan.title}
          lead={`${plan.days} ${dict.common.days} · ${p.styles[plan.style as keyof typeof p.styles] ?? plan.style} · ${plan.customer.fullName}`}
        />

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-sand/30 bg-sand/10 p-5">
          <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-ivory/60">
            {p.estimated}
          </span>
          <span className="font-display text-3xl text-sand">
            {formatPrice(plan.totalMinor, locale)}
          </span>
        </div>

        <ol className="space-y-3">
          {days.map((d) => (
            <li key={d.day} className="rounded-2xl border border-ivory/10 bg-deep p-5">
              <div className="flex items-start gap-4">
                <span className="font-display text-2xl text-sand/70" aria-hidden="true">
                  {String(d.day).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <p className="font-medium text-ivory">{d.destination.name}</p>
                    <p className="font-mono text-[0.58rem] uppercase tracking-[0.16em] text-ivory/40">
                      {d.duration}
                    </p>
                  </div>
                  {d.experience ? (
                    <Link
                      href={`/experiences/${d.experience.slug}`}
                      className="mt-0.5 block text-sm text-sand hover:underline"
                    >
                      {d.experience.title}
                    </Link>
                  ) : null}
                  <p className="mt-1 text-xs leading-relaxed text-ivory/55">{d.description}</p>
                </div>
                <span className="shrink-0 text-sm text-ivory/60">
                  {formatPrice(d.costMinor, locale)}
                </span>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-wrap gap-3">
          <PdfLink kind="trip-plan" reference={plan.shareSlug} label={dict.documents.downloadTripPlan} tone="solid" />
          <Link
            href="/plan-my-trip"
            className="inline-flex h-11 items-center rounded-full border border-ivory/30 px-6 text-sm text-ivory transition-colors hover:border-sand hover:text-sand"
          >
            {p.restart}
          </Link>
          <Link
            href="/experiences"
            className="inline-flex h-11 items-center rounded-full bg-sand px-6 text-sm font-medium text-obsidian transition-colors hover:bg-sand-bright"
          >
            {p.book}
          </Link>
        </div>
      </div>
    </Section>
  );
}
