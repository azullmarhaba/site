import type { Metadata } from "next";
import { getDict, getLocale } from "@/lib/i18n";
import { listAdminGuides, listAdminUsers } from "@/server/services/admin";
import { AdminPanel, AdminTable, Th, Td, EmptyRow } from "@/components/admin/AdminKit";
import { StatusPill } from "@/components/admin/StatusPill";
import { CreateButton, EditButton, DeleteButton } from "@/components/admin/ResourceCrud";
import { guidesFields } from "@/components/admin/crud-fields";

export const metadata: Metadata = { title: "Admin — Guides" };

export default async function AdminGuidesPage() {
  const locale = await getLocale();
  const dict = getDict(locale);
  const g = dict.admin.guides;
  const [guides, users] = await Promise.all([listAdminGuides(), listAdminUsers()]);
  const fields = guidesFields(dict, {
    users: users
      .filter((u) => u.roles.some((r) => r.role.name === "GUIDE"))
      .map((u) => ({ value: u.id, label: `${u.name} · ${u.email}` })),
  });

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl">{g.title}</h1>
          <p className="mt-1 text-sm text-ivory/50">{guides.length}</p>
        </div>
        <CreateButton resourceKey="guides" fields={fields} labels={dict.admin.crud} title={dict.admin.crud.add} />
      </header>

      <AdminPanel>
        <AdminTable minWidth={820}>
          <thead>
            <tr>
              <Th>{g.name}</Th>
              <Th>{g.languages}</Th>
              <Th className="text-end">{g.rating}</Th>
              <Th className="text-end">{dict.admin.nav.vehicles}</Th>
              <Th className="text-end">{dict.admin.bookings.title}</Th>
              <Th>{g.active}</Th>
              <Th>{dict.admin.bookings.actions}</Th>
            </tr>
          </thead>
          <tbody>
            {guides.length === 0 ? (
              <EmptyRow colSpan={7} message={g.empty} />
            ) : (
              guides.map((guide) => (
                <tr key={guide.id} className="hover:bg-ivory/[0.03]">
                  <Td>
                    <p className="text-ivory">{guide.name}</p>
                    <p className="text-xs text-ivory/45">{guide.email}</p>
                    {guide.licenseNumber ? (
                      <p className="font-mono text-[0.55rem] text-ivory/35">
                        {guide.licenseNumber}
                      </p>
                    ) : null}
                  </Td>
                  <Td className="whitespace-nowrap text-ivory/65">
                    {guide.languages ?? "—"}
                    <span className="block text-xs text-ivory/40">
                      {guide.yearsExp} yrs
                    </span>
                  </Td>
                  <Td className="text-end text-ivory/70">{guide.ratingAvg.toFixed(1)}</Td>
                  <Td className="text-end text-ivory/70">{guide.vehicleCount}</Td>
                  <Td className="text-end text-ivory/70">{guide.bookingCount}</Td>
                  <Td>
                    <StatusPill status={guide.active ? "ACTIVE" : "INACTIVE"} />
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-2">
                      <EditButton resourceKey="guides" id={guide.id} fields={fields} labels={dict.admin.crud} />
                      <DeleteButton resourceKey="guides" id={guide.id} labels={dict.admin.crud} />
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
