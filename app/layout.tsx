import type { Metadata } from "next";
import Link from "next/link";
import "@/app/globals.css";
import { Footer } from "@/components/Footer";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { TranslationProvider } from "@/context/TranslationContext";
import { getDictionary } from "@/lib/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const t = getDictionary();

  return {
    title: t.meta.title,
    description: t.meta.description
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const t = getDictionary();

  return (
    <html lang={t.meta.lang}>
      <body className="bg-slate-50 text-slate-950">
        <TranslationProvider dictionary={t}>
          <header className="border-b border-slate-200/70 bg-white/90 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <Link href="/" className="inline-flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white shadow-sm">
                  {t.siteHeader.brandMark}
                </span>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">{t.siteHeader.brandName}</p>
                  <p className="text-xs text-slate-500">{t.meta.description}</p>
                </div>
              </Link>

              <div className="flex items-center gap-3">
                <LanguageSwitcher />
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
          <Footer />
        </TranslationProvider>
      </body>
    </html>
  );
}
