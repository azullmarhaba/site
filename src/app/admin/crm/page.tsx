import type { Metadata } from "next";
import Link from "next/link";
import { getDict, getLocale } from "@/lib/i18n";
import { formatPrice, formatDate } from "@/lib/format";
import { LEAD_STAGES, getCrmDashboard } from "@/server/services/crm";
import { AdminPanel, StatsCard } from "@/components/admin/AdminKit";
import { StagePill } from "@/components/admin/crm/StagePill";

export const metadata: Metadata = { title: "Admin — CRM" };

export default async function AdminCrmPage() {
  const locale = await getLocale();
  const dict = getDict(locale);
  const d = dict.admin.crm.dashboard;
  const stageLabels = dict.admin.crm.stage;
  const data = await getCrmDashboard();
  const maxStage = Math.max(1, ...LEAD_STAGES.map((s) => data.byStage[s]));
  const qualified = data.byStage.QUALIFIED + data.byStage.PROPOSAL;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl">{d.title}</h1>
          <p className="mt-1 text-sm text-ivory/50">{d.subtitle}</p>
        </div>
        <Link
          href="/admin/crm/clients"
          className="rounded-lg border border-ivory/15 px-4 py-2 text-sm text-ivory/80 hover:border-sand/50 hover:text-ivory"
        >
          {d.viewAll}
        </Link>
        <Link
          href="/admin/crm/leads"
          className="rounded-lg border border-ivory/15 px-4 py-2 text-sm text-ivory/80 hover:border-sand/50 hover:text-ivory"
        >
          {d.manageLeads}
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label={d.clients} value={data.totalClients} />
        <StatsCard label={d.openTasks} value={data.openTasks} />
        <StatsCard label={d.pipeline} value={qualified} />
        <StatsCard label={d.pipelineValue} value={formatPrice(data.pipelineMinor, locale)} />
      </div>

      <AdminPanel title={d.pipeline}>
        <ul className="space-y-2.5">
          {LEAD_STAGES.map((s) => {
            const count = data.byStage[s];
            return (
              <li key={s}>
                <Link
                  href={`/admin/crm/clients?stage=${s}`}
                  className="block rounded-lg px-2 py-1.5 hover:bg-ivory/[0.04]"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ivory/80">{stageLabels[s]}</span>
                    <span className="font-mono text-xs text-ivory/50">{count}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ivory/[0.06]">
                    <span
                      className="block h-full rounded-full bg-sand/70"
                      style={{ width: `${Math.round((count / maxStage) * 100)}%` }}
                    />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </AdminPanel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AdminPanel title={d.dueSoon}>
          {data.dueSoon.length === 0 ? (
            <p className="text-sm text-ivory/45">{d.noTasks}</p>
          ) : (
            <ul className="space-y-3">
              {data.dueSoon.map((t) => {
                const due = t.dueAt ? new Date(t.dueAt) : null;
                const overdue = t.overdue;
                return (
                  <li key={t.id} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/admin/crm/clients/${t.customer.id}`}
                        className="text-sm text-ivory hover:text-sand"
                      >
                        {t.title}
                      </Link>
                      <p className="text-xs text-ivory/45">
                        {t.customer.fullName}
                        {t.assignee ? ` · ${t.assignee.name}` : ""}
                      </p>
                    </div>
                    {due ? (
                      <span
                        className={`shrink-0 text-xs ${
                          overdue ? "text-clay" : "text-ivory/50"
                        }`}
                      >
                        {formatDate(due, locale)}
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </AdminPanel>

        <AdminPanel title={d.recentActivity}>
          {data.recentActivities.length === 0 ? (
            <p className="text-sm text-ivory/45">{d.noActivity}</p>
          ) : (
            <ul className="space-y-3">
              {data.recentActivities.map((a) => (
                <li key={a.id} className="min-w-0">
                  <p className="flex items-center gap-2 text-xs text-ivory/45">
                    <Link
                      href={`/admin/crm/clients/${a.customer.id}`}
                      className="text-ivory/80 hover:text-sand"
                    >
                      {a.customer.fullName}
                    </Link>
                    {a.author ? <span>{a.author.name}</span> : null}
                    <span>{formatDate(new Date(a.createdAt), locale)}</span>
                  </p>
                  <p className="mt-0.5 truncate text-sm text-ivory/70">{a.body}</p>
                </li>
              ))}
            </ul>
          )}
        </AdminPanel>
      </div>

      <AdminPanel title={d.recentClients}>
        {data.recentClients.length === 0 ? (
          <p className="text-sm text-ivory/45">—</p>
        ) : (
          <ul className="divide-y divide-ivory/[0.06]">
            {data.recentClients.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <Link href={`/admin/crm/clients/${c.id}`} className="text-sm text-ivory hover:text-sand">
                  {c.fullName}
                  <span className="ml-2 text-xs text-ivory/40">
                    {[c.city, c.country].filter(Boolean).join(", ")}
                  </span>
                </Link>
                <div className="flex items-center gap-3">
                  <StagePill stage={c.stage} label={stageLabels[c.stage as keyof typeof stageLabels] ?? c.stage} />
                  <span className="text-xs text-ivory/40">{formatDate(new Date(c.createdAt), locale)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>
    </div>
  );
}