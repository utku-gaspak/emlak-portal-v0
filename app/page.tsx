import Link from "next/link";
import { PropertyCard } from "@/components/PropertyCard";
import { SearchFilters } from "@/components/SearchFilters";
import { getListings, parseListingFilters } from "@/lib/listings-store";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getDictionary } from "@/lib/locale";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
  );
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const t = getDictionary();
  const filters = parseListingFilters(searchParams);
  const [allListings, filteredListings] = await Promise.all([getListings(), getListings(filters)]);
  const canDelete = isAdminAuthenticated();

  const houseListings = allListings.filter((listing) => listing.type === "house");
  const landListings = allListings.filter((listing) => listing.type === "land");

  const roomOptions = uniqueSorted(houseListings.map((listing) => listing.roomCount));
  const heatingOptions = uniqueSorted(houseListings.map((listing) => listing.heatingType));
  const zoningOptions = uniqueSorted(landListings.map((listing) => listing.zoningStatus));

  return (
    <div className="space-y-10 sm:space-y-12">
      <section className="relative isolate overflow-hidden rounded-[3rem] bg-slate-950 text-white shadow-[0_32px_80px_rgba(15,23,42,0.3)]">
        <div
          data-automation="hero-background"
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1800&q=80')"
          }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-black/55" aria-hidden="true" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.14),_transparent_28%)]" aria-hidden="true" />

        <div className="relative flex min-h-[78vh] flex-col items-center justify-center px-6 py-10 text-center sm:px-8 lg:px-12">
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

          <div className="mt-10 w-full max-w-6xl px-0 sm:px-4">
            <SearchFilters roomOptions={roomOptions} heatingOptions={heatingOptions} zoningOptions={zoningOptions} showHeader={false} />
          </div>
        </div>
      </section>

      {filteredListings.length === 0 ? (
        <section
          id="empty-listings"
          data-automation="no-results"
          className="rounded-[2rem] bg-white p-10 text-center shadow-[0_18px_55px_rgba(15,23,42,0.08)]"
        >
          <p className="text-lg font-bold text-slate-900">{t.home.noResultsTitle}</p>
          <p className="mt-2 text-sm text-slate-600">{t.home.noResultsDescription}</p>
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
