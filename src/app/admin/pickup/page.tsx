import type { Metadata } from "next";
import { getDict, getLocale } from "@/lib/i18n";
import { listAdminPickupLocations } from "@/server/services/admin";
import { AdminPanel, AdminTable, Th, Td, EmptyRow } from "@/components/admin/AdminKit";
import { StatusPill } from "@/components/admin/StatusPill";
import { CreateButton, EditButton, DeleteButton } from "@/components/admin/ResourceCrud";
import { pickupFields } from "@/components/admin/crud-fields";

export const metadata: Metadata = { title: "Admin — Pickup locations" };

export default async function AdminPickupPage() {
  const locale = await getLocale();
  const dict = getDict(locale);
  const locations = await listAdminPickupLocations();
  const fields = pickupFields(dict);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl">{dict.admin.nav.pickup}</h1>
          <p className="mt-1 text-sm text-ivory/50">{locations.length}</p>
        </div>
        <CreateButton resourceKey="pickup" fields={fields} labels={dict.admin.crud} title={dict.admin.crud.add} />
      </header>

      <AdminPanel>
        <AdminTable minWidth={760}>
          <thead>
            <tr>
              <Th>{dict.common.pickup}</Th>
              <Th>{dict.booking.pickupAddress}</Th>
              <Th>{dict.admin.bookings.status}</Th>
              <Th>{dict.admin.bookings.actions}</Th>
            </tr>
          </thead>
          <tbody>
            {locations.length === 0 ? (
              <EmptyRow colSpan={4} message={dict.common.empty} />
            ) : (
              locations.map((loc) => (
                <tr key={loc.id} className="hover:bg-ivory/[0.03]">
                  <Td>
                    <p className="text-ivory">{loc.name}</p>
                    {loc.description ? (
                      <p className="text-xs text-ivory/45">{loc.description}</p>
                    ) : null}
                  </Td>
                  <Td className="text-ivory/65">{loc.address ?? "—"}</Td>
                  <Td>
                    <StatusPill status={loc.active ? "ACTIVE" : "INACTIVE"} />
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-2">
                      <EditButton resourceKey="pickup" id={loc.id} fields={fields} labels={dict.admin.crud} />
                      <DeleteButton resourceKey="pickup" id={loc.id} labels={dict.admin.crud} />
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
