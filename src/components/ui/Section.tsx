import type { ReactNode } from "react";

type Tone = "obsidian" | "deep" | "ivory";

const TONES: Record<Tone, string> = {
  obsidian: "bg-obsidian text-ivory",
  deep: "bg-deep text-ivory",
  ivory: "bg-ivory text-obsidian",
};

export function Section({
  id,
  tone = "obsidian",
  className = "",
  children,
  ariaLabelledBy,
}: {
  id?: string;
  tone?: Tone;
  className?: string;
  children: ReactNode;
  ariaLabelledBy?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={ariaLabelledBy}
      className={`relative py-20 md:py-28 lg:py-32 ${TONES[tone]} ${className}`}
    >
      {children}
    </section>
  );
}

export function SectionHead({
  eyebrow,
  title,
  lead,
  action,
  align = "start",
  id,
  as = "h2",
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: string;
  action?: ReactNode;
  align?: "start" | "center";
  id?: string;
  as?: "h1" | "h2";
}) {
  const centered = align === "center";
  const Heading = as;
  return (
    <div
      className={`mb-10 md:mb-14 flex flex-col gap-5 md:flex-row md:items-end md:justify-between ${centered ? "text-center items-center" : ""}`}
    >
      <div className={`max-w-2xl space-y-4 ${centered ? "mx-auto" : ""}`}>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <Heading id={id} className="text-3xl md:text-4xl lg:text-5xl">
          {title}
        </Heading>
        {lead ? (
          <p className="text-base md:text-lg leading-relaxed opacity-70">{lead}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
