"use client";

import Link from "next/link";
import Image from "next/image";
import { ExternalLink, LogOut, UserRound } from "lucide-react";
import { signOut } from "next-auth/react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function AdminHeader({
  user,
  labels,
}: {
  user: { name: string | null; email: string };
  labels: {
    title: string;
    site: string;
    account: string;
    signOut: string;
    lightMode: string;
    darkMode: string;
  };
}) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-ivory/10 bg-obsidian/90 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-4 md:h-16 md:px-6">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="flex items-center gap-2.5" aria-label="AZUL admin">
            <span className="relative size-8 shrink-0">
              <Image
                src="/brand/azul-icon-light.png"
                alt=""
                fill
                sizes="32px"
                className="object-contain light:hidden"
                priority
              />
              <Image
                src="/brand/azul-icon-dark.png"
                alt=""
                fill
                sizes="32px"
                className="hidden object-contain light:block"
                priority
              />
            </span>
            <span className="font-display text-sm tracking-[0.28em] md:text-base">AZUL</span>
            <span className="rounded-full border border-sand/40 bg-sand/10 px-2.5 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.2em] text-sand">
              {labels.title}
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-ivory/55 sm:block">
            {user.name ?? user.email}
          </span>
          <ThemeToggle
            labels={{ lightMode: labels.lightMode, darkMode: labels.darkMode }}
          />
          <Link
            href="/"
            className="inline-flex size-9 items-center justify-center rounded-full border border-ivory/20 text-ivory transition-colors hover:border-sand hover:text-sand"
            aria-label={labels.site}
            title={labels.site}
          >
            <ExternalLink className="size-4" aria-hidden="true" />
          </Link>
          <Link
            href="/account"
            className="inline-flex size-9 items-center justify-center rounded-full border border-ivory/20 text-ivory transition-colors hover:border-sand hover:text-sand"
            aria-label={labels.account}
            title={labels.account}
          >
            <UserRound className="size-4" aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={() => signOut({ redirectTo: "/" })}
            aria-label={labels.signOut}
            title={labels.signOut}
            className="inline-flex size-9 items-center justify-center rounded-full border border-ivory/20 text-ivory transition-colors hover:border-clay hover:text-clay"
          >
            <LogOut className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
