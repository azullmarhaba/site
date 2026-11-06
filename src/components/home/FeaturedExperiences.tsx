import { Reveal } from "@/components/motion/Reveal";
import { Section, SectionHead } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/Button";
import { ExperienceCard, type ExperienceCardData } from "@/components/catalog/ExperienceCard";

export function FeaturedExperiences({
  dict,
  experiences,
  locale,
  bookNow,
}: {
  dict: { eyebrow: string; title: string; lead: string; viewAll: string; perPerson?: string };
  experiences: ExperienceCardData[];
  locale: string;
  bookNow?: string;
}) {
  return (
    <Section id="experiences" tone="deep">
      <div className="container-azul">
        <SectionHead
          eyebrow={dict.eyebrow}
          title={dict.title}
          lead={dict.lead}
          action={
            <LinkButton href="/experiences" variant="outline" size="md">
              {dict.viewAll}
            </LinkButton>
          }
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {experiences.map((exp, i) => (
            <Reveal key={exp.id} delay={(i % 3) * 0.1}>
              <ExperienceCard
                experience={exp}
                locale={locale}
                perPerson={dict.perPerson ?? "person"}
                bookLabel={bookNow}
              />
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
