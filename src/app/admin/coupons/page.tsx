import type { Metadata } from "next";
import { getDict, getLocale } from "@/lib/i18n";
import { formatPrice } from "@/lib/format";
import { listAdminCoupons } from "@/server/services/admin";
import { AdminPanel, AdminTable, Th, Td, EmptyRow } from "@/components/admin/AdminKit";
import { StatusPill } from "@/components/admin/StatusPill";
import { CouponForm } from "@/components/admin/CouponForm";
import { EditButton, DeleteButton } from "@/components/admin/ResourceCrud";
import { couponsFields } from "@/components/admin/crud-fields";

export const metadata: Metadata = { title: "Admin — Coupons" };

export default async function AdminCouponsPage() {
  const locale = await getLocale();
  const dict = getDict(locale);
  const c = dict.admin.coupons;
  const coupons = await listAdminCoupons();
  const fields = couponsFields(dict);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl md:text-3xl">{c.title}</h1>
        <p className="mt-1 text-sm text-ivory/50">{coupons.length}</p>
      </header>

      <AdminPanel title={c.new}>
        <CouponForm
          labels={{
            new: c.new,
            code: c.code,
            discount: c.discount,
            redemptions: c.redemptions,
            expires: c.expires,
            save: dict.common.save,
            saved: dict.common.saved,
            error: dict.common.error,
          }}
        />
      </AdminPanel>

      <AdminPanel>
        <AdminTable minWidth={820}>
          <thead>
            <tr>
              <Th>{c.code}</Th>
              <Th>{c.discount}</Th>
              <Th>{c.redemptions}</Th>
              <Th>{c.expires}</Th>
              <Th>{dict.admin.bookings.status}</Th>
              <Th>{dict.admin.bookings.actions}</Th>
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 ? (
              <EmptyRow colSpan={6} message={c.empty} />
            ) : (
              coupons.map((cp) => (
                <tr key={cp.id} className="hover:bg-ivory/[0.03]">
                  <Td>
                    <span className="font-mono text-sm text-sand">{cp.code}</span>
                    {cp.description ? (
                      <p className="text-xs text-ivory/45">{cp.description}</p>
                    ) : null}
                  </Td>
                  <Td className="whitespace-nowrap text-ivory/70">
                    {cp.percentOff ? `${cp.percentOff}%` : formatPrice(cp.fixedOffMinor ?? 0, locale)}
                  </Td>
                  <Td className="text-ivory/70">
                    {cp.redeemedCount}
                    {cp.redemptionLimit ? ` / ${cp.redemptionLimit}` : ""}
                  </Td>
                  <Td className="whitespace-nowrap text-ivory/60">
                    {cp.expiresAt ? cp.expiresAt.toISOString().slice(0, 10) : "—"}
                  </Td>
                  <Td>
                    <StatusPill status={cp.active ? "ACTIVE" : "INACTIVE"} />
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-2">
                      <EditButton resourceKey="coupons" id={cp.id} fields={fields} labels={dict.admin.crud} />
                      <DeleteButton resourceKey="coupons" id={cp.id} labels={dict.admin.crud} />
                    </div>
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
