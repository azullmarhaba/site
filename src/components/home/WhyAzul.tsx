import { ShieldCheck, BadgeCheck, CalendarClock, Lock } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { Section, SectionHead } from "@/components/ui/Section";

type WhyDict = {
  eyebrow: string;
  title: string;
  items: { title: string; body: string }[];
};

const ICONS = [ShieldCheck, BadgeCheck, CalendarClock, Lock];

export function WhyAzul({ dict }: { dict: WhyDict }) {
  return (
    <Section id="why" tone="deep">
      <div className="container-azul">
        <SectionHead eyebrow={dict.eyebrow} title={dict.title} align="center" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {dict.items.map((item, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <Reveal key={item.title} delay={i * 0.1}>
                <div className="group h-full rounded-3xl border border-ivory/10 bg-obsidian/60 p-7 transition-colors hover:border-sand/40">
                  <div className="mb-5 inline-flex size-12 items-center justify-center rounded-2xl border border-sand/30 bg-sand/10 text-sand transition-colors group-hover:bg-sand group-hover:text-obsidian">
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  <h3 className="mb-2 text-lg">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-ivory/60">{item.body}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
