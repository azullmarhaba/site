"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { Menu, X, ArrowUpRight, LogOut, UserRound, LayoutDashboard } from "lucide-react";
import { signOut } from "next-auth/react";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LinkButton } from "@/components/ui/Button";
import type { Locale } from "@/lib/i18n/config";
import type { en } from "@/lib/i18n/dictionaries/en";

type NavDict = typeof en.nav;
type LocaleLabels = typeof en.locale;

type AuthLabels = {
  signIn: string;
  signUp: string;
  account: string;
  admin: string;
  signOut: string;
};

export function Header({
  nav,
  localeLabels,
  locale,
  user,
  authLabels,
}: {
  nav: NavDict;
  localeLabels: LocaleLabels;
  locale: Locale;
  user?: { name: string | null; isAdmin: boolean } | null;
  authLabels: AuthLabels;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 30,
    mass: 0.35,
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia("(min-width: 1280px)");
    const onResize = () => {
      if (mq.matches) setOpen(false);
    };
    mq.addEventListener("change", onResize);
    return () => mq.removeEventListener("change", onResize);
  }, [open]);

  const links: [string, string][] = [
    ["/", nav.home],
    ["/destinations", nav.destinations],
    ["/experiences", nav.experiences],
    ["/tours", nav.tours],
    ["/plan-my-trip", nav.planTrip],
    ["/custom-tour", nav.customTour],
    ["/blog", nav.blog],
    ["/about", nav.about],
    ["/contact", nav.contact],
  ];

  const themeLabels = { lightMode: nav.lightMode, darkMode: nav.darkMode };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled
            ? "px-2 pt-2.5 md:px-5 md:pt-3"
            : "bg-gradient-to-b from-obsidian/70 to-transparent"
        }`}
      >
        <div
          className={`relative mx-auto flex items-center justify-between gap-3 transition-all duration-500 ${
            scrolled
              ? "h-14 max-w-7xl overflow-hidden rounded-3xl border border-ivory/12 bg-obsidian/75 px-5 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.7)] backdrop-blur-xl md:h-16 md:px-6"
              : "container-azul h-16 md:h-20"
          }`}
        >
          {/* Scroll progress hairline */}
          <motion.span
            aria-hidden="true"
            style={{ scaleX: progress }}
            className="absolute inset-x-0 bottom-0 h-px origin-left bg-gradient-to-r from-sand via-sand-bright to-transparent rtl:origin-right"
          />

          {/* Brand */}
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-3"
            aria-label="AZUL — home"
          >
            <span className="relative size-9 shrink-0 transition-transform duration-300 group-hover:rotate-[-8deg] group-hover:scale-105 md:size-30">
              <Image
                src="/brand/azul-logo-dark.png"
                alt=""
                fill
                sizes="100px"
                className="object-contain light:hidden"
                priority
              />
              <Image
                src="/brand/azul-logo-light.png"
                alt=""
                fill
                sizes="100px"
                className="hidden object-contain light:block"
              />
            </span>
          </Link>

          {/* Desktop nav — sliding sand pill marks the active route */}
          <nav
            aria-label="Primary"
            className="hidden items-center gap-1 xl:flex"
          >
            {links.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={`relative whitespace-nowrap rounded-full px-1.5 py-2 text-[0.78rem] tracking-wide transition-colors ${
                  isActive(href)
                    ? "text-sand"
                    : "text-ivory/75 hover:bg-ivory/5 hover:text-ivory"
                }`}
              >
                {isActive(href) ? (
                  <motion.span
                    aria-hidden="true"
                    layoutId="nav-active-pill"
                    className="absolute inset-0 rounded-full border border-sand/35 bg-sand/12"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                ) : null}
                <span className="relative z-10">{label}</span>
              </Link>
            ))}
          </nav>

          {/* Right cluster */}
          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden sm:block">
              <LocaleSwitcher locale={locale} labels={localeLabels} compact />
            </div>
            <ThemeToggle labels={themeLabels} />
            <div className="hidden items-center gap-2 md:flex">
              {user ? (
                <div className="flex items-center gap-1">
                  <Link
                    href={user.isAdmin ? "/admin" : "/account"}
                    className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-ivory/20 px-3.5 py-2 text-xs text-ivory transition-colors hover:border-sand hover:text-sand"
                  >
                    {user.isAdmin ? (
                      <LayoutDashboard className="size-3.5" aria-hidden="true" />
                    ) : (
                      <UserRound className="size-3.5" aria-hidden="true" />
                    )}
                    {user.isAdmin ? authLabels.admin : authLabels.account}
                  </Link>
                  <button
                    type="button"
                    onClick={() => signOut({ redirectTo: "/" })}
                    aria-label={authLabels.signOut}
                    title={authLabels.signOut}
                    className="inline-flex size-9 items-center justify-center rounded-full border border-ivory/20 text-ivory transition-colors hover:border-clay hover:text-clay"
                  >
                    <LogOut className="size-4" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LinkButton
                    href="/auth/register"
                    variant="ghost"
                    size="sm"
                    className="whitespace-nowrap"
                  >
                    {authLabels.signUp}
                  </LinkButton>
                  <LinkButton
                    href="/auth/login"
                    variant="outline"
                    size="sm"
                    className="whitespace-nowrap"
                  >
                    {authLabels.signIn}
                  </LinkButton>
                </div>
              )}
              <LinkButton
                href="/plan-my-trip"
                size="sm"
                className="whitespace-nowrap"
              >
                {nav.cta}
                <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </LinkButton>
            </div>
            <button
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-full border border-ivory/20 text-ivory transition-colors hover:border-sand hover:text-sand xl:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? nav.close : nav.menu}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? (
                <X className="size-5" aria-hidden="true" />
              ) : (
                <Menu className="size-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile / tablet drawer */}
      <AnimatePresence>
        {open ? (
          <motion.div
            id="mobile-menu"
            className="fixed inset-0 z-40 flex flex-col bg-obsidian/97 backdrop-blur-xl xl:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="container-azul flex h-16 items-center justify-end md:h-20">
              <span className="sr-only">{nav.menu}</span>
            </div>
            <nav
              aria-label="Mobile"
              className="container-azul flex flex-1 flex-col justify-center gap-1 overflow-y-auto pb-16"
            >
              {links.map(([href, label], i) => (
                <motion.div
                  key={href}
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.05, duration: 0.4 }}
                >
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    className="group flex items-baseline gap-4 border-b border-ivory/10 py-4"
                  >
                    <span className="font-mono text-[0.62rem] tracking-[0.3em] text-sand">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={`font-display text-3xl transition-colors md:text-4xl ${
                        isActive(href)
                          ? "text-sand"
                          : "text-ivory group-hover:text-sand"
                      }`}
                    >
                      {label}
                    </span>
                    {isActive(href) ? (
                      <span
                        aria-hidden="true"
                        className="ml-auto size-1.5 shrink-0 self-center rounded-full bg-sand"
                      />
                    ) : null}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="mt-6 space-y-4"
              >
                <div className="flex items-center justify-between gap-3 border border-ivory/10 rounded-2xl px-4 py-3">
                  <LocaleSwitcher locale={locale} labels={localeLabels} />
                  <ThemeToggle labels={themeLabels} />
                </div>
                {user ? (
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      href={user.isAdmin ? "/admin" : "/account"}
                      onClick={() => setOpen(false)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-ivory/25 px-4 py-3 text-sm text-ivory"
                    >
                      {user.isAdmin ? (
                        <LayoutDashboard className="size-4" aria-hidden="true" />
                      ) : (
                        <UserRound className="size-4" aria-hidden="true" />
                      )}
                      {user.isAdmin ? authLabels.admin : authLabels.account}
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        void signOut({ redirectTo: "/" });
                      }}
                      aria-label={authLabels.signOut}
                      className="inline-flex size-11 items-center justify-center rounded-full border border-ivory/25 text-ivory"
                    >
                      <LogOut className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <LinkButton
                      href="/auth/register"
                      variant="outline"
                      size="lg"
                      className="w-full"
                      onClick={() => setOpen(false)}
                    >
                      {authLabels.signUp}
                    </LinkButton>
                    <LinkButton
                      href="/auth/login"
                      variant="ghost"
                      size="lg"
                      className="w-full"
                      onClick={() => setOpen(false)}
                    >
                      {authLabels.signIn}
                    </LinkButton>
                  </div>
                )}
                <LinkButton
                  href="/plan-my-trip"
                  size="lg"
                  className="w-full"
                  onClick={() => setOpen(false)}
                >
                  {nav.cta}
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </LinkButton>
              </motion.div>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
