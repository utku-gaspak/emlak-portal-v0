import en from "@/locales/en.json";

export type Dictionary = typeof en;

const dictionaries: Record<string, Dictionary> = {
  en
};

export function getDictionary(locale = "en"): Dictionary {
  return dictionaries[locale] ?? dictionaries.en;
}
