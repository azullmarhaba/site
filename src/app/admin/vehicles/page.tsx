import type { Metadata } from "next";
import { getDict, getLocale } from "@/lib/i18n";
import {
  listAdminVehicles,
  listAdminVehicleCategories,
  listAdminGuides,
} from "@/server/services/admin";
import { AdminPanel, AdminTable, Th, Td, EmptyRow } from "@/components/admin/AdminKit";
import { StatusPill } from "@/components/admin/StatusPill";
import { CreateButton, EditButton, DeleteButton } from "@/components/admin/ResourceCrud";
import { vehiclesFields } from "@/components/admin/crud-fields";

export const metadata: Metadata = { title: "Admin — Vehicles" };

export default async function AdminVehiclesPage() {
  const locale = await getLocale();
  const dict = getDict(locale);
  const [vehicles, categories, guides] = await Promise.all([
    listAdminVehicles(),
    listAdminVehicleCategories(),
    listAdminGuides(),
  ]);
  const fields = vehiclesFields(dict, {
    categories: categories.map((c) => ({ value: c.id, label: c.name })),
    guides: guides.map((g) => ({ value: g.id, label: g.name })),
  });

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl">{dict.admin.nav.vehicles}</h1>
          <p className="mt-1 text-sm text-ivory/50">{vehicles.length}</p>
        </div>
        <CreateButton resourceKey="vehicles" fields={fields} labels={dict.admin.crud} title={dict.admin.crud.add} />
      </header>

      <AdminPanel>
        <AdminTable minWidth={820}>
          <thead>
            <tr>
              <Th>{dict.admin.nav.vehicles}</Th>
              <Th>{dict.common.groupSize}</Th>
              <Th>{dict.admin.guides.name}</Th>
              <Th className="text-end">{dict.admin.bookings.title}</Th>
              <Th>{dict.admin.bookings.status}</Th>
              <Th>{dict.admin.bookings.actions}</Th>
            </tr>
          </thead>
          <tbody>
            {vehicles.length === 0 ? (
              <EmptyRow colSpan={6} message={dict.common.empty} />
            ) : (
              vehicles.map((v) => (
                <tr key={v.id} className="hover:bg-ivory/[0.03]">
                  <Td>
                    <p className="text-ivory">
                      {v.make} {v.model}
                      {v.year ? ` · ${v.year}` : ""}
                    </p>
                    <p className="font-mono text-xs text-ivory/45">
                      {v.plate ?? "—"} · {v.category.name}
                    </p>
                  </Td>
                  <Td className="text-ivory/65">{v.seats}</Td>
                  <Td className="text-ivory/65">
                    {v.guide?.user.name ?? "—"}
                  </Td>
                  <Td className="text-end text-ivory/70">{v.bookings.length}</Td>
                  <Td>
                    <StatusPill status={v.active ? "ACTIVE" : "INACTIVE"} />
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-2">
                      <EditButton resourceKey="vehicles" id={v.id} fields={fields} labels={dict.admin.crud} />
                      <DeleteButton resourceKey="vehicles" id={v.id} labels={dict.admin.crud} />
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
