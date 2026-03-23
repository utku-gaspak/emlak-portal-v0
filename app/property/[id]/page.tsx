import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Camera, Eye, MapPin, Ruler, Tag, Thermometer } from "lucide-react";
import { CommunicationActionBar } from "@/components/CommunicationActionBar";
import { ImageGallery } from "@/components/ImageGallery";
import { PropertyMap } from "@/components/PropertyMap";
import { ViewCounter } from "@/components/ViewCounter";
import { formatListingPrice } from "@/lib/currency";
import { getListingById } from "@/lib/listings-store";
import { getOptimizedCloudinaryUrl } from "@/lib/image-url";
import { getFirmName } from "@/lib/brand";
import { getDictionary } from "@/lib/get-dictionary";
import { getSiteUrl } from "@/lib/site-url";

type PropertyDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const SITE_URL = getSiteUrl();

function buildOgImage(listingImage?: string | null): string | null {
  if (!listingImage) {
    return null;
  }

  const optimized = getOptimizedCloudinaryUrl(listingImage, 1000);

  if (/^https?:\/\//i.test(optimized)) {
    return optimized;
  }

  try {
    return new URL(optimized, SITE_URL).toString();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PropertyDetailPageProps): Promise<Metadata> {
  const t = await getDictionary();
  const firmName = getFirmName();
  const resolvedParams = await params;
  const listing = await getListingById(resolvedParams.id);

  if (!listing) {
    return {
      title: firmName,
      description: t.meta.description
    };
  }

  const description = listing.description.slice(0, 160);
  const ogImage = buildOgImage(listing.images[0]);

  return {
    title: `${listing.title} | ${firmName}`,
    description,
    alternates: {
      canonical: `${SITE_URL}/property/${listing.id}`
    },
    openGraph: {
      type: "article",
      url: `${SITE_URL}/property/${listing.id}`,
      siteName: firmName,
      title: `${listing.title} | ${firmName}`,
      description,
      images: ogImage
        ? [
            {
              url: ogImage,
              width: 1200,
              height: 800,
              alt: listing.title
            }
          ]
        : []
    },
    twitter: {
      card: "summary_large_image",
      title: `${listing.title} | ${firmName}`,
      description,
      images: ogImage ? [ogImage] : []
    }
  };
}

function SpecificationItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-950/60">
      <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="mt-2 text-base font-bold text-slate-900 dark:text-slate-100">{value}</dd>
    </div>
  );
}

export default async function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  const t = await getDictionary();
  const resolvedParams = await params;
  const listing = await getListingById(resolvedParams.id);

  if (!listing) {
    notFound();
  }

  const heatingType = listing.type === "house" ? listing.heatingType?.trim() ?? "" : "";
  const hasHeatingType = Boolean(heatingType);
  const listingStatusLabel = listing.status === "satilik" ? t.filters.statusForSale : t.filters.statusForRent;

  return (
    <div data-automation="property-detail-container" className="mx-auto max-w-5xl space-y-8">
      <section className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-[0_22px_70px_rgba(2,6,23,0.35)]">
        <div className="space-y-8 p-6 sm:p-8 lg:p-10">
          <div className="space-y-7 lg:space-y-8">
            <div className="inline-flex rounded-full bg-brand-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-brand-700 dark:bg-amber-500/10 dark:text-amber-400">
              {listing.type === "house" ? t.propertyDetail.houseTypeBadge : t.propertyDetail.landTypeBadge}
            </div>

            <div className="space-y-4">
              <h1 id="detail-title" data-automation="detail-title" className="text-4xl font-black tracking-tight text-slate-950 dark:text-slate-100 sm:text-5xl">
                {listing.title}
              </h1>
              <p id="detail-price" data-automation="detail-price" className="text-3xl font-black text-brand-700 dark:text-amber-400 sm:text-4xl">
                {formatListingPrice(listing.price, listing.currency)}
              </p>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold uppercase tracking-[0.18em] text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300">
                  {t.propertyCard.refLabel}: {listing.refId}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-200">
                  <Eye className="h-4 w-4" />
                  {listing.viewCount ?? 0}
                </span>
              </div>

            </div>

            <div
              className={`grid w-full grid-cols-2 gap-4 rounded-[1.2rem] border border-slate-200 bg-slate-950/20 p-2 shadow-[0_14px_34px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-950/15 ${
                hasHeatingType ? "md:grid-cols-5" : "md:grid-cols-4"
              }`}
            >
              <div className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/5 bg-white/[0.03] px-3 py-2 text-center">
                  <Ruler className="h-4 w-4 shrink-0 text-amber-300" />
                  <div className="min-w-0 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">{t.propertyDetail.areaLabel}</p>
                    <p className="truncate text-sm font-black text-white">
                      {listing.areaSqm} {t.common.squareMetersUnit}
                    </p>
                  </div>
              </div>

              <div className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/5 bg-white/[0.03] px-3 py-2 text-center">
                  <MapPin className="h-4 w-4 shrink-0 text-emerald-300" />
                  <div className="min-w-0 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">{t.propertyDetail.locationLabel}</p>
                    <p className="truncate text-sm font-black text-white">{listing.location}</p>
                  </div>
              </div>

                <div className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/5 bg-white/[0.03] px-3 py-2 text-center">
                  <Tag className="h-4 w-4 shrink-0 text-brand-300" />
                  <div className="min-w-0 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">{t.filters.statusLabel}</p>
                    <p className="truncate text-sm font-black text-white">{listingStatusLabel}</p>
                  </div>
              </div>

              <div className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/5 bg-white/[0.03] px-3 py-2 text-center">
                  <Camera className="h-4 w-4 shrink-0 text-sky-300" />
                  <div className="min-w-0 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">{t.propertyDetail.photosLabel}</p>
                    <p className="truncate text-sm font-black text-white">{listing.images.length}</p>
                  </div>
              </div>

              {hasHeatingType ? (
                <div className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/5 bg-white/[0.03] px-3 py-2 text-center">
                  <Thermometer className="h-4 w-4 shrink-0 text-rose-300" />
                  <div className="min-w-0 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">{t.propertyDetail.heatingLabel}</p>
                    <p className="truncate text-sm font-black text-white">{heatingType}</p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white p-3 shadow-[0_22px_70px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-[0_22px_70px_rgba(2,6,23,0.35)] sm:p-4 lg:p-5">
        <ImageGallery listingId={listing.id} listingRef={listing.refId} title={listing.title} images={listing.images} />
      </section>

      <ViewCounter id={listing.id} />
      <CommunicationActionBar listingTitle={listing.title} listingRef={listing.refId} />

      <section className="rounded-[2.5rem] bg-slate-950 px-6 py-8 text-white shadow-[0_22px_70px_rgba(15,23,42,0.2)] sm:px-8 dark:bg-slate-900 dark:shadow-[0_22px_70px_rgba(2,6,23,0.35)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-300 dark:text-slate-400">{t.propertyDetail.specifications}</p>
        <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listing.type === "house" ? (
            <>
              <SpecificationItem label={t.propertyDetail.roomsLabel} value={listing.roomCount} />
              <SpecificationItem label={t.propertyDetail.floorLabel} value={listing.floorNumber} />
              <SpecificationItem label={t.propertyDetail.heatingLabel} value={listing.heatingType} />
            </>
          ) : (
            <>
              <SpecificationItem label={t.propertyDetail.zoningLabel} value={listing.zoningStatus} />
              <SpecificationItem label={t.propertyDetail.islandLabel} value={listing.islandNumber} />
              <SpecificationItem label={t.propertyDetail.parcelLabel} value={listing.parcelNumber} />
            </>
          )}
        </dl>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-[0_22px_70px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900/80">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700 dark:text-amber-400">{t.propertyDetail.overview}</p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-slate-50 p-5 dark:bg-slate-950/60">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{t.propertyDetail.locationLabel}</p>
              <p className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-100">{listing.location}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-5 dark:bg-slate-950/60">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{t.propertyDetail.areaLabel}</p>
              <p className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-100">{listing.areaSqm}</p>
            </div>
          </div>
        </div>

        <aside className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-[0_22px_70px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900/80">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700 dark:text-amber-400">{t.propertyDetail.description}</h2>
          <p id="detail-description" data-automation="detail-description" className="mt-4 whitespace-pre-line text-base leading-8 text-slate-700 dark:text-slate-300">
            {listing.description}
          </p>
        </aside>
      </section>

      <PropertyMap title={listing.title} latitude={listing.latitude} longitude={listing.longitude} />
    </div>
  );
}


