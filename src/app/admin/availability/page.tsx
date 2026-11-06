import type { Metadata } from "next";
import Link from "next/link";
import { getDict, getLocale } from "@/lib/i18n";
import { listAdminAvailability, listAdminExperiences } from "@/server/services/admin";
import { AdminPanel, AdminTable, Th, Td, EmptyRow } from "@/components/admin/AdminKit";
import { StatusPill } from "@/components/admin/StatusPill";
import { CreateButton, EditButton, DeleteButton } from "@/components/admin/ResourceCrud";
import { availabilityFields } from "@/components/admin/crud-fields";

export const metadata: Metadata = { title: "Admin — Availability" };

export default async function AdminAvailabilityPage(props: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const sp = await props.searchParams;
  const locale = await getLocale();
  const dict = getDict(locale);
  const from = sp.from?.trim() || undefined;
  const to = sp.to?.trim() || undefined;
  const [rows, experiences] = await Promise.all([
    listAdminAvailability({ from, to }),
    listAdminExperiences(),
  ]);
  const fields = availabilityFields(dict, {
    experiences: experiences.map((x) => ({ value: x.id, label: x.title })),
  });

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl">{dict.admin.nav.availability}</h1>
          <p className="mt-1 text-sm text-ivory/50">{rows.length}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <form method="get" className="flex flex-wrap items-end gap-2">
            <div>
              <label
                htmlFor="av-from"
                className="block font-mono text-[0.58rem] uppercase tracking-[0.18em] text-ivory/45"
              >
                {dict.common.from}
              </label>
              <input
                id="av-from"
                type="date"
                name="from"
                defaultValue={from ?? ""}
                className="h-9 rounded-full border border-ivory/15 bg-carbon px-3 text-sm text-ivory outline-none focus:border-sand [color-scheme:dark]"
              />
            </div>
            <div>
              <label
                htmlFor="av-to"
                className="block font-mono text-[0.58rem] uppercase tracking-[0.18em] text-ivory/45"
              >
                {dict.common.to}
              </label>
              <input
                id="av-to"
                type="date"
                name="to"
                defaultValue={to ?? ""}
                className="h-9 rounded-full border border-ivory/15 bg-carbon px-3 text-sm text-ivory outline-none focus:border-sand [color-scheme:dark]"
              />
            </div>
            <button
              type="submit"
              className="h-9 rounded-full border border-sand/50 px-4 text-sm text-sand transition-colors hover:bg-sand/10"
            >
              {dict.common.search}
            </button>
            {from || to ? (
              <a
                href="/admin/availability"
                className="h-9 rounded-full border border-ivory/20 px-4 text-sm text-ivory/70 transition-colors hover:border-clay hover:text-clay"
              >
                {dict.common.cancel}
              </a>
            ) : null}
          </form>
          <CreateButton
            resourceKey="availability"
            fields={fields}
            labels={dict.admin.crud}
            title={dict.admin.crud.add}
          />
        </div>
      </header>

      <AdminPanel>
        <AdminTable minWidth={760}>
          <thead>
            <tr>
              <Th>{dict.booking.date}</Th>
              <Th>{dict.admin.bookings.experience}</Th>
              <Th className="text-end">{dict.admin.tours.seats}</Th>
              <Th>{dict.admin.bookings.status}</Th>
              <Th>{dict.admin.bookings.actions}</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <EmptyRow colSpan={5} message={dict.common.empty} />
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-ivory/[0.03]">
                  <Td className="whitespace-nowrap text-ivory/75">
                    {row.date.toISOString().slice(0, 10)}
                  </Td>
                  <Td>
                    <Link
                      href={`/admin/experiences`}
                      className="text-ivory hover:text-sand"
                    >
                      {row.experience.title}
                    </Link>
                  </Td>
                  <Td className="text-end text-ivory/70">
                    {row.capacityBooked} / {row.capacityTotal}
                  </Td>
                  <Td>
                    <StatusPill status={row.closed ? "CANCELLED" : "PUBLISHED"} />
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-2">
                      <EditButton resourceKey="availability" id={row.id} fields={fields} labels={dict.admin.crud} />
                      <DeleteButton resourceKey="availability" id={row.id} labels={dict.admin.crud} />
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
