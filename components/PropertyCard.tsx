import Image from "next/image";
import Link from "next/link";
import { Bed, Maximize, Map } from "lucide-react";
import { DeleteListingButton } from "@/components/DeleteListingButton";
import { getListingImageSrc } from "@/lib/photo-path";
import { Listing } from "@/lib/types";

type PropertyCardProps = {
  listing: Listing;
  canDelete?: boolean;
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function renderPrimarySpecs(listing: Listing) {
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
            {listing.areaSqm} sqm
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
        <span>{listing.areaSqm} sqm</span>
      </span>
    </>
  );
}

export function PropertyCard({ listing, canDelete = false }: PropertyCardProps) {
  const coverImage = listing.images[0] ? getListingImageSrc(listing.id, listing.images[0]) : "/property-placeholder.svg";
  const isHouse = listing.type === "house";

  return (
    <article
      id={`property-card-${listing.id}`}
      data-automation="property-card"
      className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
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
        className={`block ${canDelete ? "pr-28" : ""}`}
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
          <Image
            src={coverImage}
            alt={`${listing.title} cover image`}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(max-width: 1024px) 100vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent" />

          <div
            id={`type-badge-${listing.id}`}
            data-automation="type-badge"
            className={`absolute left-4 top-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-[0_10px_30px_rgba(15,23,42,0.2)] ${
              isHouse ? "bg-blue-600" : "bg-emerald-600"
            }`}
          >
            {isHouse ? "House" : "Land"}
          </div>
        </div>

        <div className="space-y-5 p-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight text-slate-950">{listing.title}</h2>
            <p className="text-3xl font-black text-brand-700">{formatCurrency(listing.price)}</p>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Ref No: {listing.refId}</p>
          </div>

          <p className="text-sm font-medium text-slate-500">{listing.location}</p>

          <div className="flex flex-wrap gap-2">
            {renderPrimarySpecs(listing)}
          </div>

          <p className="max-h-24 overflow-hidden text-sm leading-6 text-slate-600">{listing.description}</p>

          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>
              {listing.images.length} {listing.images.length === 1 ? "photo" : "photos"}
            </span>
            <span className="font-semibold text-brand-700">View details</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
