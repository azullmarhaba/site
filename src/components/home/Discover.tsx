import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { Section } from "@/components/ui/Section";
import { ArrowUpRight } from "lucide-react";

type DiscoverDict = {
  eyebrow: string;
  title: string;
  body: string;
  link: string;
  chip1: string;
  chip2: string;
  chip3: string;
  chip4: string;
  chip5: string;
};

export function Discover({ dict }: { dict: DiscoverDict }) {
  const chips = [dict.chip1, dict.chip2, dict.chip3, dict.chip4, dict.chip5];

  return (
    <Section id="discover" tone="obsidian">
      <div className="container-azul grid items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <p className="eyebrow mb-5">{dict.eyebrow}</p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl">{dict.title}</h2>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="text-base leading-relaxed text-ivory/70 md:text-lg">
            {dict.body}
          </p>
          <div className="mt-7 flex flex-wrap gap-2.5">
            {chips.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-ivory/15 px-4 py-1.5 text-xs text-ivory/65"
              >
                {chip}
              </span>
            ))}
          </div>
          <Link
            href="/about"
            className="mt-7 inline-flex items-center gap-1.5 text-sm text-sand transition-colors hover:text-sand-bright"
          >
            {dict.link}
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </Reveal>
      </div>
    </Section>
  );
}
