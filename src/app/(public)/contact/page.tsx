import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { getDict, getLocale } from "@/lib/i18n";
import { listFaqs } from "@/server/services/content";
import { ContactForm } from "@/components/contact/ContactForm";
import { Section, SectionHead } from "@/components/ui/Section";
import { siteConfig } from "@/config/site";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDict(await getLocale());
  return {
    title: dict.contact.title,
    description: dict.contact.lead,
    alternates: { canonical: "/contact" },
  };
}

export default async function ContactPage() {
  const locale = await getLocale();
  const dict = getDict(locale);
  const c = dict.contact;
  const faqs = (await listFaqs()).slice(0, 4);

  const info = [
    { icon: MapPin, title: c.visitTitle, body: siteConfig.contact.address },
    { icon: Clock, title: c.hoursTitle, body: siteConfig.contact.hours },
    { icon: Phone, title: "Phone", body: siteConfig.contact.phone },
    { icon: Mail, title: c.email, body: siteConfig.contact.email },
  ];

  const waHref = siteConfig.whatsapp.number
    ? `https://wa.me/${siteConfig.whatsapp.number.replace(/[^\d]/g, "")}?text=${encodeURIComponent(dict.whatsapp.message)}`
    : null;

  return (
    <>
      <Section tone="obsidian">
        <div className="container-azul">
          <SectionHead as="h1" eyebrow={siteConfig.descriptor} title={c.title} lead={c.lead} />

          <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
            <div className="rounded-3xl border border-obsidian/10 bg-ivory/70 p-6 md:p-8">
              <ContactForm labels={c} />
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {info.map((i) => (
                  <div
                    key={i.title}
                    className="rounded-3xl border border-ivory/10 bg-deep p-5"
                  >
                    <i.icon className="mb-3 size-4 text-sand" aria-hidden="true" />
                    <p className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-ivory/45">
                      {i.title}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-ivory/80">{i.body}</p>
                  </div>
                ))}
              </div>

              {waHref ? (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-4 rounded-3xl border border-sand/30 bg-sand/10 p-6 transition-colors hover:border-sand"
                >
                  <MessageCircle className="mt-0.5 size-5 shrink-0 text-sand" aria-hidden="true" />
                  <span>
                    <span className="block font-medium text-ivory">{c.whatsappTitle}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-ivory/65">
                      {c.whatsappBody}
                    </span>
                  </span>
                </a>
              ) : null}

              {faqs.length > 0 ? (
                <div className="rounded-3xl border border-ivory/10 bg-deep p-6">
                  <p className="mb-4 font-mono text-[0.58rem] uppercase tracking-[0.18em] text-ivory/45">
                    {c.faqTitle}
                  </p>
                  <div className="space-y-3">
                    {faqs.map((f) => (
                      <details
                        key={f.id}
                        className="group [&::-webkit-details-marker]:hidden"
                      >
                        <summary className="cursor-pointer list-none text-sm text-ivory marker:hidden">
                          {f.question}
                        </summary>
                        <p className="mt-2 text-xs leading-relaxed text-ivory/60">{f.answer}</p>
                      </details>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
