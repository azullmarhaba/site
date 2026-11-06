import { Reveal } from "@/components/motion/Reveal";
import { LinkButton } from "@/components/ui/Button";
import { MessageCircle, ArrowUpRight } from "lucide-react";
import { siteConfig } from "@/config/site";

type FinalDict = {
  title: string;
  body: string;
  cta: string;
  secondary: string;
};

export function FinalCta({ dict }: { dict: FinalDict }) {
  const whatsapp = siteConfig.whatsapp.number.replace(/\D/g, "");

  return (
    <section
      className="relative overflow-hidden border-t border-ivory/10 bg-gradient-to-b from-obsidian via-deep py-24 md:py-32"
      aria-label={dict.title}
    >
      {/* decorative arches */}
      <svg
        className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto h-64 w-[36rem] text-sand/10"
        viewBox="0 0 400 200"
        aria-hidden="true"
      >
        <path
          d="M80 200 L80 90 A60 60 0 0 1 200 90 L200 200"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M140 200 L140 110 A40 40 0 0 1 220 110 L220 200"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
        <path
          d="M200 200 L200 80 A70 70 0 0 1 340 80 L340 200"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>

      <div className="container-azul relative z-10 text-center">
        <Reveal>
          <p className="eyebrow mb-6">Marhaba · مرحبًا</p>
          <h2 className="mx-auto max-w-3xl text-[clamp(2.25rem,5.5vw,4.5rem)]">
            {dict.title}
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-ivory/65 md:text-lg">
            {dict.body}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <LinkButton href="/plan-my-trip" size="lg" data-event="cta_clicked" data-track-id="final_plan">
              {dict.cta}
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </LinkButton>
            {whatsapp ? (
              <LinkButton
                href={`https://wa.me/${whatsapp}`}
                variant="outline"
                size="lg"
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="size-4" aria-hidden="true" />
                {dict.secondary}
              </LinkButton>
            ) : null}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
