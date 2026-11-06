import type { Metadata } from "next";
import { getDict, getLocale } from "@/lib/i18n";
import { Section, SectionHead } from "@/components/ui/Section";
import { siteConfig } from "@/config/site";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDict(await getLocale());
  return {
    title: dict.legal.termsTitle,
    description: dict.legal.termsLead,
    alternates: { canonical: "/terms" },
  };
}

export default async function TermsPage() {
  const locale = await getLocale();
  const dict = getDict(locale);
  const s = dict.legal.sections;

  const sections = [
    { title: s.bookingTitle, body: s.bookingBody },
    { title: s.cancelTitle, body: s.cancelBody },
    { title: s.useTitle, body: s.useBody },
    { title: s.liabilityTitle, body: s.liabilityBody },
    { title: s.conductTitle, body: s.conductBody },
    { title: s.rightsTitle, body: s.rightsBody },
    { title: s.lawTitle, body: s.lawBody },
    { title: s.contactTitle, body: s.contactBody },
  ];

  return (
    <Section tone="obsidian">
      <div className="container-azul max-w-3xl">
        <SectionHead
          as="h1"
          eyebrow={siteConfig.descriptor}
          title={dict.legal.termsTitle}
          lead={dict.legal.termsLead}
        />
        <p className="mb-8 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-ivory/40">
          {dict.legal.updated}: 2026-01-01
        </p>
        <div className="space-y-8">
          {sections.map((sec) => (
            <section key={sec.title}>
              <h2 className="text-xl text-ivory md:text-2xl">{sec.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ivory/70 md:text-base">{sec.body}</p>
            </section>
          ))}
        </div>
      </div>
    </Section>
  );
}
