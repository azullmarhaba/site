import type { Metadata } from "next";
import { getDict, getLocale } from "@/lib/i18n";
import { auth } from "@/lib/auth";
import { PlannerForm } from "@/components/planner/PlannerForm";
import { Section, SectionHead } from "@/components/ui/Section";
import { siteConfig } from "@/config/site";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDict(await getLocale());
  return {
    title: dict.planner.title,
    description: dict.planner.lead,
    alternates: { canonical: "/plan-my-trip" },
  };
}

export default async function PlanMyTripPage() {
  const locale = await getLocale();
  const dict = getDict(locale);
  const session = await auth();

  return (
    <Section tone="obsidian">
      <div className="container-azul">
        <SectionHead
          as="h1"
          eyebrow={siteConfig.descriptor}
          title={dict.planner.title}
          lead={dict.planner.lead}
        />
        <PlannerForm
          labels={dict.planner}
          locale={locale}
          signedIn={Boolean(session?.user)}
        />
      </div>
    </Section>
  );
}
