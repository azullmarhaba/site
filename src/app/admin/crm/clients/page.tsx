import type { Metadata } from "next";
import Link from "next/link";
import { getDict, getLocale } from "@/lib/i18n";
import { formatPrice, formatDate } from "@/lib/format";
import { LEAD_STAGES, listCrmClients, listCrmStaff, listCrmTags } from "@/server/services/crm";
import { AdminPanel, AdminTable, Th, Td, EmptyRow } from "@/components/admin/AdminKit";
import { StatusPill } from "@/components/admin/StatusPill";
import { StagePill } from "@/components/admin/crm/StagePill";
import { CrmFilters } from "@/components/admin/crm/CrmFilters";

export const metadata: Metadata = { title: "Admin — CRM clients" };

export default async function AdminCrmClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; stage?: string; ownerId?: string; tagId?: string }>;
}) {
  const sp = await searchParams;
  const locale = await getLocale();
  const dict = getDict(locale);
  const c = dict.admin.crm.clients;
  const stageLabels = dict.admin.crm.stage;

  const [clients, staff, tags] = await Promise.all([
    listCrmClients({ q: sp.q, stage: sp.stage, ownerId: sp.ownerId, tagId: sp.tagId }),
    listCrmStaff(),
    listCrmTags(),
  ]);

  const stageOptions = LEAD_STAGES.map((s) => ({ value: s, label: stageLabels[s] }));

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl md:text-3xl">{c.title}</h1>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ivory/50">{clients.length}</p>
          <Link href="/admin/crm/leads" className="text-sm text-sand hover:underline">{c.manageLeads}</Link>
        </div>
      </header>

      <AdminPanel>
        <CrmFilters
          labels={{
            searchPlaceholder: c.searchPlaceholder,
            allStages: c.allStages,
            allOwners: c.allOwners,
            allTags: c.allTags,
            stage: c.stage,
            owner: c.owner,
            tag: c.tag,
          }}
          stages={stageOptions}
          owners={staff}
          tags={tags.map((t) => ({ id: t.id, name: t.name }))}
        />
      </AdminPanel>

      <AdminPanel>
        <AdminTable minWidth={1080}>
          <thead>
            <tr>
              <Th>{c.name}</Th>
              <Th>{c.email}</Th>
              <Th>{c.location}</Th>
              <Th>{c.stage}</Th>
              <Th>{c.owner}</Th>
              <Th className="text-end">{c.bookings}</Th>
              <Th className="text-end">{c.plans}</Th>
              <Th className="text-end">{c.spent}</Th>
              <Th>{c.lastActivity}</Th>
              <Th className="text-end">{c.openTasks}</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 ? (
              <EmptyRow colSpan={11} message={c.empty} />
            ) : (
              clients.map((cl) => {
                const last = cl.lastContactedAt ?? cl.lastBookingAt ?? cl.createdAt;
                return (
                  <tr key={cl.id} className="hover:bg-ivory/[0.03]">
                    <Td>
                      <p className="text-ivory">{cl.fullName}</p>
                      {cl.phone ? <p className="text-xs text-ivory/45">{cl.phone}</p> : null}
                    </Td>
                    <Td className="text-ivory/70">
                      {cl.email}
                      <span className="mt-0.5 block">
                        <StatusPill status={cl.userStatus} />
                      </span>
                    </Td>
                    <Td className="text-ivory/60">
                      {[cl.city, cl.country].filter(Boolean).join(", ") || "—"}
                    </Td>
                    <Td>
                      <StagePill
                        stage={cl.stage}
                        label={stageLabels[cl.stage as keyof typeof stageLabels] ?? cl.stage}
                      />
                    </Td>
                    <Td className="text-ivory/60">{cl.owner?.name ?? "—"}</Td>
                    <Td className="text-end text-ivory/70">{cl.bookingCount}</Td>
                    <Td className="text-end text-ivory/70">{cl.tripPlanCount}</Td>
                    <Td className="whitespace-nowrap text-end text-sand">
                      {formatPrice(cl.spentMinor, locale)}
                    </Td>
                    <Td className="whitespace-nowrap text-ivory/55">
                      {formatDate(new Date(last), locale)}
                    </Td>
                    <Td className="text-end text-ivory/70">{cl.openTaskCount}</Td>
                    <Td>
                      <Link
                        href={`/admin/crm/clients/${cl.id}`}
                        className="whitespace-nowrap text-sm text-sand hover:underline"
                      >
                        {c.open}
                      </Link>
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