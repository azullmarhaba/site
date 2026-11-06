"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { en } from "@/lib/i18n/dictionaries/en";

type NavDict = typeof en.admin.nav;
type GroupDict = typeof en.admin.navGroups;

const GROUPS: { key: keyof GroupDict; items: [keyof NavDict, string][] }[] = [
  {
    key: "ops",
    items: [
      ["overview", "/admin"],
      ["bookings", "/admin/bookings"],
      ["customers", "/admin/customers"],
      ["crm", "/admin/crm"],
      ["crmClients", "/admin/crm/clients"],
      ["payments", "/admin/payments"],
      ["messages", "/admin/messages"],
      ["notifications", "/admin/notifications"],
    ],
  },
  {
    key: "catalog",
    items: [
      ["experiences", "/admin/experiences"],
      ["categories", "/admin/categories"],
      ["destinations", "/admin/destinations"],
      ["tours", "/admin/tours"],
      ["availability", "/admin/availability"],
      ["media", "/admin/media"],
      ["blog", "/admin/blog"],
      ["faqs", "/admin/faqs"],
    ],
  },
  {
    key: "fleet",
    items: [
      ["guides", "/admin/guides"],
      ["vehicles", "/admin/vehicles"],
      ["pickup", "/admin/pickup"],
    ],
  },
  {
    key: "people",
    items: [
      ["reviews", "/admin/reviews"],
      ["coupons", "/admin/coupons"],
      ["users", "/admin/users"],
      ["roles", "/admin/roles"],
      ["permissions", "/admin/permissions"],
    ],
  },
  {
    key: "system",
    items: [
      ["translations", "/admin/translations"],
      ["settings", "/admin/settings"],
      ["audit", "/admin/audit"],
    ],
  },
];

export function AdminSidebar({ nav, groups }: { nav: NavDict; groups: GroupDict }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <nav
      aria-label="Admin"
      className="shrink-0 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:w-56 lg:self-start lg:overflow-y-auto"
    >
      <div className="flex gap-4 overflow-x-auto pb-3 lg:flex-col lg:gap-5 lg:overflow-visible lg:pb-0">
        {GROUPS.map((group) => (
          <div key={group.key} className="min-w-max lg:min-w-0">
            <p className="mb-1.5 hidden font-mono text-[0.55rem] uppercase tracking-[0.22em] text-ivory/35 lg:block">
              {groups[group.key]}
            </p>
            <ul className="space-y-0.5">
              {group.items.map(([key, href]) => {
                const active = isActive(href);
                return (
                  <li key={key}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={`block whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors ${
                        active
                          ? "bg-sand text-obsidian"
                          : "text-ivory/65 hover:bg-ivory/5 hover:text-ivory"
                      }`}
                    >
                      {nav[key]}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
