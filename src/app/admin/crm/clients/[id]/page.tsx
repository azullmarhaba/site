import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDict, getLocale } from "@/lib/i18n";
import { formatPrice, formatDate } from "@/lib/format";
import { LEAD_STAGES, getCrmClient, listCrmStaff, listCrmTags } from "@/server/services/crm";
import { AdminPanel, AdminTable, Th, Td, EmptyRow } from "@/components/admin/AdminKit";
import { StatusPill } from "@/components/admin/StatusPill";
import { StagePill } from "@/components/admin/crm/StagePill";
import { CrmQualificationForm } from "@/components/admin/crm/CrmQualificationForm";
import { CrmTimeline } from "@/components/admin/crm/CrmTimeline";
import { CrmTasks } from "@/components/admin/crm/CrmTasks";
import { PdfLink } from "@/components/documents/PdfLink";

export const metadata: Metadata = { title: "Admin — CRM client" };

export default async function AdminCrmClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = await getLocale();
  const dict = getDict(locale);
  const c = dict.admin.crm.client;
  const stageLabels = dict.admin.crm.stage;

  const [client, staff, allTags] = await Promise.all([
    getCrmClient(id),
    listCrmStaff(),
    listCrmTags(),
  ]);
  if (!client) notFound();

  const stageOptions = LEAD_STAGES.map((s) => ({ value: s, label: stageLabels[s] }));

  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin/crm/clients" className="text-sm text-ivory/50 hover:text-sand">
          ← {c.back}
        </Link>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl">{client.fullName}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ivory/55">
            {client.user.email}
            <StatusPill status={client.user.status} />
            <StagePill
              stage={client.stage}
              label={stageLabels[client.stage as keyof typeof stageLabels] ?? client.stage}
            />
          </p>
          <p className="mt-1 text-xs text-ivory/40">
            {c.memberSince} {formatDate(new Date(client.user.createdAt), locale)}
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="text-end">
            <p className="font-mono text-[0.55rem] uppercase tracking-[0.18em] text-ivory/45">
              {c.spent}
            </p>
            <p className="text-sand">{formatPrice(client.spentMinor, locale)}</p>
          </div>
          <div className="text-end">
            <p className="font-mono text-[0.55rem] uppercase tracking-[0.18em] text-ivory/45">
              {c.bookings}
            </p>
            <p className="text-ivory/80">{client.bookings.length}</p>
          </div>
          <div className="text-end">
            <p className="font-mono text-[0.55rem] uppercase tracking-[0.18em] text-ivory/45">
              {c.tripPlans}
            </p>
            <p className="text-ivory/80">{client.tripPlans.length}</p>
          </div>
        </div>
      </header>

      <AdminPanel title={c.qualification}>
        <CrmQualificationForm
          customerId={client.id}
          initialStage={client.stage}
          initialSource={client.source}
          initialOwnerId={client.ownerId ?? null}
          initialTags={client.tags.map((t) => ({ id: t.id, name: t.name }))}
          stages={stageOptions}
          staff={staff}
          allTags={allTags.map((t) => ({ id: t.id, name: t.name }))}
          labels={{
            stage: c.stage,
            ownerLabel: c.ownerLabel,
            source: c.source,
            tags: c.tags,
            save: c.save,
            saved: c.saved,
            tagPlaceholder: c.tagPlaceholder,
            unassigned: c.unassigned,
          }}
        />
      </AdminPanel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AdminPanel title={c.timeline}>
          <CrmTimeline
            customerId={client.id}
            items={client.crmActivities.map((a) => ({
              id: a.id,
              type: a.type,
              body: a.body,
              createdAt: new Date(a.createdAt).toISOString(),
              authorName: a.author?.name ?? null,
            }))}
            labels={{
              timeline: c.timeline,
              addNote: c.addNote,
              notePlaceholder: c.notePlaceholder,
              submit: c.submit,
              noActivity: c.noActivity,
              activityType: c.activityType,
              removeActivity: c.removeActivity,
            }}
            locale={locale}
          />
        </AdminPanel>

        <AdminPanel title={c.followUps}>
          <CrmTasks
            customerId={client.id}
            items={client.crmTasks.map((t) => ({
              id: t.id,
              title: t.title,
              status: t.status,
              dueAt: t.dueAt ? new Date(t.dueAt).toISOString() : null,
              assigneeName: t.assignee?.name ?? null,
            }))}
            staff={staff}
            labels={{
              followUps: c.followUps,
              newTask: c.newTask,
              taskPlaceholder: c.taskPlaceholder,
              assignee: c.assignee,
              due: c.due,
              open: c.open,
              done: c.done,
              noTasks: c.noTasks,
              unassigned: c.unassigned,
            }}
            locale={locale}
          />
        </AdminPanel>
      </div>

      <AdminPanel title={c.bookings}>
        <AdminTable minWidth={720}>
          <thead>
            <tr>
              <Th>{c.plan}</Th>
              <Th>{c.due}</Th>
              <Th>{c.stage}</Th>
              <Th className="text-end">{c.spent}</Th>
              <Th className="text-end">{c.contract}</Th>
            </tr>
          </thead>
          <tbody>
            {client.bookings.length === 0 ? (
              <EmptyRow colSpan={5} message={c.emptyBookings} />
            ) : (
              client.bookings.map((b) => (
                <tr key={b.id} className="hover:bg-ivory/[0.03]">
                  <Td>
                    <Link href={`/admin/bookings/${b.id}`} className="text-ivory hover:text-sand">
                      {b.reference}
                    </Link>
                    <p className="text-xs text-ivory/45">{b.experience?.title ?? "—"}</p>
                  </Td>
                  <Td className="whitespace-nowrap text-ivory/60">{formatDate(new Date(b.date), locale)}</Td>
                  <Td>
                    <StatusPill status={b.status} />
                  </Td>
                  <Td className="whitespace-nowrap text-end text-sand">
                    {formatPrice(b.totalMinor, locale)}
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-2">
                      <PdfLink
                        kind="contract"
                        reference={b.reference}
                        label={c.contract}
                        className="h-8 px-3 text-xs"
                      />
                      {b.status === "CANCELLED" || b.status === "REFUNDED" ? (
                        <PdfLink
                          kind="cancellation"
                          reference={b.reference}
                          label={dict.documents.cancellationTitle}
                          className="h-8 px-3 text-xs"
                        />
                      ) : null}
                    </div>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </AdminTable>
      </AdminPanel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AdminPanel title={c.tripPlans}>
          {client.tripPlans.length === 0 ? (
            <p className="text-sm text-ivory/45">{c.emptyPlans}</p>
          ) : (
            <ul className="divide-y divide-ivory/[0.06]">
              {client.tripPlans.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm text-ivory">{p.title}</p>
                    <p className="text-xs text-ivory/45">
                      {p.days} {c.days} · {formatDate(new Date(p.createdAt), locale)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-sand">{formatPrice(p.totalMinor, locale)}</span>
                    <PdfLink
                      kind="trip-plan"
                      reference={p.shareSlug}
                      label={c.contract}
                      className="h-8 px-3 text-xs"
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AdminPanel>

        <AdminPanel title={c.messages}>
          {client.messages.length === 0 ? (
            <p className="text-sm text-ivory/45">{c.emptyMessages}</p>
          ) : (
            <ul className="space-y-3">
              {client.messages.map((m) => (
                <li key={m.id} className="min-w-0">
                  <p className="flex items-center gap-2 text-sm text-ivory">
                    <span className="truncate">{m.subject}</span>
                    <StatusPill status={m.status} />
                    <span className="text-xs text-ivory/40">{formatDate(new Date(m.createdAt), locale)}</span>
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-ivory/60">{m.message}</p>
                </li>
              ))}
            </ul>
          )}
        </AdminPanel>
      </div>

      <AdminPanel title={c.reviews}>
        {client.reviews.length === 0 ? (
          <p className="text-sm text-ivory/45">{c.emptyReviews}</p>
        ) : (
          <ul className="divide-y divide-ivory/[0.06]">
            {client.reviews.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <span className="text-sm text-ivory">
                  {r.title || "—"}
                  <span className="ml-2 text-sand">{"★".repeat(r.rating)}</span>
                </span>
                <div className="flex items-center gap-2">
                  <StatusPill status={r.status} />
                  <span className="text-xs text-ivory/40">{formatDate(new Date(r.createdAt), locale)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>
    </div>
  );
}