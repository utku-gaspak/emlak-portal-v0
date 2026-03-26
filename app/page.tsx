import Image from "next/image";
import { PropertyCard } from "@/components/PropertyCard";
import { SearchFiltersIsland } from "@/components/SearchFiltersIsland";
import { FileBadge, Handshake, ShieldCheck } from "lucide-react";
import { getCategories } from "@/lib/categories";
import { getListings, parseListingFilters } from "@/lib/listings-store";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getDictionary } from "@/lib/get-dictionary";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams: Promise<any>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const t = await getDictionary();
  const resolvedParams = await searchParams;
  const filters = parseListingFilters(resolvedParams);
  const [filteredListings, categories] = await Promise.all([getListings(filters), getCategories()]);
  const canDelete = await isAdminAuthenticated();

  return (
    <div className="space-y-10 sm:space-y-12">
      <section className="relative isolate rounded-[3rem] bg-slate-950 text-white shadow-[0_32px_80px_rgba(15,23,42,0.3)]">
        <div className="absolute inset-0 overflow-hidden rounded-[3rem]" aria-hidden="true">
          <Image
            src="https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1800&q=80"
            alt=""
            fill
            priority
            sizes="100vw"
            quality={75}
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/55" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.14),_transparent_28%)]" />
        </div>

        <div className="relative z-10 flex min-h-[78vh] flex-col items-center justify-center px-6 py-10 text-center sm:px-8 lg:px-12">
          <div className="max-w-4xl space-y-6">
            <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-white/80 backdrop-blur">
              {t.home.heroEyebrow}
            </p>

            <div className="space-y-4">
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-7xl">{t.home.heroTitle}</h1>
              <p className="mx-auto max-w-2xl text-base leading-7 text-white/85 sm:text-lg lg:text-xl">{t.home.heroDescription}</p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <a
                id="scroll-to-listings"
                data-automation="scroll-to-listings"
                href="#listings-grid"
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15"
              >
                {t.common.viewDetails}
              </a>
            </div>
          </div>

          <div className="relative z-20 mt-10 w-full max-w-6xl overflow-visible px-0 sm:px-4">
            <SearchFiltersIsland categories={categories} showHeader={false} />
          </div>
        </div>
      </section>

      <section
        id="about"
        className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-[0_18px_55px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900/80"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-600 dark:text-amber-400">
              {t.features.badge}
            </p>
            <h2 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              {t.features.title}
            </h2>
            <p className="text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">{t.features.subtitle}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[36rem] lg:flex-1">
            {[
              {
                title: "Onaylı İlanlar",
                desc: "Sitemizde yalnızca EIDS standartlarına uygun ve mülk sahibi tarafından yetkilendirilmiş resmi ilanlar yayınlanmaktadır.",
                tone: "from-amber-500/15 to-amber-500/5",
                icon: ShieldCheck
              },
              {
                title: "Yetki Belgesi",
                desc: "Taşınmaz Ticareti Yetki Numarası: 220087. Gaspak Emlak, Ticaret Bakanlığı tarafından yetkilendirilmiş resmi bir işletmedir.",
                tone: "from-sky-500/15 to-sky-500/5",
                icon: FileBadge
              },
              {
                title: "Güvenilir Deneyim",
                desc: "Edirne piyasasında yılların verdiği tecrübe ve şeffaf hizmet anlayışıyla, alım-satım süreçlerinizi güvenle yönetiyoruz.",
                tone: "from-emerald-500/15 to-emerald-500/5",
                icon: Handshake
              }
            ].map((item) => (
              <div
                key={item.title}
                className={`rounded-3xl border border-slate-200 bg-gradient-to-br ${item.tone} p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/60`}
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-amber-500 shadow-sm">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <p className="text-lg font-black text-slate-950 dark:text-white sm:text-xl">{item.title}</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {filteredListings.length === 0 ? (
        <section
          id="empty-listings"
          data-automation="no-results"
          className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-[0_18px_55px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900/80"
        >
          <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{t.home.noResultsTitle}</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{t.home.noResultsDescription}</p>
        </section>
      ) : (
        <section id="listings-grid" data-automation="listings-grid" className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredListings.map((listing) => (
            <PropertyCard key={listing.id} listing={listing} canDelete={canDelete} />
          ))}
        </section>
      )}
    </div>
  );
}
