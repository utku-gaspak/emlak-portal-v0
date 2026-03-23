import Image from "next/image";
import { notFound } from "next/navigation";
import { CommunicationActionBar } from "@/components/CommunicationActionBar";
import { PropertyGallery } from "@/components/PropertyGallery";
import { formatListingPrice } from "@/lib/currency";
import { getListingById } from "@/lib/listings-store";
import { getDictionary } from "@/lib/get-dictionary";
import { getListingImageSrc } from "@/lib/photo-path";

type PropertyDetailPageProps = {
  params: {
    id: string;
  };
};

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
  const listing = await getListingById(params.id);

  if (!listing) {
    notFound();
  }

  const featuredImage = listing.images[0] ? getListingImageSrc(listing.id, listing.images[0]) : "/property-placeholder.svg";
  const featuredAlt = listing.images[0] ? `${listing.title} ${t.propertyDetail.featuredPhotoAlt}` : t.propertyDetail.placeholderAlt;

  return (
    <div data-automation="property-detail-container" className="mx-auto max-w-5xl space-y-8">
      <section className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-[0_22px_70px_rgba(2,6,23,0.35)]">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
          <div className="space-y-6">
            <div className="inline-flex rounded-full bg-brand-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-brand-700 dark:bg-amber-500/10 dark:text-amber-400">
              {listing.type === "house" ? t.propertyDetail.houseTypeBadge : t.propertyDetail.landTypeBadge}
            </div>

            <div className="space-y-3">
              <h1 id="detail-title" data-automation="detail-title" className="text-4xl font-black tracking-tight text-slate-950 dark:text-slate-100 sm:text-5xl">
                {listing.title}
              </h1>
              <p id="detail-price" data-automation="detail-price" className="text-3xl font-black text-brand-700 dark:text-amber-400">
                {formatListingPrice(listing.price, listing.currency)}
              </p>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                {t.propertyCard.refLabel}: {listing.refId}
              </p>
              <p className="max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">{listing.location}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-5 dark:bg-slate-950/60">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{t.propertyDetail.areaLabel}</p>
                <p className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-100">
                  {listing.areaSqm} {t.common.squareMetersUnit}
                </p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-5 dark:bg-slate-950/60">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{t.propertyDetail.photosLabel}</p>
                <p className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-100">{listing.images.length}</p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] bg-slate-100 shadow-[0_20px_60px_rgba(15,23,42,0.12)] dark:bg-slate-800">
            <div className="relative aspect-[4/3] w-full sm:aspect-[16/10] lg:aspect-[4/3]">
              <Image src={featuredImage} alt={featuredAlt} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 480px" priority />
            </div>
          </div>
        </div>
      </section>

      <CommunicationActionBar listingTitle={listing.title} />

      <section className="space-y-5 rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-[0_22px_70px_rgba(15,23,42,0.06)] sm:p-8 dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700 dark:text-amber-400">{t.propertyDetail.galleryEyebrow}</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-slate-100">{t.propertyDetail.galleryTitle}</h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t.propertyDetail.galleryDescription}</p>
        </div>

        <PropertyGallery listingId={listing.id} title={listing.title} images={listing.images} />
      </section>

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
    </div>
  );
}
