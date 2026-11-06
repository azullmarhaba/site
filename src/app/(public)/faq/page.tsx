import type { Metadata } from "next";
import Link from "next/link";
import { getDict, getLocale } from "@/lib/i18n";
import { listFaqs } from "@/server/services/content";
import { Section, SectionHead } from "@/components/ui/Section";
import { EmptyState } from "@/components/ui/States";
import { siteConfig } from "@/config/site";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDict(await getLocale());
  return {
    title: dict.faq.title,
    description: dict.faq.lead,
    alternates: { canonical: "/faq" },
  };
}

export default async function FaqPage() {
  const locale = await getLocale();
  const dict = getDict(locale);
  const faqs = await listFaqs();

  const byCategory = new Map<string, typeof faqs>();
  for (const f of faqs) {
    const key = f.category || "General";
    const list = byCategory.get(key) ?? [];
    list.push(f);
    byCategory.set(key, list);
  }

  return (
    <Section tone="obsidian">
      <div className="container-azul max-w-4xl">
        <SectionHead as="h1" eyebrow={siteConfig.descriptor} title={dict.faq.title} lead={dict.faq.lead} />

        {faqs.length === 0 ? (
          <EmptyState title={dict.faq.empty} />
        ) : (
          <div className="space-y-10">
            {[...byCategory.entries()].map(([category, items]) => (
              <div key={category}>
                <h2 className="mb-4 font-mono text-[0.66rem] uppercase tracking-[0.24em] text-sand">
                  {category}
                </h2>
                <div className="space-y-3">
                  {items.map((f) => (
                    <details
                      key={f.id}
                      className="group rounded-2xl border border-ivory/10 bg-deep px-6 py-4 [&::-webkit-details-marker]:hidden"
                    >
                      <summary className="cursor-pointer list-none text-ivory marker:hidden">
                        {f.question}
                      </summary>
                      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ivory/70">
                        {f.answer}
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="mt-10 text-sm text-ivory/55">
          {dict.contact.faqTitle}{" "}
          <Link href="/contact" className="text-sand hover:underline">
            {dict.contact.title}
          </Link>
        </p>
      </div>
    </Section>
  );
}
