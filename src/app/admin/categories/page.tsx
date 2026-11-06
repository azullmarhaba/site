import type { Metadata } from "next";
import { getDict, getLocale } from "@/lib/i18n";
import { listAdminCategories } from "@/server/services/admin";
import { AdminPanel, AdminTable, Th, Td, EmptyRow } from "@/components/admin/AdminKit";
import { StatusPill } from "@/components/admin/StatusPill";
import { CreateButton, EditButton, DeleteButton } from "@/components/admin/ResourceCrud";
import { categoriesFields } from "@/components/admin/crud-fields";

export const metadata: Metadata = { title: "Admin — Categories" };

export default async function AdminCategoriesPage() {
  const locale = await getLocale();
  const dict = getDict(locale);
  const e = dict.admin.experiences;
  const categories = await listAdminCategories();
  const fields = categoriesFields(dict);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl">{dict.admin.nav.categories}</h1>
          <p className="mt-1 text-sm text-ivory/50">{categories.length}</p>
        </div>
        <CreateButton resourceKey="categories" fields={fields} labels={dict.admin.crud} title={dict.admin.crud.add} />
      </header>

      <AdminPanel>
        <AdminTable minWidth={720}>
          <thead>
            <tr>
              <Th>{e.category}</Th>
              <Th>{dict.admin.experiences.description}</Th>
              <Th className="text-end">{e.title}</Th>
              <Th className="text-end">{e.bookings}</Th>
              <Th>{dict.admin.bookings.status}</Th>
              <Th>{dict.admin.bookings.actions}</Th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <EmptyRow colSpan={6} message={dict.admin.destinations.empty} />
            ) : (
              categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-ivory/[0.03]">
                  <Td>
                    <p className="text-ivory">{cat.name}</p>
                    <p className="text-xs text-ivory/45">/{cat.slug}</p>
                  </Td>
                  <Td className="max-w-xs text-ivory/60">{cat.description ?? "—"}</Td>
                  <Td className="text-end text-ivory/70">{cat.experiences.length}</Td>
                  <Td className="text-end text-ivory/70">
                    {cat.experiences.reduce((sum, x) => sum + x.bookingCount, 0)}
                  </Td>
                  <Td>
                    <StatusPill
                      status={
                        cat.experiences.some((x) => x.status === "PUBLISHED")
                          ? "PUBLISHED"
                          : "DRAFT"
                      }
                    />
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-2">
                      <EditButton resourceKey="categories" id={cat.id} fields={fields} labels={dict.admin.crud} />
                      <DeleteButton resourceKey="categories" id={cat.id} labels={dict.admin.crud} />
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
