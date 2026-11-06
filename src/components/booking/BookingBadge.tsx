import Image from "next/image";
import { formatDate, formatPrice } from "@/lib/format";
import { siteConfig } from "@/config/site";

type BookingBadgeProps = {
  reference: string;
  status: string;
  date: string;
  departureTime?: string;
  adults: number;
  childCount: number;
  experienceTitle: string;
  coverImage: { path: string; alt: string | null } | null;
  customerName: string;
  customerEmail: string;
  discountMinor: number;
  totalMinor: number;
  currency: string;
  couponCode: string | null;
  couponPercentOff: number | null;
  locale: string;
};

export function BookingBadge({
  reference,
  status,
  date,
  departureTime,
  adults,
  childCount,
  experienceTitle,
  coverImage,
  customerName,
  customerEmail,
  discountMinor,
  totalMinor,
  currency,
  couponCode,
  couponPercentOff,
  locale,
}: BookingBadgeProps) {
  const hasDiscount = discountMinor > 0;
  return (
    <div className="relative mx-auto w-full max-w-[420px]">
      <div className="relative aspect-[8/5] w-full overflow-hidden rounded-3xl border border-ivory/15 shadow-2xl shadow-black/40">
        {coverImage ? (
          <Image
            src={coverImage.path}
            alt={coverImage.alt ?? experienceTitle}
            fill
            sizes="420px"
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-deep via-carbon to-obsidian" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />

        <div className="absolute inset-0 flex flex-col justify-between p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-sand/90 shadow-lg">
                <span className="font-display text-sm font-bold text-obsidian">A</span>
              </div>
              <div>
                <p className="font-display text-sm font-semibold tracking-wide text-white">
                  {siteConfig.name}
                </p>
                <p className="font-mono text-[0.55rem] uppercase tracking-[0.2em] text-white/60">
                  {siteConfig.descriptor}
                </p>
              </div>
            </div>
            <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 font-mono text-[0.55rem] uppercase tracking-[0.15em] text-white/80 backdrop-blur-sm">
              {status}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <p className="font-mono text-[0.55rem] uppercase tracking-[0.2em] text-white/50">
                Booking Reference
              </p>
              <p className="font-display text-xl font-semibold tracking-wide text-white">
                {reference}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="font-mono text-[0.5rem] uppercase tracking-[0.15em] text-white/40">
                  Experience
                </p>
                <p className="truncate text-sm font-medium text-white/90">{experienceTitle}</p>
              </div>
              <div>
                <p className="font-mono text-[0.5rem] uppercase tracking-[0.15em] text-white/40">
                  Date
                </p>
                <p className="text-sm font-medium text-white/90">{formatDate(new Date(date), locale)}</p>
                {departureTime ? (
                  <p className="text-xs text-white/60">{departureTime}</p>
                ) : null}
              </div>
              <div>
                <p className="font-mono text-[0.5rem] uppercase tracking-[0.15em] text-white/40">
                  Guests
                </p>
                <p className="text-sm font-medium text-white/90">
                  {adults} adult{adults > 1 ? "s" : ""}
                  {childCount > 0
                    ? ` + ${childCount} child${childCount > 1 ? "ren" : ""}`
                    : ""}
                </p>
              </div>
              <div>
                <p className="font-mono text-[0.5rem] uppercase tracking-[0.15em] text-white/40">
                  Total
                </p>
                <p className="font-display text-lg font-semibold text-sand">
                  {formatPrice(totalMinor, locale)}
                </p>
              </div>
            </div>

            {hasDiscount ? (
              <div className="flex items-center gap-2 rounded-xl border border-sand/30 bg-sand/15 px-3 py-2 backdrop-blur-sm">
                <span className="font-mono text-[0.55rem] uppercase tracking-[0.15em] text-sand">
                  Coupon {couponCode}
                </span>
                <span className="text-xs font-medium text-sand">
                  -{formatPrice(discountMinor, locale)}
                  {couponPercentOff ? ` (${couponPercentOff}% off)` : ""}
                </span>
              </div>
            ) : null}

            <div className="flex items-end justify-between border-t border-white/10 pt-3">
              <div>
                <p className="font-mono text-[0.5rem] uppercase tracking-[0.15em] text-white/40">
                  Guest
                </p>
                <p className="text-sm font-medium text-white/90">{customerName}</p>
                <p className="text-xs text-white/50">{customerEmail}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-[0.5rem] uppercase tracking-[0.15em] text-white/40">
                  Paid
                </p>
                <p className="font-mono text-sm text-white/70">{currency}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2 text-center">
        <div className="h-px flex-1 bg-ivory/10" />
        <p className="font-mono text-[0.55rem] uppercase tracking-[0.2em] text-ivory/30">
          AZUL · Marhaba Morocco
        </p>
        <div className="h-px flex-1 bg-ivory/10" />
      </div>
    </div>
  );
}
