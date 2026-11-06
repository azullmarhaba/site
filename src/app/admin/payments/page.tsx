import type { Metadata } from "next";
import Link from "next/link";
import { getDict, getLocale } from "@/lib/i18n";
import { formatPrice } from "@/lib/format";
import { listAdminPayments } from "@/server/services/admin";
import { AdminPanel, AdminTable, Th, Td, EmptyRow } from "@/components/admin/AdminKit";
import { StatusPill } from "@/components/admin/StatusPill";

export const metadata: Metadata = { title: "Admin — Payments" };

export default async function AdminPaymentsPage() {
  const locale = await getLocale();
  const dict = getDict(locale);
  const payments = await listAdminPayments();

  const paidTotal = payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.amountMinor, 0);
  const refunded = payments.reduce((sum, p) => sum + p.refundedMinor, 0);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl md:text-3xl">{dict.admin.nav.payments}</h1>
        <p className="mt-1 text-sm text-ivory/50">
          {payments.length} · {formatPrice(paidTotal, locale)}
          {refunded > 0 ? ` · −${formatPrice(refunded, locale)}` : ""}
        </p>
      </header>

      <AdminPanel>
        <AdminTable minWidth={760}>
          <thead>
            <tr>
              <Th>{dict.admin.bookings.reference}</Th>
              <Th>{dict.admin.bookings.customer}</Th>
              <Th>{dict.admin.bookings.payment}</Th>
              <Th className="text-end">{dict.admin.bookings.total}</Th>
              <Th>{dict.admin.bookings.status}</Th>
              <Th>{dict.admin.bookings.date}</Th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <EmptyRow colSpan={6} message={dict.common.empty} />
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="hover:bg-ivory/[0.03]">
                  <Td>
                    <Link
                      href={`/admin/bookings`}
                      className="font-mono text-xs text-sand hover:underline"
                    >
                      {p.booking.reference}
                    </Link>
                  </Td>
                  <Td className="text-ivory/70">{p.booking.customer.fullName}</Td>
                  <Td className="text-ivory/60">
                    {p.providerRef ?? p.provider}
                    <span className="block font-mono text-[0.55rem] uppercase tracking-[0.14em] text-ivory/35">
                      {p.provider}
                    </span>
                  </Td>
                  <Td className="whitespace-nowrap text-end text-sand">
                    {formatPrice(p.amountMinor, locale)}
                    {p.refundedMinor > 0 ? (
                      <span className="block text-xs text-clay">
                        −{formatPrice(p.refundedMinor, locale)}
                      </span>
                    ) : null}
                  </Td>
                  <Td>
                    <StatusPill status={p.status} />
                  </Td>
                  <Td className="whitespace-nowrap text-ivory/55">
                    {p.paidAt ? p.paidAt.toISOString().slice(0, 10) : p.createdAt.toISOString().slice(0, 10)}
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </AdminTable>
      </AdminPanel>
    </div>
  );
}
