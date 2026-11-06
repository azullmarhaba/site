import type { Metadata } from "next";
import { getDict, getLocale } from "@/lib/i18n";
import { listAdminFaqs, listAdminExperiences } from "@/server/services/admin";
import { AdminPanel, AdminTable, Th, Td, EmptyRow } from "@/components/admin/AdminKit";
import { StatusPill } from "@/components/admin/StatusPill";
import { CreateButton, EditButton, DeleteButton } from "@/components/admin/ResourceCrud";
import { faqsFields } from "@/components/admin/crud-fields";

export const metadata: Metadata = { title: "Admin — FAQs" };

export default async function AdminFaqsPage() {
  const locale = await getLocale();
  const dict = getDict(locale);
  const [faqs, experiences] = await Promise.all([
    listAdminFaqs(),
    listAdminExperiences(),
  ]);
  const fields = faqsFields(dict, {
    experiences: experiences.map((x) => ({ value: x.id, label: x.title })),
  });

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl">{dict.admin.nav.faqs}</h1>
          <p className="mt-1 text-sm text-ivory/50">{faqs.length}</p>
        </div>
        <CreateButton resourceKey="faqs" fields={fields} labels={dict.admin.crud} title={dict.admin.crud.add} />
      </header>

      <AdminPanel>
        <AdminTable minWidth={820}>
          <thead>
            <tr>
              <Th>{dict.faq.title}</Th>
              <Th>{dict.admin.experiences.description}</Th>
              <Th>{dict.admin.experiences.category}</Th>
              <Th>{dict.admin.bookings.status}</Th>
              <Th>{dict.admin.bookings.actions}</Th>
            </tr>
          </thead>
          <tbody>
            {faqs.length === 0 ? (
              <EmptyRow colSpan={5} message={dict.common.empty} />
            ) : (
              faqs.map((f) => (
                <tr key={f.id} className="hover:bg-ivory/[0.03]">
                  <Td className="text-ivory">{f.question}</Td>
                  <Td>
                    <p className="line-clamp-2 max-w-md text-ivory/60">{f.answer}</p>
                  </Td>
                  <Td className="text-ivory/55">{f.category ?? f.experience?.title ?? "—"}</Td>
                  <Td>
                    <StatusPill status={f.active ? "PUBLISHED" : "DRAFT"} />
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-2">
                      <EditButton resourceKey="faqs" id={f.id} fields={fields} labels={dict.admin.crud} />
                      <DeleteButton resourceKey="faqs" id={f.id} labels={dict.admin.crud} />
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
