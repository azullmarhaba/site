"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";

const STORAGE_KEY = "azul_preloader_seen";

export function Preloader({
  skipLabel,
  tagline,
}: {
  skipLabel: string;
  tagline: string;
}) {
  const reduce = useReducedMotion();
  const [show, setShow] = useState(false);
  const [fading, setFading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const finishedRef = useRef(false);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* storage unavailable — still finish */
    }
    setFading(true);
    window.setTimeout(() => setShow(false), 700);
  }, []);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      seen = false;
    }
    if (reduce || seen) return;
    const t = window.setTimeout(() => setShow(true), 0);
    return () => window.clearTimeout(t);
  }, [reduce]);

  useEffect(() => {
    if (!show) return;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(finish, 6500); // hard cap
    return () => {
      document.body.style.overflow = "";
      window.clearTimeout(t);
    };
  }, [show, finish]);

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          className="fixed inset-0 z-[160] flex flex-col items-center justify-center overflow-hidden bg-obsidian"
          initial={{ opacity: 1 }}
          animate={{ opacity: fading ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.65, ease: "easeInOut" }}
          aria-label={tagline}
        >
          <video
            ref={videoRef}
            className="absolute inset-0 size-full object-cover opacity-55"
            src="/videos/azul-intro.mp4"
            poster="/images/placeholders/hero.svg"
            autoPlay
            muted
            playsInline
            preload="auto"
            onEnded={finish}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-obsidian/60 via-obsidian/25 to-obsidian" />

          <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center">
            <motion.p
              className="eyebrow"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7 }}
            >
              {tagline}
            </motion.p>
            <motion.h1
              className="font-display text-5xl tracking-[0.3em] text-ivory md:text-7xl"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
              AZUL
            </motion.h1>
            <motion.div
              className="h-px w-40 bg-sand/60"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.6, duration: 1.6, ease: "easeInOut" }}
            />
            <motion.p
              className="font-mono text-[0.62rem] uppercase tracking-[0.4em] text-ivory/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              Marhaba Morocco 2027
            </motion.p>
          </div>

          <button
            type="button"
            onClick={finish}
            className="absolute bottom-8 end-8 z-10 inline-flex items-center gap-2 rounded-full border border-ivory/25 px-4 py-2 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-ivory/70 transition-colors hover:border-sand hover:text-sand"
          >
            <X className="size-3.5" aria-hidden="true" />
            {skipLabel}
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
