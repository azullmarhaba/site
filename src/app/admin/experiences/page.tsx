import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getDict, getLocale } from "@/lib/i18n";
import { formatPrice } from "@/lib/format";
import {
  listAdminExperiences,
  listAdminCategories,
  listAdminDestinations,
} from "@/server/services/admin";
import { AdminPanel, AdminTable, Th, Td, EmptyRow } from "@/components/admin/AdminKit";
import { ExperienceStatusSelect, FeaturedToggle } from "@/components/admin/ExperienceControls";
import { CreateButton, DeleteButton } from "@/components/admin/ResourceCrud";
import { experiencesFields } from "@/components/admin/crud-fields";

export const metadata: Metadata = { title: "Admin — Experiences" };

export default async function AdminExperiencesPage() {
  const locale = await getLocale();
  const dict = getDict(locale);
  const e = dict.admin.experiences;
  const [experiences, categories, destinations] = await Promise.all([
    listAdminExperiences(),
    listAdminCategories(),
    listAdminDestinations(),
  ]);
  const fields = experiencesFields(dict, {
    categories: categories.map((c) => ({ value: c.id, label: c.name })),
    destinations: destinations.map((d) => ({ value: d.id, label: d.name })),
  });

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl">{e.title}</h1>
          <p className="mt-1 text-sm text-ivory/50">{experiences.length}</p>
        </div>
        <CreateButton resourceKey="experiences" fields={fields} labels={dict.admin.crud} title={e.new} />
      </header>

      <AdminPanel>
        <AdminTable minWidth={980}>
          <thead>
            <tr>
              <Th>{e.titleField}</Th>
              <Th>{e.destination}</Th>
              <Th>{e.price}</Th>
              <Th>{e.bookings}</Th>
              <Th>{e.rating}</Th>
              <Th>{e.featured}</Th>
              <Th>{e.status}</Th>
              <Th>{dict.admin.bookings.actions}</Th>
            </tr>
          </thead>
          <tbody>
            {experiences.length === 0 ? (
              <EmptyRow colSpan={8} message={e.empty} />
            ) : (
              experiences.map((x) => (
                <tr key={x.id} className="hover:bg-ivory/[0.03]">
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="relative hidden size-10 shrink-0 overflow-hidden rounded-lg sm:block">
                        {x.coverImage ? (
                          <Image
                            src={x.coverImage.path}
                            alt={x.coverImage.alt ?? x.title}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-ivory">{x.title}</p>
                        <p className="truncate text-xs text-ivory/45">
                          /{x.slug} · {x.category.name}
                        </p>
                      </div>
                    </div>
                  </Td>
                  <Td className="whitespace-nowrap text-ivory/70">{x.destination.name}</Td>
                  <Td className="whitespace-nowrap text-sand">{formatPrice(x.priceMinor, locale)}</Td>
                  <Td className="text-ivory/70">{x.bookingCount}</Td>
                  <Td className="whitespace-nowrap text-ivory/70">
                    {x.ratingAvg.toFixed(1)} ({x.ratingCount})
                  </Td>
                  <Td>
                    <FeaturedToggle
                      experienceId={x.id}
                      featured={x.featured}
                      label={e.featured}
                    />
                  </Td>
                  <Td>
                    <ExperienceStatusSelect
                      experienceId={x.id}
                      status={x.status}
                      labels={{ status: e.status, saved: e.saved }}
                    />
                  </Td>
                  <Td>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Link
                        href={`/admin/experiences/${x.id}`}
                        className="rounded-full border border-ivory/20 px-3 py-1 text-xs text-ivory/80 transition-colors hover:border-sand hover:text-ivory"
                      >
                        {e.edit}
                      </Link>
                      <DeleteButton resourceKey="experiences" id={x.id} labels={dict.admin.crud} />
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
