import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { Section, SectionHead } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/Button";
import { formatDate } from "@/lib/format";

type Story = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  readingMinutes: number;
  publishedAt: Date | null;
  category: { name: string } | null;
  coverImage: { path: string; alt: string | null } | null;
};

export function TravelStories({
  dict,
  stories,
  locale,
}: {
  dict: { eyebrow: string; title: string; lead: string; viewAll: string; minRead: string };
  stories: Story[];
  locale: string;
}) {
  return (
    <Section id="stories" tone="obsidian">
      <div className="container-azul">
        <SectionHead
          eyebrow={dict.eyebrow}
          title={dict.title}
          lead={dict.lead}
          action={
            <LinkButton href="/blog" variant="outline">
              {dict.viewAll}
            </LinkButton>
          }
        />

        <div className="grid gap-6 md:grid-cols-3">
          {stories.map((post, i) => (
            <Reveal key={post.id} delay={i * 0.1}>
              <Link
                href={`/blog/${post.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-3xl border border-ivory/10 bg-deep transition-colors hover:border-sand/40"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={post.coverImage?.path ?? "/images/placeholders/blog.svg"}
                    alt={post.coverImage?.alt ?? post.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-3 p-6">
                  <div className="flex items-center gap-3 font-mono text-[0.58rem] uppercase tracking-[0.18em] text-ivory/45">
                    {post.category ? <span className="text-sand">{post.category.name}</span> : null}
                    <span>
                      {post.readingMinutes} {dict.minRead}
                    </span>
                  </div>
                  <h3 className="text-lg leading-snug transition-colors group-hover:text-sand">
                    {post.title}
                  </h3>
                  {post.excerpt ? (
                    <p className="line-clamp-2 text-sm text-ivory/55">{post.excerpt}</p>
                  ) : null}
                  <div className="mt-auto flex items-center justify-between pt-3 text-xs text-ivory/40">
                    <span>{post.publishedAt ? formatDate(post.publishedAt, locale) : ""}</span>
                    <ArrowUpRight
                      className="size-4 text-sand transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
