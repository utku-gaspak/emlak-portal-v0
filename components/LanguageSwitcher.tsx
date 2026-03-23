"use client";

import { useRouter } from "next/navigation";
import { getClientLocale, setLocaleCookie } from "@/lib/locale";
import type { Locale } from "@/lib/i18n-data";

type LanguageOption = {
  code: Locale;
  label: string;
};

const languages: LanguageOption[] = [
  { code: "tr", label: "TR" },
  { code: "en", label: "EN" }
];

function FlagIcon({ locale }: { locale: Locale }) {
  if (locale === "tr") {
    return (
      <svg viewBox="0 0 24 16" className="h-3.5 w-5 rounded-sm shadow-sm" aria-hidden="true">
        <rect width="24" height="16" rx="3" fill="#E11D48" />
        <circle cx="9" cy="8" r="4" fill="#fff" />
        <circle cx="10.5" cy="8" r="3.2" fill="#E11D48" />
        <path d="M14.7 8.1l1.6.5-1.1 1.3.1 1.7-1.4-.9-1.6.6.5-1.6-1-1.4 1.7-.1 1-1.3z" fill="#fff" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 16" className="h-3.5 w-5 rounded-sm shadow-sm" aria-hidden="true">
      <rect width="24" height="16" rx="3" fill="#1D4ED8" />
      <rect x="0" y="0" width="24" height="3" fill="#fff" />
      <rect x="0" y="6.5" width="24" height="3" fill="#fff" />
      <rect x="0" y="13" width="24" height="3" fill="#fff" />
      <rect x="9" y="0" width="3" height="16" fill="#fff" />
    </svg>
  );
}

export function LanguageSwitcher() {
  const router = useRouter();
  const currentLocale = getClientLocale();

  function handleLocaleChange(locale: Locale) {
    if (locale === currentLocale) {
      return;
    }

    setLocaleCookie(locale);
    router.refresh();
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
      {languages.map((language) => {
        const isActive = language.code === currentLocale;

        return (
          <button
            key={language.code}
            type="button"
            data-automation={`language-switch-${language.code}`}
            onClick={() => handleLocaleChange(language.code)}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition ${
              isActive ? "bg-slate-950 text-white shadow-sm dark:bg-amber-500 dark:text-slate-950" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            }`}
            aria-pressed={isActive}
            aria-label={`${language.label} language`}
          >
            <FlagIcon locale={language.code} />
            <span>{language.label}</span>
          </button>
        );
      })}
    </div>
  );
}
