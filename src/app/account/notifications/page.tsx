import type { Metadata } from "next";
import { getDict, getLocale } from "@/lib/i18n";
import { requireUser } from "@/lib/auth/guards";
import { formatDate } from "@/lib/format";
import { listNotifications } from "@/server/services/notifications";
import { EmptyState } from "@/components/ui/States";
import { MarkAllReadButton } from "@/components/account/MarkAllReadButton";

export const metadata: Metadata = { robots: { index: false } };

export default async function AccountNotificationsPage() {
  const user = await requireUser("/account/notifications");
  const locale = await getLocale();
  const dict = getDict(locale);
  const notifications = await listNotifications(user.id, 50);
  const unread = notifications.filter((n) => !n.readAt).length;

  if (notifications.length === 0) {
    return <EmptyState title={dict.account.notificationsEmpty} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-ivory/55">
          {unread > 0 ? `${unread} · ` : ""}
          {dict.account.nav.notifications}
        </p>
        {unread > 0 ? (
          <MarkAllReadButton label={dict.account.markRead} />
        ) : null}
      </div>
      <ul className="space-y-2">
        {notifications.map((n) => (
          <li
            key={n.id}
            className={`rounded-xl border border-ivory/10 p-4 ${
              n.readAt ? "opacity-55" : "bg-ivory/[0.05]"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ivory">{n.title}</p>
                {n.body ? <p className="mt-0.5 text-sm text-ivory/60">{n.body}</p> : null}
              </div>
              <span className="shrink-0 font-mono text-[0.56rem] uppercase tracking-[0.16em] text-ivory/40">
                {formatDate(n.createdAt, locale)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
