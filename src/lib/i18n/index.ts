import { cookies } from "next/headers";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isLocale,
  type Locale,
} from "./config";
import { en, type Dictionary } from "./dictionaries/en";
import { fr } from "./dictionaries/fr";
import { ar } from "./dictionaries/ar";

const dictionaries: Record<Locale, Dictionary> = { en, fr, ar };

export function getDict(locale: Locale): Dictionary {
  return dictionaries[locale] ?? en;
}

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export { LOCALE_COOKIE, isRTL, isLocale, LOCALES, DEFAULT_LOCALE } from "./config";
export type { Locale } from "./config";
export type { Dictionary };
