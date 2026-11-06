import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { getDict, getLocale } from "@/lib/i18n";
import { getPost } from "@/server/services/content";
import { Section } from "@/components/ui/Section";
import { formatDate } from "@/lib/format";
import { siteConfig } from "@/config/site";
import { blogPostJsonLd, JsonLdSlot } from "@/components/seo/JsonLd";

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const locale = await getLocale();
  const dict = getDict(locale);
  const post = await getPost(slug);
  if (!post) return { title: dict.errors.notFoundTitle };
  return {
    title: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt ?? dict.blog.lead,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      type: "article",
      images: post.coverImage ? [{ url: post.coverImage.path }] : undefined,
    },
  };
}

export default async function BlogPostPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const locale = await getLocale();
  const dict = getDict(locale);
  const b = dict.blog;
  const post = await getPost(slug);
  if (!post) notFound();

  const paragraphs = post.body.split(/\n+/).filter((p) => p.trim().length > 0);

  const jsonLd = blogPostJsonLd({
    url: `${siteConfig.url}/blog/${post.slug}`,
    title: post.title,
    description: post.seoDescription ?? post.excerpt ?? "",
    datePublished: (post.publishedAt ?? post.createdAt).toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: post.authorName ?? siteConfig.name,
    image: post.coverImage?.path,
  });

  return (
    <>
      <JsonLdSlot data={jsonLd} />
      <header className="bg-obsidian pb-12 pt-32 text-ivory md:pt-40">
        <div className="container-azul max-w-3xl">
          <Link
            href="/blog"
            className="mb-6 inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-ivory/60 transition-colors hover:text-sand"
          >
            <ArrowLeft className="size-3.5 rtl:rotate-180" aria-hidden="true" />
            {b.backTo}
          </Link>
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-sand">
            {post.category?.name ?? ""}
          </p>
          <h1 className="mt-3 text-3xl md:text-4xl lg:text-5xl">{post.title}</h1>
          <p className="mt-4 text-sm text-ivory/55">
            {b.by} {post.authorName} · {post.publishedAt ? formatDate(post.publishedAt, locale) : ""} ·{" "}
            {post.readingMinutes} {b.minRead}
          </p>
        </div>
      </header>

      {post.coverImage ? (
        <div className="relative aspect-[21/9] w-full overflow-hidden bg-obsidian">
          <Image
            src={post.coverImage.path}
            alt={post.coverImage.alt ?? post.title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
      ) : null}

      <Section tone="ivory">
        <article className="container-azul max-w-3xl">
          {post.excerpt ? (
            <p className="mb-6 text-lg leading-relaxed text-obsidian/75">{post.excerpt}</p>
          ) : null}
          <div className="space-y-5">
            {paragraphs.map((p, i) => (
              <p key={i} className="text-base leading-relaxed text-obsidian/80">
                {p}
              </p>
            ))}
          </div>
          <div className="mt-10 border-t border-obsidian/10 pt-6">
            <Link href="/blog" className="text-sm text-clay hover:underline">
              ← {b.backTo}
            </Link>
          </div>
        </article>
      </Section>
    </>
  );
}
