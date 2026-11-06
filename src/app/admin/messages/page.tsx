import type { Metadata } from "next";
import { getDict, getLocale } from "@/lib/i18n";
import { formatDate } from "@/lib/format";
import { listAdminMessages } from "@/server/services/admin";
import { AdminPanel, AdminTable, Th, Td, EmptyRow } from "@/components/admin/AdminKit";
import { StatusPill } from "@/components/admin/StatusPill";
import { MessageActions } from "@/components/admin/MessageActions";
import { DeleteButton } from "@/components/admin/ResourceCrud";

export const metadata: Metadata = { title: "Admin — Messages" };

export default async function AdminMessagesPage() {
  const locale = await getLocale();
  const dict = getDict(locale);
  const m = dict.admin.messages;
  const messages = await listAdminMessages();

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl md:text-3xl">{m.title}</h1>
        <p className="mt-1 text-sm text-ivory/50">{messages.length}</p>
      </header>

      <AdminPanel>
        <AdminTable minWidth={880}>
          <thead>
            <tr>
              <Th>{m.from}</Th>
              <Th>{m.subject}</Th>
              <Th>{dict.contact.message}</Th>
              <Th>{m.received}</Th>
              <Th>{dict.admin.bookings.status}</Th>
              <Th>{dict.admin.bookings.actions}</Th>
            </tr>
          </thead>
          <tbody>
            {messages.length === 0 ? (
              <EmptyRow colSpan={6} message={m.empty} />
            ) : (
              messages.map((msg) => (
                <tr key={msg.id} className="hover:bg-ivory/[0.03]">
                  <Td>
                    <p className="text-ivory">{msg.name}</p>
                    <p className="text-xs text-ivory/45">{msg.email}</p>
                    {msg.phone ? <p className="text-xs text-ivory/40">{msg.phone}</p> : null}
                  </Td>
                  <Td className="text-ivory/75">
                    {msg.subject ?? "—"}
                    <span className="block font-mono text-[0.55rem] uppercase tracking-[0.16em] text-ivory/35">
                      {msg.locale}
                    </span>
                  </Td>
                  <Td>
                    <p className="line-clamp-3 max-w-sm text-ivory/60">{msg.message}</p>
                  </Td>
                  <Td className="whitespace-nowrap text-ivory/60">
                    {formatDate(msg.createdAt, locale)}
                  </Td>
                  <Td>
                    <StatusPill status={msg.status} />
                  </Td>
                  <Td>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <MessageActions
                        messageId={msg.id}
                        status={msg.status}
                        labels={{
                          open: m.open,
                          markProgress: m.markProgress,
                          markResolved: m.markResolved,
                        }}
                      />
                      <DeleteButton resourceKey="messages" id={msg.id} labels={dict.admin.crud} />
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
