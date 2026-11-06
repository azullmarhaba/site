import type { Metadata } from "next";
import { getDict, getLocale } from "@/lib/i18n";
import { formatDate } from "@/lib/format";
import { listAdminNotifications } from "@/server/services/admin";
import { AdminPanel, AdminTable, Th, Td, EmptyRow } from "@/components/admin/AdminKit";
import { DeleteButton } from "@/components/admin/ResourceCrud";

export const metadata: Metadata = { title: "Admin — Notifications" };

export default async function AdminNotificationsPage() {
  const locale = await getLocale();
  const dict = getDict(locale);
  const n = dict.admin.notifications;
  const notifications = await listAdminNotifications();

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl md:text-3xl">{n.title}</h1>
        <p className="mt-1 text-sm text-ivory/50">{notifications.length}</p>
      </header>

      <AdminPanel>
        <AdminTable minWidth={760}>
          <thead>
            <tr>
              <Th>{n.recipient}</Th>
              <Th>{n.type}</Th>
              <Th>{n.message}</Th>
              <Th>{n.status}</Th>
              <Th>{dict.admin.audit.at}</Th>
              <Th>{dict.admin.bookings.actions}</Th>
            </tr>
          </thead>
          <tbody>
            {notifications.length === 0 ? (
              <EmptyRow colSpan={6} message={n.empty} />
            ) : (
              notifications.map((item) => (
                <tr key={item.id} className="hover:bg-ivory/[0.03]">
                  <Td>
                    <p className="text-ivory">{item.user.name}</p>
                    <p className="text-xs text-ivory/45">{item.user.email}</p>
                  </Td>
                  <Td>
                    <span className="font-mono text-xs uppercase tracking-[0.14em] text-sand/80">
                      {item.type}
                    </span>
                  </Td>
                  <Td>
                    <p className="text-ivory/85">{item.title}</p>
                    <p className="line-clamp-2 max-w-md text-xs text-ivory/50">
                      {item.body}
                    </p>
                  </Td>
                  <Td>
                    <span
                      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 font-mono text-[0.56rem] uppercase tracking-[0.16em] ${
                        item.readAt
                          ? "border-ivory/25 bg-ivory/10 text-ivory/55"
                          : "border-sand/40 bg-sand/10 text-sand"
                      }`}
                    >
                      {item.readAt ? n.read : n.unread}
                    </span>
                  </Td>
                  <Td className="whitespace-nowrap text-ivory/55">
                    {formatDate(item.createdAt, locale)}
                  </Td>
                  <Td>
                    <div className="flex justify-end">
                      <DeleteButton resourceKey="notifications" id={item.id} labels={dict.admin.crud} />
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
