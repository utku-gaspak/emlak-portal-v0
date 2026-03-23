import type { Metadata } from "next";
import Link from "next/link";
import "@/app/globals.css";
import { Footer } from "@/components/Footer";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ThemeProvider } from "@/components/ThemeProvider";
import { TranslationProvider } from "@/context/TranslationContext";
import { getDictionary, getServerLocale } from "@/lib/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const t = await getDictionary(locale);

  return {
    title: t.meta.title,
    description: t.meta.description
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getServerLocale();
  const t = await getDictionary(locale);

  return (
    <html lang={t.meta.lang} suppressHydrationWarning>
      <body className="bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
        <ThemeProvider>
          <TranslationProvider dictionary={t}>
            <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/75 backdrop-blur-md dark:border-slate-800/70 dark:bg-slate-950/75">
              <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
                <Link href="/" className="inline-flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white shadow-sm dark:bg-amber-500 dark:text-slate-950">
                    {t.siteHeader.brandMark}
                  </span>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700 dark:text-amber-400">{t.siteHeader.brandName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t.meta.description}</p>
                  </div>
                </Link>

                <div className="flex items-center gap-3">
                  <ThemeToggle />
                  <LanguageSwitcher />
                </div>
              </div>
            </header>

            <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
            <Footer />
          </TranslationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
