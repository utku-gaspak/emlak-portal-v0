import en from "@/locales/en.json";
import tr from "@/locales/tr.json";

export type Locale = "tr" | "en";

export const LOCALE_COOKIE_NAME = "locale";
export const DEFAULT_LOCALE: Locale = "tr";

export type Dictionary = typeof tr;

function fixMojibakeString(value: string): string {
  if (!/[ÃÄÅâÂ]/.test(value)) {
    return value;
  }

  try {
    return Buffer.from(value, "latin1").toString("utf8");
  } catch {
    return value;
  }
}

function sanitizeValue<T>(value: T): T {
  if (typeof value === "string") {
    return fixMojibakeString(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item)) as T;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [key, sanitizeValue(nestedValue)]);
    return Object.fromEntries(entries) as T;
  }

  return value;
}

export const dictionaries: Record<Locale, Dictionary> = {
  tr: sanitizeValue(tr),
  en: sanitizeValue(en)
};

export function normalizeLocale(value: string | null | undefined): Locale {
  return value === "en" ? "en" : "tr";
}
