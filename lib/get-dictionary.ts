import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, dictionaries, normalizeLocale, type Dictionary, type Locale } from "@/lib/i18n-data";

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  return normalizeLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
}

export async function getDictionary(locale?: Locale): Promise<Dictionary> {
  const resolvedLocale = locale ?? (await getServerLocale());
  return dictionaries[resolvedLocale] ?? dictionaries[DEFAULT_LOCALE];
}
