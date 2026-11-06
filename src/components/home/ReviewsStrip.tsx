import { Star, Quote, BadgeCheck } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { Section, SectionHead } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/Button";

type Review = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  createdAt: Date;
  customer: { fullName: string; country: string | null };
  experience: { title: string; slug: string };
};

export function ReviewsStrip({
  dict,
  reviews,
  average,
  count,
}: {
  dict: { eyebrow: string; title: string; verified: string; viewAll: string; based: string };
  reviews: Review[];
  average: number;
  count: number;
}) {
  return (
    <Section id="reviews" tone="deep">
      <div className="container-azul">
        <SectionHead
          eyebrow={dict.eyebrow}
          title={dict.title}
          action={
            <div className="flex flex-col items-start gap-1 md:items-end">
              <div className="flex items-center gap-1.5" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`size-4 ${i < Math.round(average) ? "fill-sand text-sand" : "text-ivory/25"}`}
                  />
                ))}
                <span className="ms-2 font-display text-2xl text-sand">
                  {average.toFixed(1)}
                </span>
              </div>
              <p className="text-xs text-ivory/50">
                {dict.based} {count} {dict.verified.toLowerCase()}
              </p>
              <LinkButton href="/reviews" variant="outline" size="sm" className="mt-1">
                {dict.viewAll}
              </LinkButton>
            </div>
          }
        />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review, i) => (
            <Reveal key={review.id} delay={(i % 3) * 0.1}>
              <figure className="flex h-full flex-col rounded-3xl border border-ivory/10 bg-obsidian/60 p-7">
                <Quote className="size-6 text-sand/60" aria-hidden="true" />
                <div className="mt-4 flex items-center gap-1" aria-label={`${review.rating} / 5`}>
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star
                      key={s}
                      className={`size-3.5 ${s < review.rating ? "fill-sand text-sand" : "text-ivory/20"}`}
                    />
                  ))}
                </div>
                {review.title ? (
                  <figcaption className="mt-3 font-display text-lg text-ivory">
                    {review.title}
                  </figcaption>
                ) : null}
                <blockquote className="mt-2 line-clamp-4 text-sm leading-relaxed text-ivory/65">
                  {review.body}
                </blockquote>
                <div className="mt-auto flex items-center justify-between gap-2 border-t border-ivory/10 pt-4">
                  <span className="text-sm text-ivory/80">{review.customer.fullName}</span>
                  <span className="inline-flex items-center gap-1 font-mono text-[0.55rem] uppercase tracking-[0.16em] text-atlas">
                    <BadgeCheck className="size-3.5" aria-hidden="true" />
                    {dict.verified}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-ivory/40">
                  {review.experience.title}
                </p>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
