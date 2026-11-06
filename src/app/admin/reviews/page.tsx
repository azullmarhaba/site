import type { Metadata } from "next";
import Link from "next/link";
import { getDict, getLocale } from "@/lib/i18n";
import { formatDate } from "@/lib/format";
import { listAdminReviews } from "@/server/services/admin";
import { AdminPanel, AdminTable, Th, Td, EmptyRow } from "@/components/admin/AdminKit";
import { StatusPill } from "@/components/admin/StatusPill";
import { ReviewActions } from "@/components/admin/ReviewActions";
import { DeleteButton } from "@/components/admin/ResourceCrud";

export const metadata: Metadata = { title: "Admin — Reviews" };

const STATUSES = ["PENDING", "APPROVED", "REJECTED"];

export default async function AdminReviewsPage(props: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await props.searchParams;
  const locale = await getLocale();
  const dict = getDict(locale);
  const r = dict.admin.reviews;
  const status = sp.status && STATUSES.includes(sp.status) ? sp.status : undefined;
  const reviews = await listAdminReviews(status);

  const tab = (value?: string, label?: string) => {
    const active = (status ?? "") === (value ?? "");
    return (
      <Link
        href={value ? `?status=${value}` : "?"}
        aria-current={active ? "page" : undefined}
        className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
          active
            ? "border-sand bg-sand text-obsidian"
            : "border-ivory/15 text-ivory/60 hover:border-sand hover:text-sand"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl md:text-3xl">{r.title}</h1>
        <nav className="mt-3 flex flex-wrap gap-2" aria-label="Filter">
          {tab(undefined, `${r.approve} / ${r.reject}`)}
          {tab("PENDING", r.pending)}
          {tab("APPROVED", r.approved)}
          {tab("REJECTED", r.rejected)}
        </nav>
      </header>

      <AdminPanel>
        <AdminTable minWidth={820}>
          <thead>
            <tr>
              <Th>{r.rating}</Th>
              <Th>{dict.admin.bookings.customer}</Th>
              <Th>{dict.admin.experiences.titleField}</Th>
              <Th>{r.body}</Th>
              <Th>{dict.admin.bookings.date}</Th>
              <Th>{dict.admin.bookings.status}</Th>
              <Th>{dict.admin.bookings.actions}</Th>
            </tr>
          </thead>
          <tbody>
            {reviews.length === 0 ? (
              <EmptyRow colSpan={7} message={r.empty} />
            ) : (
              reviews.map((rev) => (
                <tr key={rev.id} className="hover:bg-ivory/[0.03]">
                  <Td className="whitespace-nowrap text-sand">
                    {"★".repeat(rev.rating)}
                    <span className="text-ivory/30">{"★".repeat(5 - rev.rating)}</span>
                  </Td>
                  <Td>
                    <p className="text-ivory">{rev.customer.fullName}</p>
                    <p className="text-xs text-ivory/45">{rev.customer.user.email}</p>
                  </Td>
                  <Td>
                    <Link
                      href={`/experiences/${rev.experience.slug}`}
                      className="text-ivory/75 hover:text-sand"
                    >
                      {rev.experience.title}
                    </Link>
                  </Td>
                  <Td>
                    {rev.title ? <p className="font-medium text-ivory">{rev.title}</p> : null}
                    <p className="line-clamp-2 max-w-md text-ivory/60">{rev.body}</p>
                  </Td>
                  <Td className="whitespace-nowrap text-ivory/60">
                    {formatDate(rev.createdAt, locale)}
                  </Td>
                  <Td>
                    <StatusPill status={rev.status} />
                  </Td>
                  <Td>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <ReviewActions
                        reviewId={rev.id}
                        status={rev.status}
                        labels={{
                          approve: r.approve,
                          reject: r.reject,
                          moderated: r.moderated,
                        }}
                      />
                      <DeleteButton resourceKey="reviews" id={rev.id} labels={dict.admin.crud} />
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
