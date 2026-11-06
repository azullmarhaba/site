import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { getDict, getLocale } from "@/lib/i18n";
import { requireUser } from "@/lib/auth/guards";
import { formatDuration, formatPrice } from "@/lib/format";
import { listFavorites } from "@/server/services/favorites";
import { EmptyState } from "@/components/ui/States";

export const metadata: Metadata = { robots: { index: false } };

export default async function AccountFavoritesPage() {
  const user = await requireUser("/account/favorites");
  const locale = await getLocale();
  const dict = getDict(locale);
  const favorites = await listFavorites(user.id);

  if (favorites.length === 0) {
    return <EmptyState title={dict.account.favoritesEmpty} />;
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {favorites.map((f) => (
        <li
          key={f.experience.id}
          className="group overflow-hidden rounded-2xl border border-ivory/10 bg-ivory/[0.04]"
        >
          <Link href={`/experiences/${f.experience.slug}`} className="block">
            <div className="relative aspect-[16/9] overflow-hidden">
              {f.experience.coverImage ? (
                <Image
                  src={f.experience.coverImage.path}
                  alt={f.experience.coverImage.alt ?? f.experience.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 400px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="grid h-full place-items-center bg-ivory/5 text-ivory/30">★</div>
              )}
              <span className="absolute start-3 top-3 rounded-full border border-ivory/25 bg-obsidian/70 px-3 py-1 font-mono text-[0.56rem] uppercase tracking-[0.2em] text-ivory/80 backdrop-blur">
                {f.experience.destination.name}
              </span>
            </div>
            <div className="p-4">
              <p className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-sand">
                {f.experience.category?.name ?? ""}
              </p>
              <h3 className="mt-1 truncate text-lg text-ivory">{f.experience.title}</h3>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-ivory/55">
                  <Star className="size-3.5 fill-sand text-sand" aria-hidden="true" />
                  {f.experience.ratingAvg.toFixed(1)}
                  <span className="text-ivory/40">({f.experience.ratingCount})</span>
                </span>
                <span className="text-ivory/55">{formatDuration(f.experience.durationMinutes)}</span>
              </div>
              <p className="mt-3 font-display text-xl text-sand">
                {formatPrice(f.experience.priceMinor, locale)}
                <span className="ml-1 text-xs font-normal text-ivory/45">
                  / {dict.common.perPerson}
                </span>
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
