import type { Metadata } from "next";
import Link from "next/link";
import { getDict, getLocale } from "@/lib/i18n";
import { formatPrice } from "@/lib/format";
import { listAdminBookings } from "@/server/services/admin";
import { AdminPanel, AdminTable, Th, Td, EmptyRow } from "@/components/admin/AdminKit";
import { StatusPill } from "@/components/admin/StatusPill";
import { DeleteButton } from "@/components/admin/ResourceCrud";

export const metadata: Metadata = { title: "Admin — Bookings" };

const STATUSES = ["PENDING", "CONFIRMED", "PAID", "IN_PROGRESS", "COMPLETED", "CANCELLED", "REFUNDED"];

export default async function AdminBookingsPage(props: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const sp = await props.searchParams;
  const locale = await getLocale();
  const dict = getDict(locale);
  const b = dict.admin.bookings;

  const status = sp.status && STATUSES.includes(sp.status) ? sp.status : undefined;
  const q = sp.q?.trim() || undefined;
  const page = Math.max(1, Number(sp.page ?? 1));

  const { bookings, total, pageSize } = await listAdminBookings({ status, q, page });  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const pageHref = (params: Record<string, string | undefined>) => {
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries({ status, q, page: page > 1 ? String(page) : undefined, ...params })) {
      if (v) usp.set(k, v);
      else usp.delete(k);
    }
    const s = usp.toString();
    return s ? `?${s}` : "?";
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl">{b.title}</h1>
          <p className="mt-1 text-sm text-ivory/50">
            {total} · {dict.common.viewAll}
          </p>
        </div>
        <form method="get" className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder={`${dict.common.search}…`}
            className="h-9 w-44 rounded-full border border-ivory/15 bg-carbon px-4 text-sm text-ivory outline-none placeholder:text-ivory/35 focus:border-sand"
          />
          <select
            name="status"
            defaultValue={status ?? ""}
            className="h-9 rounded-full border border-ivory/15 bg-carbon px-3 text-sm text-ivory outline-none focus:border-sand"
          >
            <option value="">{b.filterStatus}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="h-9 rounded-full border border-sand/50 px-4 text-sm text-sand transition-colors hover:bg-sand/10"
          >
            {dict.common.search}
          </button>
        </form>
      </header>

      <AdminPanel>
        <AdminTable minWidth={860}>
          <thead>
            <tr>
              <Th>{b.reference}</Th>
              <Th>{b.customer}</Th>
              <Th>{b.experience}</Th>
              <Th>{b.date}</Th>
              <Th>{b.guests}</Th>
              <Th className="text-end">{b.total}</Th>
              <Th>{b.status}</Th>
              <Th>{b.payment}</Th>
              <Th>{b.actions}</Th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <EmptyRow colSpan={9} message={b.empty} />
            ) : (
              bookings.map((bk) => (
                <tr key={bk.id} className="hover:bg-ivory/[0.03]">
                  <Td>
                    <span className="font-mono text-xs text-sand">{bk.reference}</span>
                  </Td>
                  <Td>
                    <p className="text-ivory">{bk.customer.fullName}</p>
                    <p className="text-xs text-ivory/45">{bk.customer.user.email}</p>
                  </Td>
                  <Td className="text-ivory/70">
                    {bk.tourDate?.tour.title ?? bk.experience.title}
                  </Td>
                  <Td className="whitespace-nowrap text-ivory/70">
                    {bk.date.toISOString().slice(0, 10)}
                  </Td>
                  <Td className="text-ivory/70">{bk.guests}</Td>
                  <Td className="whitespace-nowrap text-end text-sand">
                    {formatPrice(bk.totalMinor, locale)}
                  </Td>
                  <Td>
                    <StatusPill status={bk.status} />
                  </Td>
                  <Td>
                    {bk.payments.length === 0 ? (
                      <span className="text-xs text-ivory/40">—</span>
                    ) : (
                      <StatusPill status={bk.payments[0].status} />
                    )}
                  </Td>
                  <Td>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/bookings/${bk.id}`}
                        className="text-sm text-sand hover:underline"
                      >
                        {b.detail} →
                      </Link>
                      <DeleteButton resourceKey="bookings" id={bk.id} labels={dict.admin.crud} />
                    </div>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </AdminTable>
        {totalPages > 1 ? (
          <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Pagination">
            <Link
              href={pageHref({ page: page > 1 ? String(page - 1) : undefined })}
              className={page > 1 ? "text-sand hover:underline" : "pointer-events-none text-ivory/30"}
            >
              ← {dict.common.back}
            </Link>
            <span className="font-mono text-xs text-ivory/45">
              {page} / {totalPages}
            </span>
            <Link
              href={pageHref({ page: page < totalPages ? String(page + 1) : undefined })}
              className={
                page < totalPages ? "text-sand hover:underline" : "pointer-events-none text-ivory/30"
              }
            >
              {dict.common.next} →
            </Link>
          </nav>
        ) : null}
      </AdminPanel>
    </div>
  );
}
