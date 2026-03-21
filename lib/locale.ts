"use client";

import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, dictionaries, normalizeLocale, type Dictionary, type Locale } from "@/lib/i18n-data";

function readCookieLocale(): Locale {
  if (typeof document === "undefined") {
    return DEFAULT_LOCALE;
  }

  const cookieValue = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${LOCALE_COOKIE_NAME}=`))
    ?.split("=")[1];

  return normalizeLocale(cookieValue);
}

export function getDictionary(locale?: Locale): Dictionary {
  const resolvedLocale = locale ?? readCookieLocale();
  return dictionaries[resolvedLocale] ?? dictionaries[DEFAULT_LOCALE];
}

export function getClientLocale(): Locale {
  return readCookieLocale();
}

export function setLocaleCookie(locale: Locale): void {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

