"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { en } from "@/lib/i18n/dictionaries/en";

type AccountNavDict = typeof en.account.nav;

const HREFS: [keyof AccountNavDict, string][] = [
  ["overview", "/account"],
  ["bookings", "/account/bookings"],
  ["favorites", "/account/favorites"],
  ["reviews", "/account/reviews"],
  ["notifications", "/account/notifications"],
  ["profile", "/account/profile"],
];

export function AccountNav({ labels }: { labels: AccountNavDict }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/account" ? pathname === "/account" : pathname.startsWith(href);

  return (
    <nav aria-label="Account" className="lg:sticky lg:top-28 lg:self-start">
      <ul className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
        {HREFS.map(([key, href]) => {
          const active = isActive(href);
          return (
            <li key={key}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex whitespace-nowrap rounded-full border px-4 py-2 text-sm transition-colors ${
                  active
                    ? "border-sand bg-sand text-obsidian"
                    : "border-ivory/15 text-ivory/70 hover:border-sand hover:text-sand"
                }`}
              >
                {labels[key]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
