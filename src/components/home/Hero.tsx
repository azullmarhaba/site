"use client";

import { motion, useReducedMotion } from "framer-motion";
import { LinkButton } from "@/components/ui/Button";
import { ArrowDown, Star } from "lucide-react";

type HeroDict = {
  eyebrow: string;
  title: string;
  lead: string;
  ctaPrimary: string;
  ctaSecondary: string;
  scroll: string;
  statExperiences: string;
  statDestinations: string;
  statBookings: string;
  statRating: string;
};

export function Hero({
  dict,
  stats,
}: {
  dict: HeroDict;
  stats: { experiences: number; destinations: number; bookings: number; rating: number };
}) {
  const reduce = useReducedMotion();

  const fade = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 30 },
          animate: { opacity: 1, y: 0 },
          transition: { delay, duration: 0.9, ease: [0.22, 1, 0.36, 1] as const },
        };

  const items: [number, string, string][] = [
    [stats.experiences, dict.statExperiences, ""],
    [stats.destinations, dict.statDestinations, ""],
    [stats.bookings, dict.statBookings, "+"],
    [stats.rating, dict.statRating, "★"],
  ];

  return (
    <section
      id="home"
      className="relative flex min-h-[92svh] flex-col justify-end overflow-hidden pt-28"
      aria-label={dict.title}
    >
      {/* Video background */}
      {reduce ? (
        // eslint-disable-next-line @next/next/no-img-element -- static poster, no transform needed under reduced motion
        <img
          src="/images/placeholders/hero.svg"
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <video
          className="absolute inset-0 size-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster="/images/placeholders/hero.svg"
          preload="metadata"
        >
          <source src="/videos/azul-intro.mp4" type="video/mp4" />
        </video>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/55 to-obsidian/70" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-obsidian to-transparent" />

      {/* Content */}
      <div className="container-azul relative z-10 pb-14">
        <motion.p className="eyebrow mb-6" {...fade(0.15)}>
          {dict.eyebrow}
        </motion.p>
        <motion.h1
          className="max-w-5xl text-[clamp(2.75rem,8vw,7rem)] leading-[0.95] tracking-tight text-ivory"
          {...fade(0.3)}
        >
          {dict.title}
        </motion.h1>
        <motion.p
          className="mt-6 max-w-xl text-base leading-relaxed text-ivory/75 md:text-lg"
          {...fade(0.45)}
        >
          {dict.lead}
        </motion.p>
        <motion.div className="mt-9 flex flex-wrap gap-4" {...fade(0.6)}>
          <LinkButton href="/plan-my-trip" size="lg" data-event="cta_clicked" data-track-id="hero_plan">
            {dict.ctaPrimary}
          </LinkButton>
          <LinkButton href="/experiences" size="lg" variant="outline" data-event="cta_clicked" data-track-id="hero_explore">
            {dict.ctaSecondary}
          </LinkButton>
        </motion.div>

        {/* Stats strip */}
        <motion.div
          className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-ivory/10 bg-ivory/10 md:grid-cols-4"
          {...fade(0.75)}
        >
          {items.map(([value, label, suffix]) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1 bg-obsidian/70 px-4 py-5 text-center backdrop-blur-sm"
            >
              <span className="font-display text-2xl text-sand md:text-3xl">
                {typeof value === "number" && suffix === "★" ? value.toFixed(1) : value}
                {suffix === "+" ? "+" : ""}
                {suffix === "★" ? " ★" : ""}
              </span>
              <span className="font-mono text-[0.58rem] uppercase tracking-[0.22em] text-ivory/55">
                {label}
              </span>
            </div>
          ))}
        </motion.div>

        <motion.a
          href="#discover"
          className="mt-10 inline-flex items-center gap-2 font-mono text-[0.62rem] uppercase tracking-[0.3em] text-ivory/50 transition-colors hover:text-sand"
          {...fade(0.9)}
        >
          <ArrowDown className="size-3.5 animate-bounce" aria-hidden="true" />
          {dict.scroll}
        </motion.a>
      </div>

      {/* Rating chip */}
      <motion.div
        className="absolute end-6 top-24 hidden items-center gap-2 rounded-full border border-sand/40 bg-obsidian/70 px-4 py-2 backdrop-blur lg:flex"
        {...fade(1)}
      >
        <Star className="size-4 fill-sand text-sand" aria-hidden="true" />
        <span className="text-sm text-ivory">{stats.rating.toFixed(1)}</span>
        <span className="text-xs text-ivory/50">/ 5</span>
      </motion.div>
    </section>
  );
}
