import type { Metadata } from "next";
import Link from "next/link";
import { getDict, getLocale } from "@/lib/i18n";
import { formatPrice } from "@/lib/format";
import { listAdminTours, listAdminExperiences, listAdminDestinations } from "@/server/services/admin";
import { AdminPanel, AdminTable, Th, Td, EmptyRow } from "@/components/admin/AdminKit";
import { StatusPill } from "@/components/admin/StatusPill";
import { CreateButton, EditButton, DeleteButton } from "@/components/admin/ResourceCrud";
import { toursFields } from "@/components/admin/crud-fields";

export const metadata: Metadata = { title: "Admin — Tours" };

export default async function AdminToursPage() {
  const locale = await getLocale();
  const dict = getDict(locale);
  const t = dict.admin.tours;
  const [tours, experiences, destinations] = await Promise.all([
    listAdminTours(),
    listAdminExperiences(),
    listAdminDestinations(),
  ]);
  const fields = toursFields(dict, {
    experiences: experiences.map((x) => ({ value: x.id, label: x.title })),
    destinations: destinations.map((d) => ({ value: d.id, label: d.name })),
  });

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl">{t.title}</h1>
          <p className="mt-1 text-sm text-ivory/50">{tours.length}</p>
        </div>
        <CreateButton resourceKey="tours" fields={fields} labels={dict.admin.crud} title={dict.admin.crud.add} />
      </header>

      <AdminPanel>
        <AdminTable minWidth={880}>
          <thead>
            <tr>
              <Th>{dict.admin.bookings.experience}</Th>
              <Th>{dict.admin.destinations.name}</Th>
              <Th className="text-end">{dict.admin.experiences.price}</Th>
              <Th>{t.departures}</Th>
              <Th className="text-end">{t.seats}</Th>
              <Th>{dict.admin.bookings.status}</Th>
              <Th>{dict.admin.bookings.actions}</Th>
            </tr>
          </thead>
          <tbody>
            {tours.length === 0 ? (
              <EmptyRow colSpan={7} message={t.empty} />
            ) : (
              tours.map((tour) => {
                const seats = tour.dates.reduce(
                  (acc, dt) => acc + (dt.capacityTotal - dt.capacityBooked),
                  0
                );
                const nextDate = tour.dates.find((dt) => dt.date >= new Date());
                return (
                  <tr key={tour.id} className="hover:bg-ivory/[0.03]">
                    <Td>
                      <p className="text-ivory">{tour.title}</p>
                      <p className="text-xs text-ivory/45">
                        <Link
                          href={`/tours/${tour.slug}`}
                          className="text-sand/80 hover:text-sand"
                        >
                          /{tour.slug}
                        </Link>
                        {" · "}
                        {tour.experience.title}
                      </p>
                    </Td>
                    <Td className="text-ivory/65">{tour.destination.name}</Td>
                    <Td className="whitespace-nowrap text-end text-sand">
                      {formatPrice(tour.priceMinor, locale)}
                    </Td>
                    <Td className="whitespace-nowrap text-ivory/65">
                      {nextDate ? nextDate.date.toISOString().slice(0, 10) : "—"}
                      <span className="block text-xs text-ivory/40">
                        {tour.dates.length}
                      </span>
                    </Td>
                    <Td className="text-end text-ivory/70">{seats}</Td>
                    <Td>
                      <StatusPill status={tour.status} />
                    </Td>
                    <Td>
                      <div className="flex justify-end gap-2">
                        <EditButton resourceKey="tours" id={tour.id} fields={fields} labels={dict.admin.crud} />
                        <DeleteButton resourceKey="tours" id={tour.id} labels={dict.admin.crud} />
                      </div>
                    </Td>
                  </tr>
                );
              })
            )}
          </tbody>
        </AdminTable>
      </AdminPanel>
    </div>
  );
}
