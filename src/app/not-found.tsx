import type { Metadata } from "next";
import { getDict, getLocale } from "@/lib/i18n";
import { siteConfig } from "@/config/site";
import { LinkButton } from "@/components/ui/Button";

export const metadata: Metadata = { title: "404" };

export default async function NotFound() {
  const locale = await getLocale();
  const dict = getDict(locale);
  const e = dict.errors;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-deep px-6 text-center text-ivory">
      <p className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-sand">404</p>
      <h1 className="font-display text-4xl md:text-5xl">{e.notFoundTitle}</h1>
      <p className="max-w-md text-sm text-ivory/60">{e.notFoundBody}</p>
      <LinkButton href="/">{e.goHome}</LinkButton>
      <p className="mt-4 font-mono text-[0.55rem] uppercase tracking-[0.2em] text-ivory/30">
        {siteConfig.name} · {siteConfig.descriptor}
      </p>
    </main>
  );
}
