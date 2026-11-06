export const LOCALES = ["en", "fr", "ar"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_COOKIE = "azul_locale";

export const RTL_LOCALES: readonly Locale[] = ["ar"];

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function isRTL(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale);
}
