import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { InstagramIcon, FacebookIcon } from "@/components/ui/SocialIcons";
import { siteConfig } from "@/config/site";
import type { Dictionary } from "@/lib/i18n";

export function Footer({ dict }: { dict: Dictionary }) {
  const year = new Date().getFullYear();

  const explore: [string, string][] = [
    ["/destinations", dict.nav.destinations],
    ["/experiences", dict.nav.experiences],
    ["/tours", dict.nav.tours],
    ["/plan-my-trip", dict.nav.planTrip],
    ["/custom-tour", dict.nav.customTour],
    ["/blog", dict.nav.blog],
  ];
  const company: [string, string][] = [
    ["/about", dict.nav.about],
    ["/reviews", dict.footer.reviews],
    ["/faq", dict.footer.faq],
    ["/contact", dict.nav.contact],
  ];
  const legal: [string, string][] = [
    ["/privacy", dict.footer.privacy],
    ["/terms", dict.footer.terms],
  ];

  return (
    <footer className="border-t border-ivory/10 bg-deep">
      <div className="container-azul grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-4 lg:py-20">
        {/* Brand */}
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <span className="relative size-11 shrink-0">
              <Image
                src="/brand/azul-logo-light.png"
                alt=""
                fill
                sizes="44px"
                className="object-contain light:hidden"
              />
              <Image
                src="/brand/azul-logo-dark.png"
                alt=""
                fill
                sizes="44px"
                className="hidden object-contain light:block"
              />
            </span>
            <span className="leading-none">
              <span className="block font-display text-xl tracking-[0.28em]">
                AZUL
              </span>
              <span className="mt-1 block font-mono text-[0.52rem] uppercase tracking-[0.3em] text-sand">
                Marhaba Morocco 2027
              </span>
            </span>
          </div>
          <p className="font-display text-lg text-sand">{dict.footer.tagline}</p>
          <p className="max-w-xs text-sm leading-relaxed opacity-60">
            {dict.footer.blurb}
          </p>
          <div className="flex items-center gap-3">
            <a
              href={siteConfig.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="inline-flex size-10 items-center justify-center rounded-full border border-ivory/15 text-ivory/70 transition-colors hover:border-sand hover:text-sand"
            >
              <InstagramIcon className="size-4" />
            </a>
            <a
              href={siteConfig.social.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="inline-flex size-10 items-center justify-center rounded-full border border-ivory/15 text-ivory/70 transition-colors hover:border-sand hover:text-sand"
            >
              <FacebookIcon className="size-4" />
            </a>
          </div>
        </div>

        {/* Explore */}
        <nav aria-label={dict.footer.explore} className="space-y-4">
          <p className="eyebrow">{dict.footer.explore}</p>
          <ul className="space-y-2.5">
            {explore.map(([href, label]) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-sm text-ivory/70 transition-colors hover:text-sand"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Company */}
        <nav aria-label={dict.footer.company} className="space-y-4">
          <p className="eyebrow">{dict.footer.company}</p>
          <ul className="space-y-2.5">
            {company.map(([href, label]) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-sm text-ivory/70 transition-colors hover:text-sand"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Contact */}
        <div className="space-y-4">
          <p className="eyebrow">{dict.footer.contact}</p>
          <ul className="space-y-3 text-sm text-ivory/70">
            <li className="flex gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-sand" aria-hidden="true" />
              <span>{siteConfig.contact.address}</span>
            </li>
            <li className="flex gap-3">
              <Clock className="mt-0.5 size-4 shrink-0 text-sand" aria-hidden="true" />
              <span>{siteConfig.contact.hours}</span>
            </li>
            <li className="flex gap-3">
              <Mail className="mt-0.5 size-4 shrink-0 text-sand" aria-hidden="true" />
              <a
                href={`mailto:${siteConfig.contact.email}`}
                className="transition-colors hover:text-sand"
              >
                {siteConfig.contact.email}
              </a>
            </li>
            <li className="flex gap-3">
              <Phone className="mt-0.5 size-4 shrink-0 text-sand" aria-hidden="true" />
              <a
                href={`tel:${siteConfig.contact.phone.replace(/\s/g, "")}`}
                dir="ltr"
                className="transition-colors hover:text-sand"
              >
                {siteConfig.contact.phone}
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-ivory/10">
        <div className="container-azul flex flex-col items-center justify-between gap-4 py-6 text-xs text-ivory/45 md:flex-row">
          <p>
            © {year} AZUL Agency — {dict.footer.rights}
          </p>
          <div className="flex items-center gap-5">
            {legal.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="transition-colors hover:text-sand"
              >
                {label}
              </Link>
            ))}
            <span className="hidden md:inline">{dict.footer.madeIn}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
