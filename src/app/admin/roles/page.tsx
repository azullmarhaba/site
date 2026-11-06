import type { Metadata } from "next";
import { getDict, getLocale } from "@/lib/i18n";
import { listAdminRoles, listAdminPermissions } from "@/server/services/admin";
import { AdminPanel, AdminTable, Th, Td, EmptyRow } from "@/components/admin/AdminKit";

export const metadata: Metadata = { title: "Admin — Roles" };

export default async function AdminRolesPage() {
  const locale = await getLocale();
  const dict = getDict(locale);
  const [roles, permissions] = await Promise.all([listAdminRoles(), listAdminPermissions()]);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl md:text-3xl">{dict.admin.nav.roles}</h1>
        <p className="mt-1 text-sm text-ivory/50">
          {dict.admin.users.roles} · {permissions.length} {dict.admin.nav.permissions}
        </p>
      </header>

      <AdminPanel>
        <AdminTable minWidth={700}>
          <thead>
            <tr>
              <Th>{dict.admin.nav.roles}</Th>
              <Th>{dict.admin.users.roles}</Th>
              <Th>{dict.admin.nav.permissions}</Th>
            </tr>
          </thead>
          <tbody>
            {roles.length === 0 ? (
              <EmptyRow colSpan={3} message={dict.common.empty} />
            ) : (
              roles.map((role) => (
                <tr key={role.id} className="hover:bg-ivory/[0.03]">
                  <Td>
                    <span className="font-mono text-sm text-sand">{role.name}</span>
                    {role.description ? (
                      <p className="text-xs text-ivory/45">{role.description}</p>
                    ) : null}
                  </Td>
                  <Td className="text-ivory/70">{role.users.length}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-1.5">
                      {role.permissions.length === 0 ? (
                        <span className="text-xs text-ivory/40">—</span>
                      ) : (
                        role.permissions.map((p) => (
                          <span
                            key={p.permission.id}
                            className="rounded-full border border-ivory/15 px-2 py-0.5 font-mono text-[0.55rem] text-ivory/60"
                          >
                            {p.permission.key}
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
