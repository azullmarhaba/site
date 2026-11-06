import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, MapPin, Sparkles } from "lucide-react";
import { getDict, getLocale } from "@/lib/i18n";
import { CustomTourForm } from "@/components/booking/CustomTourForm";
import { Reveal } from "@/components/motion/Reveal";
import { Section } from "@/components/ui/Section";
import { siteConfig } from "@/config/site";

const PERKS = [
  {
    icon: Sparkles,
    titleKey: "perk1Title",
    bodyKey: "perk1Body",
  },
  {
    icon: Clock,
    titleKey: "perk2Title",
    bodyKey: "perk2Body",
  },
  {
    icon: MapPin,
    titleKey: "perk3Title",
    bodyKey: "perk3Body",
  },
] as const;

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDict(await getLocale());
  const c = dict.customTour;
  return {
    title: c.title,
    description: c.lead,
    alternates: { canonical: "/custom-tour" },
  };
}

export default async function CustomTourPage() {
  const locale = await getLocale();
  const dict = getDict(locale);
  const c = dict.customTour;

  return (
    <>
      <Section tone="obsidian" className="md:pt-40 pt-32">
        <div className="container-azul">
          <Reveal>
            <div className="mx-auto max-w-3xl text-center">
              <p className="eyebrow">{siteConfig.descriptor}</p>
              <h1 className="mt-3 text-4xl md:text-5xl lg:text-6xl">{c.title}</h1>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-ivory/60 md:text-lg">
                {c.lead}
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/plan-my-tour"
                  className="inline-flex min-h-12 items-center rounded-full border border-ivory/30 px-7 text-sm text-ivory transition-colors hover:border-sand hover:text-sand"
                >
                  {c.explorePlanner}
                  <ArrowRight className="ms-2 size-4 rtl:rotate-180" aria-hidden="true" />
                </Link>
                <Link
                  href="/tours"
                  className="inline-flex min-h-12 items-center rounded-full bg-sand px-7 text-sm font-medium text-obsidian transition-colors hover:bg-sand-bright"
                >
                  {c.exploreTours}
                  <ArrowRight className="ms-2 size-4 rtl:rotate-180" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="mx-auto mt-14 max-w-3xl">
              <CustomTourForm labels={c} locale={locale} />
            </div>
          </Reveal>
        </div>
      </Section>

      <Section tone="deep">
        <div className="container-azul">
          <h2 className="mb-10 text-center text-2xl md:text-3xl">{c.perksTitle}</h2>
          <div className="grid gap-5 md:grid-cols-3">
            {PERKS.map((perk) => (
              <div
                key={perk.titleKey}
                className="rounded-3xl border border-ivory/10 bg-obsidian/50 p-6"
              >
                <span className="grid size-11 place-items-center rounded-2xl bg-sand/10 text-sand">
                  <perk.icon className="size-5" aria-hidden="true" />
                </span>
                <p className="mt-4 font-display text-lg text-ivory">{c[perk.titleKey]}</p>
                <p className="mt-2 text-sm leading-relaxed text-ivory/55">{c[perk.bodyKey]}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}
