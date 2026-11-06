import type { Metadata } from "next";
import Link from "next/link";
import { getDict, getLocale } from "@/lib/i18n";
import { listCrmLeads, listCrmStaff } from "@/server/services/crm";
import { AdminPanel } from "@/components/admin/AdminKit";
import { CrmLeadsManager } from "@/components/admin/crm/CrmLeadsManager";

export const metadata: Metadata = { title: "Admin — CRM leads" };

export default async function AdminCrmLeadsPage() {
  const locale = await getLocale();
  const dict = getDict(locale);
  const [leads, staff] = await Promise.all([listCrmLeads(), listCrmStaff()]);
  const labels = dict.admin.crm.leads;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl">{labels.title}</h1>
          <p className="mt-1 text-sm text-ivory/50">{leads.length}</p>
        </div>
        <Link href="/admin/crm/clients" className="rounded-full border border-ivory/20 px-4 py-2 text-sm text-ivory/75 hover:border-sand hover:text-ivory">{dict.admin.crm.clients.title}</Link>
      </header>
      <AdminPanel>
        <CrmLeadsManager
          leads={leads.map((lead) => ({
            id: lead.id,
            fullName: lead.fullName,
            email: lead.email,
            phone: lead.phone,
            source: lead.source,
            stage: lead.stage,
            owner: lead.owner,
            convertedCustomer: lead.convertedCustomer,
          }))}
          staff={staff.map(({ id, name }) => ({ id, name }))}
          stageLabels={dict.admin.crm.stage}
          labels={labels}
        />
      </AdminPanel>
    </div>
  );
}
