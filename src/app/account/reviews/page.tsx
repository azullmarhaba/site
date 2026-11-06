import type { Metadata } from "next";
import Link from "next/link";
import { Star } from "lucide-react";
import { getDict, getLocale } from "@/lib/i18n";
import { requireUser } from "@/lib/auth/guards";
import { formatDate } from "@/lib/format";
import { listUserReviews } from "@/server/services/account";
import { EmptyState } from "@/components/ui/States";

export const metadata: Metadata = { robots: { index: false } };

export default async function AccountReviewsPage() {
  const user = await requireUser("/account/reviews");
  const locale = await getLocale();
  const dict = getDict(locale);
  const a = dict.account;
  const reviews = await listUserReviews(user.id);

  if (reviews.length === 0) {
    return <EmptyState title={a.reviewsEmpty} />;
  }

  const statusLabel: Record<string, string> = {
    PENDING: a.reviewPending,
    APPROVED: a.reviewApproved,
    REJECTED: a.reviewRejected,
  };
  const statusTone: Record<string, string> = {
    PENDING: "bg-sand/15 text-sand border-sand/30",
    APPROVED: "bg-atlas/15 text-atlas border-atlas/40",
    REJECTED: "bg-clay/15 text-clay border-clay/40",
  };

  return (
    <ul className="space-y-3">
      {reviews.map((r) => (
        <li
          key={r.id}
          className="rounded-2xl border border-ivory/10 bg-ivory/[0.04] p-5"
        >
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full border px-2.5 py-0.5 font-mono text-[0.56rem] uppercase tracking-[0.16em] ${
                statusTone[r.status] ?? statusTone.PENDING
              }`}
            >
              {statusLabel[r.status] ?? r.status}
            </span>
            <span className="flex items-center gap-0.5" aria-label={`${r.rating}/5`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`size-3.5 ${i < r.rating ? "fill-sand text-sand" : "text-ivory/25"}`}
                  aria-hidden="true"
                />
              ))}
            </span>
            <span className="font-mono text-[0.58rem] uppercase tracking-[0.16em] text-ivory/45">
              {formatDate(r.createdAt, locale)}
            </span>
          </div>
          {r.title ? <p className="mt-2 font-display text-lg text-ivory">{r.title}</p> : null}
          <p className="mt-1 text-sm leading-relaxed text-ivory/65">{r.body}</p>
          <Link
            href={`/experiences/${r.experience.slug}`}
            className="mt-3 inline-block text-sm text-sand hover:underline"
          >
            {r.experience.title} →
          </Link>
        </li>
      ))}
    </ul>
  );
}
