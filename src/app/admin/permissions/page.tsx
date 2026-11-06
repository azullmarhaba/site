import type { Metadata } from "next";
import { getDict, getLocale } from "@/lib/i18n";
import { listAdminPermissions, listAdminRoles } from "@/server/services/admin";
import { AdminPanel, AdminTable, Th, Td, EmptyRow } from "@/components/admin/AdminKit";

export const metadata: Metadata = { title: "Admin — Permissions" };

export default async function AdminPermissionsPage() {
  const locale = await getLocale();
  const dict = getDict(locale);
  const [permissions, roles] = await Promise.all([
    listAdminPermissions(),
    listAdminRoles(),
  ]);
  const roleName = new Map(roles.map((r) => [r.id, r.name]));

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl md:text-3xl">{dict.admin.nav.permissions}</h1>
        <p className="mt-1 text-sm text-ivory/50">{permissions.length}</p>
      </header>

      <AdminPanel>
        <AdminTable minWidth={640}>
          <thead>
            <tr>
              <Th>{dict.admin.nav.permissions}</Th>
              <Th>{dict.admin.experiences.description}</Th>
              <Th>{dict.admin.nav.roles}</Th>
            </tr>
          </thead>
          <tbody>
            {permissions.length === 0 ? (
              <EmptyRow colSpan={3} message={dict.common.empty} />
            ) : (
              permissions.map((p) => (
                <tr key={p.id} className="hover:bg-ivory/[0.03]">
                  <Td>
                    <span className="font-mono text-sm text-sand">{p.key}</span>
                  </Td>
                  <Td className="text-ivory/65">{p.description ?? "—"}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-1.5">
                      {p.roles.length === 0 ? (
                        <span className="text-xs text-ivory/40">—</span>
                      ) : (
                        p.roles.map((r) => (
                          <span
                            key={r.roleId}
                            className="rounded-full border border-ivory/15 px-2 py-0.5 font-mono text-[0.55rem] text-ivory/60"
                          >
                            {roleName.get(r.roleId) ?? r.roleId}
                          </span>
                        ))
                      )}
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
