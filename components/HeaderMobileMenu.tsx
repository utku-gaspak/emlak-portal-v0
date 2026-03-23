"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, MessageCircle, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

type NavItem = {
  href: string;
  label: string;
};

type HeaderMobileMenuProps = {
  navItems: NavItem[];
  whatsappHref: string;
};

export function HeaderMobileMenu({ navItems, whatsappHref }: HeaderMobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
        className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-950 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:text-slate-50 md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
            onClick={() => setIsOpen(false)}
          />

          <aside className="absolute right-0 top-0 flex h-full w-[min(86vw,22rem)] flex-col border-l border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-500">Menu</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Navigation</p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:text-slate-950 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:text-slate-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-2 px-5 py-5">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white hover:text-slate-950 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-50"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="border-t border-slate-100 px-5 py-5 dark:border-slate-800">
              <a
                href={whatsappHref}
                target={whatsappHref !== "#" ? "_blank" : undefined}
                rel={whatsappHref !== "#" ? "noreferrer" : undefined}
                onClick={() => setIsOpen(false)}
                className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 shadow-[0_10px_24px_rgba(16,185,129,0.16)] transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-100 hover:text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:border-emerald-700 dark:hover:bg-emerald-900/70 dark:hover:text-emerald-200"
              >
                <MessageCircle className="h-5 w-5" />
                WhatsApp
              </a>

              <div className="grid grid-cols-2 gap-3">
                <ThemeToggle />
                <LanguageSwitcher />
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
