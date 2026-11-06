import type { Metadata } from "next";
import Link from "next/link";
import { Star } from "lucide-react";
import { getDict, getLocale } from "@/lib/i18n";
import { listPublicReviews, getReviewStats } from "@/server/services/content";
import { Section, SectionHead } from "@/components/ui/Section";
import { EmptyState } from "@/components/ui/States";
import { formatDate } from "@/lib/format";
import { siteConfig } from "@/config/site";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDict(await getLocale());
  return {
    title: dict.reviewsPage.title,
    description: dict.reviewsPage.lead,
    alternates: { canonical: "/reviews" },
  };
}

export default async function ReviewsPage() {
  const locale = await getLocale();
  const dict = getDict(locale);
  const r = dict.reviewsPage;

  const [reviews, stats] = await Promise.all([listPublicReviews(48), getReviewStats()]);

  return (
    <Section tone="obsidian">
      <div className="container-azul">
        <SectionHead
          as="h1"
          eyebrow={siteConfig.descriptor}
          title={r.title}
          lead={r.lead}
          action={
            stats.count > 0 ? (
              <div className="rounded-3xl border border-sand/30 bg-sand/10 px-6 py-4 text-center">
                <p className="font-display text-3xl text-sand">{stats.average}</p>
                <p className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-ivory/55">
                  {r.based} {stats.count} {dict.common.reviews}
                </p>
              </div>
            ) : undefined
          }
        />

        {reviews.length === 0 ? (
          <EmptyState title={r.empty} />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((rev) => (
              <article
                key={rev.id}
                className="flex h-full flex-col rounded-3xl border border-ivory/10 bg-deep p-6"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="flex gap-0.5" aria-label={`${rev.rating}/5`}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`size-4 ${i < rev.rating ? "fill-sand text-sand" : "text-ivory/20"}`}
                        aria-hidden="true"
                      />
                    ))}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-sand/30 px-2.5 py-1 font-mono text-[0.55rem] uppercase tracking-[0.14em] text-sand">
                    {r.verified}
                  </span>
                </div>
                {rev.title ? (
                  <h2 className="mb-1 text-lg text-ivory">{rev.title}</h2>
                ) : null}
                <p className="text-sm leading-relaxed text-ivory/70">{rev.body}</p>
                <footer className="mt-auto flex items-end justify-between gap-3 border-t border-ivory/10 pt-4 text-xs text-ivory/50">
                  <span>
                    <span className="block font-medium text-ivory/85">
                      {rev.customer.fullName}
                      {rev.customer.country ? `, ${rev.customer.country}` : ""}
                    </span>
                    <Link
                      href={`/experiences/${rev.experience.slug}`}
                      className="text-sand hover:underline"
                    >
                      {rev.experience.title}
                    </Link>
                  </span>
                  <time className="shrink-0 font-mono text-[0.58rem]">
                    {formatDate(rev.createdAt, locale)}
                  </time>
                </footer>
              </article>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}
