"use client";

import { useTransition } from "react";
import { Check, Globe } from "lucide-react";
import { setLocale } from "@/lib/i18n/actions";
import { LOCALES, type Locale } from "@/lib/i18n/config";

export function LocaleSwitcher({
  locale,
  labels,
  compact = false,
}: {
  locale: Locale;
  labels: Record<Locale, string>;
  compact?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div
      className="flex items-center gap-1"
      role="group"
      aria-label={labels[locale]}
    >
      {LOCALES.map((l) => {
        const active = l === locale;
        return (
          <button
            key={l}
            type="button"
            disabled={pending}
            aria-pressed={active}
            onClick={() => startTransition(() => setLocale(l))}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 font-mono text-[0.66rem] uppercase tracking-[0.18em] transition-colors disabled:opacity-60 ${
              active
                ? "bg-sand text-obsidian"
                : "text-ivory/60 hover:text-sand"
            }`}
            title={labels[l]}
          >
            {!compact && active ? <Check className="size-3" aria-hidden="true" /> : null}
            {l}
          </button>
        );
      })}
    </div>
  );
}

export function LocaleSwitcherWithIcon(props: {
  locale: Locale;
  labels: Record<Locale, string>;
}) {
  return (
    <div className="flex items-center gap-2">
      <Globe className="size-4 text-ivory/50" aria-hidden="true" />
      <LocaleSwitcher {...props} compact />
    </div>
  );
}
