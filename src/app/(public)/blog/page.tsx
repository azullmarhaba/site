import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getDict, getLocale } from "@/lib/i18n";
import { listPosts } from "@/server/services/content";
import { Reveal } from "@/components/motion/Reveal";
import { Section, SectionHead } from "@/components/ui/Section";
import { EmptyState } from "@/components/ui/States";
import { formatDate } from "@/lib/format";
import { siteConfig } from "@/config/site";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDict(await getLocale());
  return {
    title: dict.blog.title,
    description: dict.blog.lead,
    alternates: { canonical: "/blog" },
  };
}

export default async function BlogPage() {
  const locale = await getLocale();
  const dict = getDict(locale);
  const b = dict.blog;
  const posts = await listPosts();

  return (
    <Section tone="obsidian">
      <div className="container-azul">
        <SectionHead as="h1" eyebrow={siteConfig.descriptor} title={b.title} lead={b.lead} />

        {posts.length === 0 ? (
          <EmptyState title={b.empty} />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, i) => (
              <Reveal key={post.id} delay={(i % 3) * 0.08}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl border border-ivory/10 bg-deep transition-colors hover:border-sand/50"
                >
                  <div className="relative aspect-[16/9] overflow-hidden">
                    {post.coverImage ? (
                      <Image
                        src={post.coverImage.path}
                        alt={post.coverImage.alt ?? post.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-carbon to-obsidian" />
                    )}
                    <span className="absolute start-4 top-4 rounded-full border border-ivory/25 bg-obsidian/70 px-3 py-1 font-mono text-[0.56rem] uppercase tracking-[0.2em] text-ivory/80 backdrop-blur">
                      {post.category?.name ?? ""}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-6">
                    <h2 className="text-xl leading-snug transition-colors group-hover:text-sand">
                      {post.title}
                    </h2>
                    {post.excerpt ? (
                      <p className="text-sm leading-relaxed text-ivory/60 line-clamp-3">
                        {post.excerpt}
                      </p>
                    ) : null}
                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-ivory/10 pt-4 font-mono text-[0.58rem] uppercase tracking-[0.16em] text-ivory/45">
                      <span>
                        {b.by} {post.authorName}
                      </span>
                      <span>
                        {post.publishedAt ? formatDate(post.publishedAt, locale) : ""} ·{" "}
                        {post.readingMinutes} {b.minRead}
                      </span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}
