import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, dictionaries, normalizeLocale, type Dictionary, type Locale } from "@/lib/i18n-data";

export function getServerLocale(): Locale {
  const cookieStore = cookies();
  return normalizeLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
}

export function getDictionary(locale?: Locale): Dictionary {
  const resolvedLocale = locale ?? getServerLocale();
  return dictionaries[resolvedLocale] ?? dictionaries[DEFAULT_LOCALE];
}

