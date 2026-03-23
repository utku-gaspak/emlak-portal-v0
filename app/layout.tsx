import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "@/app/globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import { TranslationProvider } from "@/context/TranslationContext";
import { getDictionary, getServerLocale } from "@/lib/get-dictionary";

const roboto = Roboto({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "700", "900"],
  display: "swap"
});

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
      <head>
        <meta charSet="utf-8" />
      </head>
      <body
        suppressHydrationWarning
        className={`${roboto.className} flex min-h-screen flex-col bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100`}
      >
        <ThemeProvider>
          <TranslationProvider dictionary={t}>
            <Header />
            <main className="min-h-[85vh] flex-1 px-4 py-6 sm:px-6 lg:px-8">
              <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 sm:gap-12">{children}</div>
            </main>
            <Footer />
          </TranslationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
