"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Dictionary } from "@/lib/i18n-data";

type TranslationContextValue = {
  t: Dictionary;
};

const TranslationContext = createContext<TranslationContextValue | null>(null);

type TranslationProviderProps = {
  dictionary: Dictionary;
  children: ReactNode;
};

export function TranslationProvider({ dictionary, children }: TranslationProviderProps) {
  return <TranslationContext.Provider value={{ t: dictionary }}>{children}</TranslationContext.Provider>;
}

export function useTranslation(): TranslationContextValue {
  const context = useContext(TranslationContext);

  if (!context) {
    throw new Error("useTranslation must be used within a TranslationProvider.");
  }

  return context;
}
