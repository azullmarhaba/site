import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function DestinationCard({
  destination,
  labels,
}: {
  destination: {
    slug: string;
    name: string;
    region: string | null;
    shortIntro: string | null;
    coverImage: { path: string; alt: string | null } | null;
    _count: { experiences: number };
  };
  labels: { countExperiences: string; viewExperiences: string };
}) {
  return (
    <Link
      href={`/destinations/${destination.slug}`}
      data-event="destination_selected"
      data-track-id={destination.slug}
      className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-3xl border border-ivory/10 transition-colors hover:border-sand/60"
    >
      <Image
        src={destination.coverImage?.path ?? "/images/placeholders/kasbah.svg"}
        alt={destination.coverImage?.alt ?? destination.name}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/40 to-transparent" />
      <div className="relative z-10 flex flex-col gap-2 p-6">
        {destination.region ? (
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-sand">
            {destination.region}
          </span>
        ) : null}
        <h3 className="text-2xl text-ivory transition-colors group-hover:text-sand">
          {destination.name}
        </h3>
        {destination.shortIntro ? (
          <p className="line-clamp-2 text-sm text-ivory/70">{destination.shortIntro}</p>
        ) : null}
        <span className="mt-2 inline-flex items-center gap-2 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-ivory/60">
          {destination._count.experiences} {labels.countExperiences}
          <ArrowUpRight className="size-3.5 text-sand transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:group-hover:-translate-x-0.5" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
