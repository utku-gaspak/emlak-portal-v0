import Link from "next/link";
import { Facebook, Instagram, Mail, MapPin, Phone, Twitter } from "lucide-react";
import { getDictionary } from "@/lib/get-dictionary";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function Footer() {
  const t = await getDictionary();
  const isAuthenticated = await isAdminAuthenticated();
  const adminHref = isAuthenticated ? "/admin/listings" : "/admin/login";
  const adminLabel = isAuthenticated ? t.siteHeader.dashboard : t.footer.adminLogin;

  return (
    <footer id="contact" className="mt-16 border-t border-white/10 bg-gray-950 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-4">
          <div className="space-y-5">
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.34em] text-amber-400">{t.siteHeader.brandMark}</p>
              <p className="text-2xl font-black tracking-[0.16em] text-white">{t.siteHeader.brandName}</p>
            </div>

            <p className="max-w-sm text-sm leading-7 text-slate-400">{t.footer.vision}</p>

            <div className="flex items-center gap-3">
              {[
                { href: "https://instagram.com", label: t.footer.socialInstagram, icon: Instagram },
                { href: "https://facebook.com", label: t.footer.socialFacebook, icon: Facebook },
                { href: "https://x.com", label: t.footer.socialTwitter, icon: Twitter }
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
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
              <li>
                <Link className="text-slate-400 transition hover:text-white" href={adminHref}>
                  {adminLabel}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-white">{t.footer.categories}</h2>
            <ul className="mt-5 space-y-3 text-sm">
              <li className="text-slate-400 transition hover:text-white">{t.footer.apartment}</li>
              <li className="text-slate-400 transition hover:text-white">{t.footer.villa}</li>
              <li className="text-slate-400 transition hover:text-white">{t.footer.land}</li>
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-white">{t.footer.contact}</h2>
            <ul className="mt-5 space-y-4 text-sm">
              <li className="flex items-start gap-3 text-slate-400">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                <span>{t.footer.address}</span>
              </li>
              <li>
                <a href={`tel:${t.footer.phone.replace(/\s/g, "")}`} className="flex items-start gap-3 text-slate-400 transition hover:text-white">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  <span>{t.footer.phone}</span>
                </a>
              </li>
              <li>
                <a href={`mailto:${t.footer.email}`} className="flex items-start gap-3 text-slate-400 transition hover:text-white">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  <span>{t.footer.email}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>{t.footer.copyright}</p>
          <p className="max-w-2xl">{t.footer.disclaimer}</p>
        </div>
      </div>
    </footer>
  );
}
