"use client";

import { en } from "@/lib/i18n/dictionaries/en";
import { Button } from "@/components/ui/Button";

const dict = en;

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-deep px-6 text-center text-ivory">
      <p className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-clay">500</p>
      <h1 className="font-display text-4xl md:text-5xl">{dict.errors.serverTitle}</h1>
      <p className="max-w-md text-sm text-ivory/60">{dict.errors.serverBody}</p>
      <Button type="button" onClick={reset} variant="primary">
        {dict.common.retry}
      </Button>
      {error.digest ? (
        <p className="font-mono text-[0.55rem] tracking-[0.14em] text-ivory/30">
          {error.digest}
        </p>
      ) : null}
    </main>
  );
}
