import type { Metadata, Viewport } from "next";
import { Fraunces, IBM_Plex_Sans_Arabic, Inter } from "next/font/google";
import { siteConfig } from "@/config/site";
import { getDict, getLocale, isRTL, LOCALES } from "@/lib/i18n";
import { Analytics } from "@/components/analytics/Analytics";
import { organizationJsonLd, websiteJsonLd, JsonLd } from "@/components/seo/JsonLd";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const arabic = IBM_Plex_Sans_Arabic({
  subsets: ["latin", "arabic"],
  weight: ["400", "500", "600"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.descriptor}`,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.name }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    siteName: `${siteConfig.name} — ${siteConfig.descriptor}`,
    title: `${siteConfig.name} — ${siteConfig.descriptor}`,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — ${siteConfig.descriptor}`,
    description: siteConfig.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#080808",
  colorScheme: "dark light",
};

/* Sets the theme attribute before first paint — no flash of the wrong theme.
   Reads the stored choice, else falls back to the OS preference. */
const themeScript = `(function(){var t="dark";try{t=localStorage.getItem("azul-theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";}}catch(e){t="dark";}var d=document.documentElement;d.dataset.theme=t;d.style.colorScheme=t;var m=document.querySelector('meta[name="theme-color"]');if(m&&t==="light"){m.setAttribute("content","#f6f2e9");}})();`;

export default async function RootLayout({
  children,
}: LayoutProps<"/">) {
  const locale = await getLocale();
  const dict = getDict(locale);

  return (
    <html
      lang={locale}
      dir={isRTL(locale) ? "rtl" : "ltr"}
      className={`${display.variable} ${sans.variable} ${arabic.variable}`}
      data-scroll-behavior="smooth"
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <a className="skip-link" href="#main">
          {dict.nav.skipToContent}
        </a>
        <Analytics />
        <JsonLd
          data={websiteJsonLd({
            url: siteConfig.url,
            name: `${siteConfig.name} — ${siteConfig.descriptor}`,
            description: siteConfig.description,
            locales: LOCALES,
          })}
        />
        <JsonLd
          data={organizationJsonLd({
            url: siteConfig.url,
            name: siteConfig.name,
            descriptor: siteConfig.descriptor,
            description: siteConfig.description,
            email: siteConfig.contact.email,
            phone: siteConfig.contact.phone,
            address: siteConfig.contact.address,
            sameAs: [siteConfig.social.instagram, siteConfig.social.facebook, siteConfig.social.tiktok],
          })}
        />
        {children}
      </body>
    </html>
  );
}
