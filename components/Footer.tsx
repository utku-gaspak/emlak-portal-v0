import Link from "next/link";
import { Facebook, Instagram, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { getDictionary, getServerLocale } from "@/lib/get-dictionary";
import { getFirmName } from "@/lib/brand";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getPublicContactConfig } from "@/lib/contact-links";
import { getParentCategories } from "@/lib/categories";
import { getLocalizedCategoryName } from "@/lib/category-utils";

function normalizeText(value: string): string {
  return value
    .replace(/[çÇ]/g, "c")
    .replace(/[ğĞ]/g, "g")
    .replace(/[ıİ]/g, "i")
    .replace(/[öÖ]/g, "o")
    .replace(/[şŞ]/g, "s")
    .replace(/[üÜ]/g, "u")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function buildCategoryHref(categoryId: string): { pathname: string; query: { parentCategoryId: string }; hash: string } {
  return {
    pathname: "/",
    query: { parentCategoryId: categoryId },
    hash: "search-filters-panel"
  };
}

export async function Footer() {
  const locale = await getServerLocale();
  const [t, rootCategories] = await Promise.all([getDictionary(locale), getParentCategories()]);
  const firmName = getFirmName();
  const copyrightLine =
    t.meta.lang === "en"
      ? `© ${new Date().getFullYear()} ${firmName}. All rights reserved.`
      : `© ${new Date().getFullYear()} ${firmName}. Tüm hakları saklıdır.`;
  const contact = getPublicContactConfig();
  const isAuthenticated = await isAdminAuthenticated();
  const footerCategoryItems = [
    {
      label: t.footer.apartment,
      keywords: ["daire", "apartment", "flat"]
    },
    {
      label: t.footer.villa,
      keywords: ["villa"]
    },
    {
      label: t.footer.land,
      keywords: ["arsa", "land", "tarla"]
    },
    {
      label: t.footer.commercial,
      keywords: ["isyeri", "is yeri", "commercial", "office", "dukkan", "magaza", "shop", "ticari"]
    }
  ] as const;

  const categoryLinks = footerCategoryItems
    .map((item) => {
      const category = rootCategories.find((candidate) => {
        const localizedName = normalizeText(getLocalizedCategoryName(candidate, locale));
        const rawHaystack = normalizeText([candidate.name, candidate.slug ?? ""].join(" "));
        return item.keywords.some((keyword) => localizedName.includes(normalizeText(keyword)) || rawHaystack.includes(normalizeText(keyword)));
      });

      return category ? { label: item.label, href: buildCategoryHref(category.id) } : { label: item.label, href: null };
    });
  const socialLinks = [
    { href: contact.instagramUrl || "#", label: t.footer.socialInstagram, icon: Instagram, external: Boolean(contact.instagramUrl) },
    { href: contact.facebookUrl || "#", label: t.footer.socialFacebook, icon: Facebook, external: Boolean(contact.facebookUrl) }
  ];

  return (
    <footer id="contact" className="mt-16 border-t border-white/10 bg-gray-950 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-4">
          <div className="space-y-5">
            <div className="space-y-3">
              <div className="inline-flex min-w-0 shrink-0 items-center rounded-2xl border border-orange-300/80 bg-orange-50 px-4 py-2 shadow-[0_10px_24px_rgba(249,115,22,0.16),0_0_0_1px_rgba(249,115,22,0.08)] transition-shadow duration-300 hover:shadow-[0_14px_30px_rgba(249,115,22,0.22),0_0_0_1px_rgba(249,115,22,0.12)] dark:border-amber-500/20 dark:bg-amber-500/10 sm:px-5 sm:py-2.5">
                <p className="whitespace-nowrap text-xl font-extrabold tracking-tighter text-amber-700 dark:text-amber-300 sm:text-2xl md:text-2xl">
                  {firmName}
                </p>
              </div>
            </div>

            <p className="max-w-sm text-sm leading-7 text-slate-400">{t.footer.vision}</p>

            <div className="flex items-center gap-3">
              {socialLinks.map((item) => {
                  const Icon = item.icon;

                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      target={item.external ? "_blank" : undefined}
                      rel={item.external ? "noreferrer" : undefined}
                      aria-label={item.label}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:-translate-y-0.5 hover:border-amber-400/40 hover:bg-amber-400/10 hover:text-amber-300"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-white">{t.footer.quickLinks}</h2>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <Link className="text-slate-400 transition hover:text-white" href="/">
                  {t.footer.home}
                </Link>
              </li>
              <li>
                <Link className="text-slate-400 transition hover:text-white" href="/#listings-grid">
                  {t.footer.allListings}
                </Link>
              </li>
              {isAuthenticated ? (
                <li>
                  <Link className="text-slate-400 transition hover:text-white" href="/admin/listings">
                    {t.siteHeader.dashboard}
                  </Link>
                </li>
              ) : null}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-white">{t.footer.categories}</h2>
            <ul className="mt-5 space-y-3 text-sm">
              {categoryLinks.map((item) => (
                <li key={item.label}>
                  {item.href ? (
                    <Link className="text-slate-400 transition hover:text-white" href={item.href}>
                      {item.label}
                    </Link>
                  ) : (
                    <span className="text-slate-400">{item.label}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-white">{t.footer.contact}</h2>
            <ul className="mt-5 space-y-4 text-sm">
              <li className="flex items-center gap-3 text-slate-400">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                <span>{contact.address || t.footer.address}</span>
              </li>
              <li>
                <a
                  href={contact.phone ? `https://wa.me/${contact.phone.replace(/\D/g, "")}` : "#"}
                  target={contact.phone ? "_blank" : undefined}
                  rel={contact.phone ? "noreferrer" : undefined}
                  className="flex items-center gap-3 text-slate-400 transition hover:text-white"
                >
                  <MessageCircle className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>{contact.phone || t.footer.phone}</span>
                </a>
              </li>
              {contact.phone ? (
                <li>
                  <a href={`tel:${contact.phone}`} className="flex items-center gap-3 text-slate-400 transition hover:text-white">
                    <Phone className="h-4 w-4 shrink-0 text-amber-400" />
                    <span>{contact.phone}</span>
                  </a>
                </li>
              ) : null}
              <li>
                <a href={contact.email ? `mailto:${contact.email}` : "#"} className="flex items-center gap-3 text-slate-400 transition hover:text-white">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  <span>{contact.email || t.footer.email}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>{copyrightLine}</p>
          <p className="max-w-2xl">{t.footer.disclaimer}</p>
        </div>
      </div>
    </footer>
  );
}
