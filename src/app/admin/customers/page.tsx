import type { Metadata } from "next";
import { getDict, getLocale } from "@/lib/i18n";
import { formatPrice } from "@/lib/format";
import { listAdminCustomers } from "@/server/services/admin";
import { AdminPanel, AdminTable, Th, Td, EmptyRow } from "@/components/admin/AdminKit";
import { StatusPill } from "@/components/admin/StatusPill";
import { EditButton, DeleteButton } from "@/components/admin/ResourceCrud";
import { customersFields } from "@/components/admin/crud-fields";

export const metadata: Metadata = { title: "Admin — Customers" };

export default async function AdminCustomersPage() {
  const locale = await getLocale();
  const dict = getDict(locale);
  const c = dict.admin.customers;
  const customers = await listAdminCustomers();
  const fields = customersFields(dict);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl md:text-3xl">{c.title}</h1>
        <p className="mt-1 text-sm text-ivory/50">{customers.length}</p>
      </header>

      <AdminPanel>
        <AdminTable minWidth={920}>
          <thead>
            <tr>
              <Th>{c.name}</Th>
              <Th>{c.email}</Th>
              <Th>{c.phone}</Th>
              <Th>{c.country}</Th>
              <Th className="text-end">{c.bookings}</Th>
              <Th className="text-end">{c.spent}</Th>
              <Th>{c.since}</Th>
              <Th>{dict.admin.bookings.actions}</Th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <EmptyRow colSpan={8} message={c.empty} />
            ) : (
              customers.map((cu) => (
                <tr key={cu.id} className="hover:bg-ivory/[0.03]">
                  <Td>
                    <p className="text-ivory">{cu.fullName}</p>
                    {cu.city ? <p className="text-xs text-ivory/45">{cu.city}</p> : null}
                  </Td>
                  <Td className="text-ivory/70">
                    {cu.email}
                    <span className="mt-0.5 block">
                      <StatusPill status={cu.userStatus} />
                    </span>
                  </Td>
                  <Td className="whitespace-nowrap text-ivory/60">{cu.phone ?? "—"}</Td>
                  <Td className="text-ivory/60">{cu.country ?? "—"}</Td>
                  <Td className="text-end text-ivory/70">{cu.bookingCount}</Td>
                  <Td className="whitespace-nowrap text-end text-sand">
                    {formatPrice(cu.spentMinor, locale)}
                  </Td>
                  <Td className="whitespace-nowrap text-ivory/55">
                    {cu.createdAt.toISOString().slice(0, 10)}
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-2">
                      <EditButton resourceKey="customers" id={cu.id} fields={fields} labels={dict.admin.crud} />
                      <DeleteButton resourceKey="customers" id={cu.id} labels={dict.admin.crud} />
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
