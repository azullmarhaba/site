import type { Metadata } from "next";
import { getDict, getLocale } from "@/lib/i18n";
import { listDestinations } from "@/server/services/catalog";
import { DestinationCard } from "@/components/catalog/DestinationCard";
import { Reveal } from "@/components/motion/Reveal";
import { Section, SectionHead } from "@/components/ui/Section";
import { siteConfig } from "@/config/site";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDict(await getLocale());
  return {
    title: dict.catalog.destinations.title,
    description: dict.catalog.destinations.lead,
    alternates: { canonical: "/destinations" },
  };
}

export default async function DestinationsPage() {
  const locale = await getLocale();
  const dict = getDict(locale);
  const destinations = await listDestinations();

  return (
    <Section tone="obsidian">
      <div className="container-azul">
        <SectionHead
          as="h1"
          eyebrow={siteConfig.descriptor}
          title={dict.catalog.destinations.title}
          lead={dict.catalog.destinations.lead}
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map((d, i) => (
            <Reveal key={d.id} delay={(i % 3) * 0.08}>
              <DestinationCard
                destination={d}
                labels={{
                  countExperiences: dict.catalog.destinations.countExperiences,
                  viewExperiences: dict.catalog.destinations.viewExperiences,
                }}
              />
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
