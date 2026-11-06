import type { Metadata } from "next";
import { getDict, getLocale } from "@/lib/i18n";
import { formatDate } from "@/lib/format";
import { listAdminUsers } from "@/server/services/admin";
import { AdminPanel, AdminTable, Th, Td, EmptyRow } from "@/components/admin/AdminKit";
import { StatusPill } from "@/components/admin/StatusPill";
import { RoleToggles } from "@/components/admin/RoleToggles";
import { CreateButton, EditButton, DeleteButton } from "@/components/admin/ResourceCrud";
import { usersFields } from "@/components/admin/crud-fields";

export const metadata: Metadata = { title: "Admin — Users" };

export default async function AdminUsersPage() {
  const locale = await getLocale();
  const dict = getDict(locale);
  const u = dict.admin.users;
  const users = await listAdminUsers();
  const fields = usersFields(dict);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl">{u.title}</h1>
          <p className="mt-1 text-sm text-ivory/50">{users.length}</p>
        </div>
        <CreateButton resourceKey="users" fields={fields} labels={dict.admin.crud} title={dict.admin.crud.add} />
      </header>

      <AdminPanel>
        <AdminTable minWidth={1020}>
          <thead>
            <tr>
              <Th>{u.name}</Th>
              <Th>{u.email}</Th>
              <Th>{u.roles}</Th>
              <Th>{dict.admin.nav.audit}</Th>
              <Th>{u.status}</Th>
              <Th>{dict.admin.bookings.actions}</Th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <EmptyRow colSpan={6} message={u.empty} />
            ) : (
              users.map((usr) => (
                <tr key={usr.id} className="hover:bg-ivory/[0.03]">
                  <Td>
                    <p className="text-ivory">{usr.name}</p>
                    {usr.phone ? <p className="text-xs text-ivory/45">{usr.phone}</p> : null}
                  </Td>
                  <Td className="text-ivory/70">
                    {usr.email}
                    <span className="block text-xs text-ivory/40">
                      {usr.emailVerifiedAt ? "✓" : "—"}
                    </span>
                  </Td>
                  <Td>
                    <RoleToggles
                      userId={usr.id}
                      activeRoles={usr.roles.map((r) => r.role.name)}
                      labels={{ roles: u.roles }}
                    />
                  </Td>
                  <Td className="whitespace-nowrap text-ivory/55">
                    {formatDate(usr.createdAt, locale)}
                  </Td>
                  <Td>
                    <StatusPill status={usr.status} />
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-2">
                      <EditButton resourceKey="users" id={usr.id} fields={fields} labels={dict.admin.crud} />
                      <DeleteButton resourceKey="users" id={usr.id} labels={dict.admin.crud} />
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
