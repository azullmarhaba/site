export const siteConfig = {
  name: "AZUL",
  descriptor: "MARHABA MOROCCO 2027",
  tagline: "YOUR MOROCCO STARTS HERE.",
  taglineAlt: "Discover Morocco. Feel the Welcome.",
  description:
    "AZUL is a premium Moroccan travel studio based in Marrakech — private desert journeys, Atlas Mountain treks, medina experiences and tailored excursions across Morocco.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  locale: "en",
  locales: ["en", "fr", "ar"] as const,
  keywords: [
    "Morocco tourism",
    "Marrakech excursions",
    "Morocco tours",
    "Agafay desert",
    "Atlas Mountains",
    "Morocco travel experiences",
    "Sahara desert trips",
    "luxury travel Morocco",
  ],
  contact: {
    email: "hello@azul.ma",
    phone: "+212 600 000 000",
    address: "27 Rue Ibn Aicha, Guéliz, Marrakech 40000, Morocco",
    hours: "Mon–Sat 09:00–19:00 (GMT+1)",
  },
  social: {
    instagram: "https://instagram.com/azul.marhaba",
    facebook: "https://facebook.com/azul.marhaba",
    tiktok: "https://tiktok.com/@azul.marhaba",
  },
  whatsapp: {
    number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "",
    label: "Chat with AZUL",
  },
} as const;

export type Locale = (typeof siteConfig.locales)[number];
