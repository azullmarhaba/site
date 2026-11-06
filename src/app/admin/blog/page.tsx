import type { Metadata } from "next";
import Link from "next/link";
import { getDict, getLocale } from "@/lib/i18n";
import { formatDate } from "@/lib/format";
import { listAdminPosts, listAdminBlogCategories } from "@/server/services/admin";
import { AdminPanel, AdminTable, Th, Td, EmptyRow } from "@/components/admin/AdminKit";
import { StatusPill } from "@/components/admin/StatusPill";
import { PostToggle } from "@/components/admin/PostToggle";
import { CreateButton, EditButton, DeleteButton } from "@/components/admin/ResourceCrud";
import { postsFields } from "@/components/admin/crud-fields";

export const metadata: Metadata = { title: "Admin — Blog" };

export default async function AdminBlogPage() {
  const locale = await getLocale();
  const dict = getDict(locale);
  const b = dict.admin.blog;
  const [posts, categories] = await Promise.all([
    listAdminPosts(),
    listAdminBlogCategories(),
  ]);
  const fields = postsFields(dict, {
    categories: categories.map((c) => ({ value: c.id, label: c.name })),
  });

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl">{b.title}</h1>
          <p className="mt-1 text-sm text-ivory/50">{posts.length}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/blog" className="text-sm text-sand hover:underline">
            {dict.common.viewAll} →
          </Link>
          <CreateButton resourceKey="posts" fields={fields} labels={dict.admin.crud} title={dict.admin.crud.add} />
        </div>
      </header>

      <AdminPanel>
        <AdminTable minWidth={860}>
          <thead>
            <tr>
              <Th>{b.postTitle}</Th>
              <Th>{b.status}</Th>
              <Th>{b.readingTime}</Th>
              <Th>{dict.admin.bookings.date}</Th>
              <Th>{dict.admin.bookings.actions}</Th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <EmptyRow colSpan={5} message={b.empty} />
            ) : (
              posts.map((p) => (
                <tr key={p.id} className="hover:bg-ivory/[0.03]">
                  <Td>
                    <p className="text-ivory">{p.title}</p>
                    <p className="text-xs text-ivory/45">
                      /{p.slug}
                      {p.category ? ` · ${p.category.name}` : ""}
                      {p.authorName ? ` · ${p.authorName}` : ""}
                    </p>
                  </Td>
                  <Td>
                    <StatusPill status={p.status} />
                  </Td>
                  <Td className="text-ivory/65">{p.readingMinutes} min</Td>
                  <Td className="whitespace-nowrap text-ivory/60">
                    {p.publishedAt ? formatDate(p.publishedAt, locale) : "—"}
                  </Td>
                  <Td>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <PostToggle
                        postId={p.id}
                        status={p.status}
                        labels={{
                          publish: dict.admin.experiences.publish,
                          unpublish: dict.admin.experiences.unpublish,
                        }}
                      />
                      <EditButton resourceKey="posts" id={p.id} fields={fields} labels={dict.admin.crud} />
                      <DeleteButton resourceKey="posts" id={p.id} labels={dict.admin.crud} />
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
