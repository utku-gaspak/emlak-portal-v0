"use client";

import Image from "next/image";
import Link from "next/link";
import { Bed, Maximize, Map, Star } from "lucide-react";
import { DeleteListingButton } from "@/components/DeleteListingButton";
import { formatListingPrice } from "@/lib/currency";
import { Listing } from "@/lib/types";
import { useTranslation } from "@/context/TranslationContext";

type PropertyCardProps = {
  listing: Listing;
  canDelete?: boolean;
};

type Translation = ReturnType<typeof useTranslation>["t"];

function renderPrimarySpecs(listing: Listing, t: Translation) {

  if (listing.type === "house") {
    return (
      <>
        <span
          id={`spec-chip-roomCount-${listing.id}`}
          data-automation="spec-chip-roomCount"
          className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700"
        >
          <Bed className="h-4 w-4 text-slate-500" />
          <span>{listing.roomCount}</span>
        </span>
      <span
        id={`spec-chip-areaSqm-${listing.id}`}
        data-automation="spec-chip-areaSqm"
        className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700"
      >
        <Maximize className="h-4 w-4 text-slate-500" />
        <span>
          {listing.areaSqm} {t.common.squareMetersUnit}
        </span>
      </span>
      </>
    );
  }

  return (
    <>
      <span
        id={`spec-chip-zoningStatus-${listing.id}`}
        data-automation="spec-chip-zoningStatus"
        className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700"
      >
        <Map className="h-4 w-4 text-slate-500" />
        <span>{listing.zoningStatus}</span>
      </span>
      <span
        id={`spec-chip-areaSqm-${listing.id}`}
        data-automation="spec-chip-areaSqm"
        className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700"
      >
        <Maximize className="h-4 w-4 text-slate-500" />
        <span>
          {listing.areaSqm} {t.common.squareMetersUnit}
        </span>
      </span>
    </>
  );
}

export function PropertyCard({ listing, canDelete = false }: PropertyCardProps) {
  const { t } = useTranslation();
  const coverImage = listing.images[0] ?? "/property-placeholder.svg";
  const isHouse = listing.type === "house";

  return (
    <article
      id={`property-card-${listing.id}`}
      data-automation="property-card"
      className={`group relative overflow-hidden rounded-3xl border bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-2xl dark:bg-slate-900 dark:shadow-[0_18px_50px_rgba(2,6,23,0.35)] ${
        listing.isFeatured ? "border-amber-300/70 ring-1 ring-amber-200/70 dark:border-amber-500/60 dark:ring-amber-500/20" : "border-slate-200 dark:border-slate-800"
      }`}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500 via-emerald-400 to-cyan-400" />

      {canDelete ? (
        <div className="absolute right-4 top-4 z-20">
          <DeleteListingButton listingId={listing.id} />
        </div>
      ) : null}

      <Link
        href={`/property/${listing.id}`}
        id={`property-link-${listing.id}`}
        data-automation={`link-to-${listing.id}`}
        className="block"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800">
          <Image
            src={coverImage}
            alt={`${listing.title} cover image`}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(max-width: 1024px) 100vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent dark:from-slate-950/55" />

          <div
            id={`type-badge-${listing.id}`}
            data-automation={`type-badge-${listing.id}`}
            className={`absolute left-4 top-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-[0_10px_30px_rgba(15,23,42,0.2)] ${
              isHouse ? "bg-blue-600" : "bg-emerald-600"
            }`}
          >
            {isHouse ? t.propertyCard.houseTypeBadge : t.propertyCard.landTypeBadge}
          </div>

          {listing.isFeatured ? (
            <div
              id={`featured-badge-${listing.id}`}
              data-automation={`featured-badge-${listing.id}`}
              className={`absolute inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white shadow-[0_10px_30px_rgba(245,158,11,0.28)] ${
                canDelete ? "right-4 top-14" : "right-4 top-4"
              }`}
            >
              <Star className="h-3.5 w-3.5 fill-white" />
              {t.propertyCard.featuredBadge}
            </div>
          ) : null}
        </div>

        <div className="space-y-5 p-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-slate-100">{listing.title}</h2>
            <p className="text-3xl font-black text-brand-700 dark:text-amber-400">{formatListingPrice(listing.price, listing.currency)}</p>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              {t.propertyCard.listingNo}: {listing.listingNo}
            </p>
          </div>

          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{listing.location}</p>

          <div className="flex flex-wrap gap-2">
            {renderPrimarySpecs(listing, t)}
          </div>

          <p className="max-h-24 overflow-hidden text-sm leading-6 text-slate-600 dark:text-slate-300">{listing.description}</p>

          <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
            <span>
              {listing.images.length} {listing.images.length === 1 ? t.propertyCard.photosSingular : t.propertyCard.photosPlural}
            </span>
            <span className="font-semibold text-brand-700">{t.propertyCard.viewDetails}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}


