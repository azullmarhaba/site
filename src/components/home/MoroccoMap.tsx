"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, CalendarRange, ArrowUpRight, Compass } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { Section, SectionHead } from "@/components/ui/Section";
import { buttonClasses } from "@/components/ui/Button";
import { track } from "@/lib/analytics";
import immage from "../../../public/mrrakech.jpg";

export type MapDestination = {
  id: string;
  slug: string;
  name: string;
  region: string | null;
  shortIntro: string | null;
  mapX: number | null;
  mapY: number | null;
  bestSeason: string | null;
  duration: string | null;
  coverImage: { path: string } | null;
};

type MapDict = {
  eyebrow: string;
  title: string;
  lead: string;
  view: string;
};

export function MoroccoMap({
  dict,
  destinations,
}: {
  dict: MapDict;
  destinations: MapDestination[];
}) {
  const [active, setActive] = useState(0);
  const current = destinations[active];

  return (
    <Section id="map" tone="obsidian">
      <div className="container-azul">
        <SectionHead
          eyebrow={dict.eyebrow}
          title={dict.title}
          lead={dict.lead}
        />

        <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          {/* Map panel */}
          <Reveal className="relative">
            <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-ivory/10 bg-gradient-to-br from-carbon via-deep to-obsidian md:aspect-[16/12] lg:aspect-auto lg:h-[560px]">
              {/* decorative grid + arches */}
              <img src="../../../public/mrrakech.jpg" alt=""/>

              {/* hotspots */}
              {destinations.map((d, i) => {
                const isActive = i === active;
                return (
                  <button
                    key={d.id}
                    type="button"
                    aria-pressed={isActive}
                    aria-label={d.name}
                    onClick={() => {
                        setActive(i);
                        track("destination_selected", { slug: d.slug, source: "map" });
                      }}
                    onMouseEnter={() => setActive(i)}
                    className="group absolute -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `${(d.mapX ?? 0.5) * 100}%`,
                      top: `${(d.mapY ?? 0.5) * 100}%`,
                    }}
                  >
                    <span className="relative flex size-3 items-center justify-center">
                      {isActive ? (
                        <motion.span
                          className="absolute inline-flex size-6 rounded-full bg-sand/30"
                          initial={{ scale: 0.6, opacity: 0.8 }}
                          animate={{ scale: 1.8, opacity: 0 }}
                          transition={{ duration: 1.4, repeat: Infinity }}
                        />
                      ) : null}
                      <span
                        className={`relative size-3 rounded-full border-2 transition-all ${
                          isActive
                            ? "scale-125 border-obsidian bg-sand"
                            : "border-sand/70 bg-obsidian group-hover:scale-110 group-hover:bg-sand"
                        }`}
                      />
                    </span>
                    <span
                      className={`pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 whitespace-nowrap font-mono text-[0.58rem] uppercase tracking-[0.16em] transition-all ${
                        isActive
                          ? "text-sand opacity-100"
                          : "text-ivory/70 opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      {d.name}
                    </span>
                  </button>
                );
              })}

              {/* active card */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={current?.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35 }}
                  className="absolute inset-x-4 bottom-4 flex items-center gap-4 rounded-2xl border border-ivory/10 bg-obsidian/85 p-4 backdrop-blur-md"
                >
                  <div className="relative hidden size-16 shrink-0 overflow-hidden rounded-xl sm:block">
                    <Image
                      src={current?.coverImage?.path ?? "/images/placeholders/hero.svg"}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-lg text-ivory">
                      {current?.name}
                    </p>
                    <p className="truncate text-xs text-ivory/60">
                      {current?.shortIntro}
                    </p>
                  </div>
                  <Link
                    href={`/destinations/${current?.slug}`}
                    className={`${buttonClasses("primary", "sm")} shrink-0`}
                  >
                    {dict.view}
                    <ArrowUpRight className="size-3.5" aria-hidden="true" />
                  </Link>
                </motion.div>
              </AnimatePresence>
            </div>
          </Reveal>

          {/* Destination list */}
          <Reveal delay={0.15}>
            <ul className="grid max-h-[560px] gap-1 overflow-y-auto pe-1 sm:grid-cols-2 lg:grid-cols-1">
              {destinations.map((d, i) => {
                const isActive = i === active;
                return (
                  <li key={d.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setActive(i);
                        track("destination_selected", { slug: d.slug, source: "map" });
                      }}
                      aria-pressed={isActive}
                      className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3.5 text-start transition-all ${
                        isActive
                          ? "border-sand/50 bg-sand/10"
                          : "border-transparent hover:border-ivory/15 hover:bg-ivory/5"
                      }`}
                    >
                      <MapPin
                        className={`mt-0.5 size-4 shrink-0 ${isActive ? "text-sand" : "text-ivory/40"}`}
                        aria-hidden="true"
                      />
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span
                            className={`text-sm font-medium ${isActive ? "text-sand" : "text-ivory"}`}
                          >
                            {d.name}
                          </span>
                          {d.region ? (
                            <span className="truncate font-mono text-[0.55rem] uppercase tracking-[0.16em] text-ivory/35">
                              {d.region}
                            </span>
                          ) : null}
                        </span>
                        {isActive ? (
                          <span className="mt-1 flex flex-wrap items-center gap-3 text-[0.68rem] text-ivory/55">
                            {d.duration ? (
                              <span className="inline-flex items-center gap-1">
                                <Compass className="size-3" aria-hidden="true" />
                                {d.duration}
                              </span>
                            ) : null}
                            {d.bestSeason ? (
                              <span className="inline-flex items-center gap-1">
                                <CalendarRange className="size-3" aria-hidden="true" />
                                {d.bestSeason}
                              </span>
                            ) : null}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
