import Image from "next/image";
import Link from "next/link";
import { CalendarCheck, Star, Clock, MapPin } from "lucide-react";
import { formatDuration, formatPrice } from "@/lib/format";

export type ExperienceCardData = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  priceMinor: number;
  durationMinutes: number;
  ratingAvg: number;
  ratingCount: number;
  category: { name: string; slug: string };
  destination: { name: string; slug: string };
  coverImage: { path: string; alt: string | null } | null;
};

export function ExperienceCard({
  experience,
  locale,
  perPerson,
  size = "md",
  bookLabel,
}: {
  experience: ExperienceCardData;
  locale: string;
  perPerson: string;
  size?: "md" | "lg";
  bookLabel?: string;
}) {
  const exp = experience;
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-ivory/10 bg-obsidian transition-colors hover:border-sand/50">
      <Link
        href={`/experiences/${exp.slug}`}
        data-event="cta_clicked"
        data-track-id={`experience:${exp.slug}`}
        aria-label={exp.title}
        className="absolute inset-0 z-10 rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sand"
      />
      <div className={`relative overflow-hidden ${size === "lg" ? "aspect-[16/9]" : "aspect-[4/3]"}`}>
        <Image
          src={exp.coverImage?.path ?? "/images/placeholders/hero.svg"}
          alt={exp.coverImage?.alt ?? exp.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian/70 via-transparent to-transparent" />
        <span className="absolute start-4 top-4 rounded-full border border-ivory/25 bg-obsidian/70 px-3 py-1 font-mono text-[0.58rem] uppercase tracking-[0.2em] text-ivory/80 backdrop-blur">
          {exp.category.name}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-6">
        <div className="flex items-center gap-3 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-ivory/50">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3 text-sand" aria-hidden="true" />
            {exp.destination.name}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3 text-sand" aria-hidden="true" />
            {formatDuration(exp.durationMinutes)}
          </span>
        </div>

        <h3 className="text-xl leading-snug transition-colors group-hover:text-sand">{exp.title}</h3>
        {exp.summary ? <p className="line-clamp-2 text-sm text-ivory/60">{exp.summary}</p> : null}

        <div className="mt-auto space-y-4 border-t border-ivory/10 pt-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-ivory/50">
              <span className="font-display text-lg text-sand">
                {formatPrice(exp.priceMinor, locale)}
              </span>{" "}
              / {perPerson}
            </span>
            {exp.ratingCount > 0 ? (
              <span className="inline-flex items-center gap-1 text-xs text-ivory/70">
                <Star className="size-3.5 fill-sand text-sand" aria-hidden="true" />
                {exp.ratingAvg.toFixed(1)}
                <span className="text-ivory/40">({exp.ratingCount})</span>
              </span>
            ) : null}
          </div>
          {bookLabel ? (
            <Link
              href={`/book/${exp.slug}`}
              data-event="cta_clicked"
              data-track-id={`book:${exp.slug}`}
              className="relative z-20 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-sand px-5 text-sm font-medium tracking-wide text-obsidian transition-colors hover:bg-sand-bright active:scale-[0.98]"
            >
              <CalendarCheck className="size-4" aria-hidden="true" />
              {bookLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
