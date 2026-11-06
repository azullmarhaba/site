import type { ReactNode } from "react";

type Variant = "sand" | "clay" | "atlas" | "ivory" | "solid";

const VARIANTS: Record<Variant, string> = {
  sand: "border-sand/50 text-sand",
  clay: "border-clay/60 text-clay",
  atlas: "border-atlas/70 text-atlas",
  ivory: "border-ivory/30 text-ivory/80",
  solid: "border-transparent bg-sand text-obsidian",
};

export function Badge({
  children,
  variant = "sand",
  className = "",
}: {
  children: ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.22em] ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
