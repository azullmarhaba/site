import { Reveal } from "@/components/motion/Reveal";
import { Section } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/Button";
import { Sparkles, Route, CalendarDays, Wallet } from "lucide-react";

type PlannerDict = {
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  days: string;
  interests: string;
};

const STEPS = [Sparkles, CalendarDays, Route, Wallet];

export function PlannerTeaser({ dict }: { dict: PlannerDict }) {
  return (
    <Section id="plan" tone="obsidian">
      <div className="container-azul">
        <div className="relative overflow-hidden rounded-[2rem] border border-ivory/10 bg-gradient-to-br from-deep via-carbon to-obsidian px-7 py-14 md:px-14 md:py-20">
          {/* arch motif */}
          <svg
            className="pointer-events-none absolute -end-10 -top-10 size-72 text-sand/15"
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            <path
              d="M25 95 L25 45 A25 25 0 0 1 75 45 L75 95"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M35 95 L35 50 A15 15 0 0 1 65 50 L65 95"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
          </svg>

          <div className="relative grid items-center gap-10 lg:grid-cols-2">
            <Reveal>
              <p className="eyebrow mb-5">{dict.eyebrow}</p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl">{dict.title}</h2>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-ivory/65">
                {dict.body}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <LinkButton href="/plan-my-trip" size="lg">
                  {dict.cta}
                </LinkButton>
                <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-ivory/45">
                  {dict.interests}
                </span>
              </div>
            </Reveal>

            {/* Fake itinerary preview */}
            <Reveal delay={0.2}>
              <div className="space-y-3">
                {[
                  ["Day 1", "Marrakech", "Medina walk · cooking class"],
                  ["Day 2", "Atlas", "Imlil trek · Berber lunch"],
                  ["Day 3", "Agafay", "Quad · sunset dinner"],
                  ["Day 4", "Essaouira", "Ramparts · seafood"],
                ].map(([day, place, detail], i) => (
                  <div
                    key={day}
                    className="flex items-center gap-4 rounded-2xl border border-ivory/10 bg-obsidian/70 px-5 py-4 backdrop-blur"
                    style={{ transform: `translateX(${i * 10}px)` }}
                  >
                    <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-sand">
                      {day}
                    </span>
                    <span className="h-8 w-px bg-ivory/15" aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-ivory">
                        {place}
                      </span>
                      <span className="block truncate text-xs text-ivory/50">
                        {detail}
                      </span>
                    </span>
                    <span className="ms-auto font-mono text-[0.6rem] text-ivory/35">
                      {dict.days}
                    </span>
                  </div>
                ))}
                <div className="flex items-center gap-3 ps-4">
                  {STEPS.map((Icon, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-ivory/45"
                    >
                      <Icon className="size-3 text-sand" aria-hidden="true" />
                      0{i + 1}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </Section>
  );
}
