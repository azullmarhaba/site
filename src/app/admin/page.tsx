import type { Metadata } from "next";
import Link from "next/link";
import { getDict, getLocale } from "@/lib/i18n";
import { formatPrice } from "@/lib/format";
import {
  getAdminStats,
  listRecentBookings,
  listPopularExperiences,
  listAdminReviews,
} from "@/server/services/admin";
import { StatsCard, AdminPanel, AdminTable, Th, Td, EmptyRow } from "@/components/admin/AdminKit";
import { StatusPill } from "@/components/admin/StatusPill";

export const metadata: Metadata = { title: "Admin — Overview" };

export default async function AdminOverviewPage() {
  const locale = await getLocale();
  const dict = getDict(locale);
  const o = dict.admin.overview;
  const [stats, recent, popular, reviews] = await Promise.all([
    getAdminStats(),
    listRecentBookings(8),
    listPopularExperiences(5),
    listAdminReviews("PENDING"),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl">{dict.admin.title}</h1>
        <p className="mt-1 text-sm text-ivory/50">{dict.admin.subtitle}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatsCard label={o.revenue} value={formatPrice(stats.revenueMinor, locale)} />
        <StatsCard label={o.bookings} value={stats.totalBookings} />
        <StatsCard label={o.pending} value={stats.pendingBookings} />
        <StatsCard label={o.customers} value={stats.customers} />
        <StatsCard label={o.upcoming} value={stats.upcomingTours} />
        <StatsCard label={o.conversion} value={`${stats.conversion}%`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminPanel title={o.recentBookings}>
          <AdminTable minWidth={560}>
            <thead>
              <tr>
                <Th>{dict.admin.bookings.reference}</Th>
                <Th>{dict.admin.bookings.customer}</Th>
                <Th>{dict.admin.bookings.experience}</Th>
                <Th>{dict.admin.bookings.date}</Th>
                <Th className="text-end">{dict.admin.bookings.total}</Th>
                <Th>{dict.admin.bookings.status}</Th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <EmptyRow colSpan={6} message={dict.common.empty} />
              ) : (
                recent.map((b) => (
                  <tr key={b.id} className="hover:bg-ivory/[0.03]">
                    <Td>
                      <Link
                        href={`/admin/bookings?q=${b.reference}`}
                        className="font-mono text-xs text-sand hover:underline"
                      >
                        {b.reference}
                      </Link>
                    </Td>
                    <Td>
                      <p className="text-ivory">{b.customer.fullName}</p>
                      <p className="text-xs text-ivory/45">{b.customer.user.email}</p>
                    </Td>
                    <Td className="text-ivory/70">{b.experience.title}</Td>
                    <Td className="whitespace-nowrap text-ivory/70">
                      {b.date.toISOString().slice(0, 10)}
                    </Td>
                    <Td className="whitespace-nowrap text-end text-sand">
                      {formatPrice(b.totalMinor, locale)}
                    </Td>
                    <Td>
                      <StatusPill status={b.status} />
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </AdminTable>
        </AdminPanel>

        <div className="space-y-6">
          <AdminPanel title={o.popular}>
            <AdminTable minWidth={420}>
              <thead>
                <tr>
                  <Th>{dict.admin.experiences.titleField}</Th>
                  <Th className="text-end">{dict.admin.experiences.bookings}</Th>
                  <Th className="text-end">{dict.admin.experiences.rating}</Th>
                  <Th className="text-end">{dict.admin.experiences.price}</Th>
                </tr>
              </thead>
              <tbody>
                {popular.length === 0 ? (
                  <EmptyRow colSpan={4} message={dict.common.empty} />
                ) : (
                  popular.map((e) => (
                    <tr key={e.id} className="hover:bg-ivory/[0.03]">
                      <Td>
                        <Link
                          href={`/admin/experiences/${e.id}`}
                          className="text-ivory hover:text-sand"
                        >
                          {e.title}
                        </Link>
                      </Td>
                      <Td className="text-end text-ivory/70">{e.bookingCount}</Td>
                      <Td className="text-end text-ivory/70">
                        {e.ratingAvg.toFixed(1)} ({e.ratingCount ?? 0})
                      </Td>
                      <Td className="text-end text-sand">{formatPrice(e.priceMinor, locale)}</Td>
                    </tr>
                  ))
                )}
              </tbody>
            </AdminTable>
          </AdminPanel>

          <AdminPanel
            title={`${dict.admin.reviews.title} · ${dict.admin.reviews.pending}`}
            action={
              <Link href="/admin/reviews" className="text-sm text-sand hover:underline">
                {dict.common.viewAll} →
              </Link>
            }
          >
            {reviews.length === 0 ? (
              <p className="text-sm text-ivory/45">{dict.admin.reviews.empty}</p>
            ) : (
              <ul className="space-y-3">
                {reviews.slice(0, 4).map((r) => (
                  <li key={r.id} className="rounded-xl border border-ivory/10 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-ivory">{r.customer.fullName}</span>
                      <span className="text-xs text-sand">{"★".repeat(r.rating)}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-ivory/60">{r.body}</p>
                    <p className="mt-1 text-xs text-ivory/40">{r.experience.title}</p>
                  </li>
                ))}
              </ul>
            )}
          </AdminPanel>
        </div>
      </div>
    </div>
  );
}
