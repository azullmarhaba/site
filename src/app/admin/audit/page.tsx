import type { Metadata } from "next";
import { getDict, getLocale } from "@/lib/i18n";
import { formatDate } from "@/lib/format";
import { listAdminAuditLogs } from "@/server/services/admin";
import { AdminPanel, AdminTable, Th, Td, EmptyRow } from "@/components/admin/AdminKit";

export const metadata: Metadata = { title: "Admin — Audit logs" };

export default async function AdminAuditPage() {
  const locale = await getLocale();
  const dict = getDict(locale);
  const a = dict.admin.audit;
  const logs = await listAdminAuditLogs();

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl md:text-3xl">{a.title}</h1>
        <p className="mt-1 text-sm text-ivory/50">{logs.length}</p>
      </header>

      <AdminPanel>
        <AdminTable minWidth={780}>
          <thead>
            <tr>
              <Th>{a.at}</Th>
              <Th>{a.actor}</Th>
              <Th>{a.action}</Th>
              <Th>{a.entity}</Th>
              <Th>{dict.common.details}</Th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <EmptyRow colSpan={5} message={a.empty} />
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-ivory/[0.03]">
                  <Td className="whitespace-nowrap text-ivory/55">
                    {formatDate(log.createdAt, locale)}
                  </Td>
                  <Td>
                    <p className="text-ivory">{log.actor?.name ?? "system"}</p>
                    <p className="text-xs text-ivory/45">{log.actor?.email ?? "—"}</p>
                  </Td>
                  <Td>
                    <span className="font-mono text-xs uppercase tracking-[0.14em] text-sand/80">
                      {log.action}
                    </span>
                  </Td>
                  <Td className="text-ivory/70">
                    {log.entity}
                    {log.entityId ? (
                      <span className="block font-mono text-[0.55rem] text-ivory/35">
                        {log.entityId}
                      </span>
                    ) : null}
                  </Td>
                  <Td className="max-w-md">
                    <p className="truncate font-mono text-[0.6rem] text-ivory/45">
                      {log.diff ? JSON.stringify(log.diff) : "—"}
                    </p>
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
