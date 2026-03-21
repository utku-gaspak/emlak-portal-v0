import en from "@/locales/en.json";
import tr from "@/locales/tr.json";

export type Locale = "tr" | "en";

export const LOCALE_COOKIE_NAME = "locale";
export const DEFAULT_LOCALE: Locale = "tr";

export type Dictionary = typeof tr;

export const dictionaries: Record<Locale, Dictionary> = {
  tr,
  en
};

export function normalizeLocale(value: string | null | undefined): Locale {
  return value === "en" ? "en" : "tr";
}

