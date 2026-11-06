import type { Metadata } from "next";
import { getDict, getLocale } from "@/lib/i18n";
import { listAdminDestinations } from "@/server/services/admin";
import { AdminPanel, AdminTable, Th, Td, EmptyRow } from "@/components/admin/AdminKit";
import { StatusPill } from "@/components/admin/StatusPill";
import { CreateButton, EditButton, DeleteButton } from "@/components/admin/ResourceCrud";
import { destinationsFields } from "@/components/admin/crud-fields";

export const metadata: Metadata = { title: "Admin — Destinations" };

export default async function AdminDestinationsPage() {
  const locale = await getLocale();
  const dict = getDict(locale);
  const d = dict.admin.destinations;
  const destinations = await listAdminDestinations();
  const fields = destinationsFields(dict);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl">{d.title}</h1>
          <p className="mt-1 text-sm text-ivory/50">{destinations.length}</p>
        </div>
        <CreateButton resourceKey="destinations" fields={fields} labels={dict.admin.crud} title={dict.admin.crud.add} />
      </header>

      <AdminPanel>
        <AdminTable minWidth={820}>
          <thead>
            <tr>
              <Th>{d.name}</Th>
              <Th>{d.region}</Th>
              <Th className="text-end">{d.experiences}</Th>
              <Th>{dict.admin.tours.title}</Th>
              <Th>{dict.admin.experiences.featured}</Th>
              <Th>{d.status}</Th>
              <Th>{dict.admin.bookings.actions}</Th>
            </tr>
          </thead>
          <tbody>
            {destinations.length === 0 ? (
              <EmptyRow colSpan={7} message={d.empty} />
            ) : (
              destinations.map((dest) => (
                <tr key={dest.id} className="hover:bg-ivory/[0.03]">
                  <Td>
                    <p className="text-ivory">{dest.name}</p>
                    <p className="text-xs text-ivory/45">/{dest.slug}</p>
                  </Td>
                  <Td className="text-ivory/65">
                    {dest.region ?? "—"}
                    <span className="block text-xs text-ivory/40">{dest.country}</span>
                  </Td>
                  <Td className="text-end text-ivory/70">{dest.experiences.length}</Td>
                  <Td className="text-ivory/70">{dest.tours.length}</Td>
                  <Td>
                    <StatusPill status={dest.featured ? "ACTIVE" : "INACTIVE"} />
                  </Td>
                  <Td>
                    <StatusPill status={dest.status} />
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-2">
                      <EditButton resourceKey="destinations" id={dest.id} fields={fields} labels={dict.admin.crud} />
                      <DeleteButton resourceKey="destinations" id={dest.id} labels={dict.admin.crud} />
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
