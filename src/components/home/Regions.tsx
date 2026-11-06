import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { Section, SectionHead } from "@/components/ui/Section";
import { ArrowUpRight } from "lucide-react";

type RegionsDict = {
  eyebrow: string;
  title: string;
  link: string;
  marrakech: { kicker: string; title: string; body: string };
  atlas: { kicker: string; title: string; body: string };
  desert: { kicker: string; title: string; body: string };
};

const ROWS: {
  key: "marrakech" | "atlas" | "desert";
  image: string;
  href: string;
  flip?: boolean;
}[] = [
  { key: "marrakech", image: "/images/placeholders/marrakech.svg", href: "/destinations/marrakech" },
  { key: "atlas", image: "/images/placeholders/atlas.svg", href: "/destinations/atlas-mountains", flip: true },
  { key: "desert", image: "/images/placeholders/merzouga.svg", href: "/destinations/merzouga" },
];

export function Regions({ dict }: { dict: RegionsDict }) {
  return (
    <Section id="regions" tone="deep">
      <div className="container-azul">
        <SectionHead eyebrow={dict.eyebrow} title={dict.title} />

        <div className="space-y-8 md:space-y-14">
          {ROWS.map((row) => {
            const copy = dict[row.key];
            return (
              <Reveal key={row.key}>
                <div
                  className={`grid items-center gap-7 rounded-[2rem] border border-ivory/10 bg-obsidian/50 p-5 md:grid-cols-2 md:gap-12 md:p-7 ${row.flip ? "md:[direction:rtl]" : ""}`}
                >
                  <div className="relative aspect-[16/10] overflow-hidden rounded-3xl md:aspect-[4/3]">
                    <Image
                      src={row.image}
                      alt={copy.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover transition-transform duration-700 hover:scale-105"
                    />
                  </div>
                  <div className={`p-2 md:p-6 ${row.flip ? "md:[direction:ltr]" : ""}`}>
                    <p className="eyebrow mb-4">{copy.kicker}</p>
                    <h3 className="text-3xl md:text-4xl">{copy.title}</h3>
                    <p className="mt-4 text-sm leading-relaxed text-ivory/65 md:text-base">
                      {copy.body}
                    </p>
                    <Link
                      href={row.href}
                      className="mt-6 inline-flex items-center gap-1.5 text-sm text-sand transition-colors hover:text-sand-bright"
                    >
                      {dict.link}
                      <ArrowUpRight className="size-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
