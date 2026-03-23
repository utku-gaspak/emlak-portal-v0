import Link from "next/link";
import { Home, MessageCircle } from "lucide-react";
import { getDictionary } from "@/lib/get-dictionary";
import { getFirmName } from "@/lib/brand";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { getPublicContactConfig } from "@/lib/contact-links";

export async function Header() {
  const t = await getDictionary();
  const firmName = getFirmName();
  const contact = getPublicContactConfig();
  const whatsappHref = contact.phone ? `https://wa.me/${contact.phone.replace(/\D/g, "")}` : "#";

  const navItems = [
    { href: "/", label: t.siteHeader.navHome },
    { href: "/#listings-grid", label: t.siteHeader.navListings },
    { href: "/#about", label: t.siteHeader.navAbout },
    { href: "/#contact", label: t.siteHeader.navContact }
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-md dark:border-slate-800/70 dark:bg-slate-950/75">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 py-4">
          <Link href="/" className="group flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-950 to-slate-800 text-white shadow-lg shadow-slate-950/15 transition-transform duration-200 group-hover:scale-105 dark:from-amber-500 dark:to-amber-400 dark:text-slate-950">
              <Home className="h-5 w-5" />
            </span>

            <div className="inline-flex rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 shadow-sm dark:border-amber-500/20 dark:bg-amber-500/10">
              <p className="text-xl font-black tracking-[0.16em] text-slate-950 sm:text-2xl dark:text-slate-50">
                {firmName}
              </p>
            </div>
          </Link>

          <nav className="hidden flex-1 items-center justify-center gap-2 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href={whatsappHref}
              target={contact.phone ? "_blank" : undefined}
              rel={contact.phone ? "noreferrer" : undefined}
              aria-label="WhatsApp"
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-700 shadow-[0_10px_24px_rgba(16,185,129,0.18)] transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-100 hover:text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300 dark:shadow-[0_10px_24px_rgba(16,185,129,0.16)] dark:hover:border-emerald-700 dark:hover:bg-emerald-900/70 dark:hover:text-emerald-200"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>

            <ThemeToggle />
            <LanguageSwitcher />

          </div>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-2 pb-4 lg:hidden">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="inline-flex items-center rounded-full border border-slate-200/80 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-950 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:text-slate-50"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
