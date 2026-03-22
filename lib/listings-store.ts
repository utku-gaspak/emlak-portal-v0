import path from "node:path";
import { promises as fs } from "node:fs";
import { getPhotoFileName } from "@/lib/photo-path";
import { normalizeCurrency } from "@/lib/currency";
import { Listing, ListingType, LandListing, HouseListing } from "@/lib/types";

const dataFilePath = path.join(process.cwd(), "data", "listings.json");
const minimumRefId = 1000;

export type ListingFilters = {
  query?: string;
  refId?: number;
  category?: ListingType;
  sortBy?: "newest" | "oldest" | "price-asc" | "price-desc";
  minPrice?: number;
  maxPrice?: number;
  rooms?: string;
  heatingType?: string;
  zoningStatus?: string;
};

type SearchParamsLike = Record<string, string | string[] | undefined>;

function toText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function toNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "on" || normalized === "1";
  }

  return fallback;
}

function isPureNumber(value: string): boolean {
  return /^\d+$/.test(value.trim());
}

function normalizeValue(value: string): string {
  return value.trim().toLowerCase();
}

function getListingSortTimestamp(listing: Listing): number {
  const createdAtTime = Date.parse(listing.createdAt);
  if (Number.isFinite(createdAtTime)) {
    return createdAtTime;
  }

  return Number.isFinite(listing.refId) ? listing.refId : 0;
}

function toSearchParamValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return typeof value === "string" ? value : "";
}

function parseOptionalNumber(value: string): number | undefined {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildSearchableText(listing: Listing): string {
  return [listing.title, listing.location].join(" ").toLowerCase();
}

function normalizeRefIds(listings: Listing[]): { listings: Listing[]; changed: boolean } {
  const used = new Set<number>();
  const existingRefIds = listings
    .map((listing) => listing.refId)
    .filter((refId) => Number.isInteger(refId) && refId > 0);
  let nextRefId = Math.max(minimumRefId, ...existingRefIds, minimumRefId) + 1;
  let changed = false;

  const normalizedListings = listings.map((listing) => {
    const currentRefId = listing.refId;

    if (Number.isInteger(currentRefId) && currentRefId > 0 && !used.has(currentRefId)) {
      used.add(currentRefId);
      return listing;
    }

    while (used.has(nextRefId)) {
      nextRefId += 1;
    }

    const refId = nextRefId;
    used.add(refId);
    nextRefId += 1;
    changed = true;

    return {
      ...listing,
      refId
    };
  });

  return {
    listings: changed ? normalizedListings : listings,
    changed
  };
}

function matchesOptionalValue(recordValue: string | undefined, filterValue: string | undefined): boolean {
  if (!filterValue?.trim()) {
    return true;
  }

  if (!recordValue?.trim()) {
    return false;
  }

  return normalizeValue(recordValue) === normalizeValue(filterValue);
}

export function parseListingFilters(searchParams?: SearchParamsLike): ListingFilters {
  if (!searchParams) {
    return {};
  }

  const query = toSearchParamValue(searchParams.q).trim();
  const categoryValue = toSearchParamValue(searchParams.category);
  const category = categoryValue === "house" || categoryValue === "land" ? categoryValue : undefined;
  const sortByValue = toSearchParamValue(searchParams.sortBy);
  const sortBy =
    sortByValue === "oldest" ||
    sortByValue === "price-asc" ||
    sortByValue === "price-desc" ||
    sortByValue === "newest"
      ? sortByValue
      : undefined;
  const minPrice = parseOptionalNumber(toSearchParamValue(searchParams.minPrice));
  const maxPrice = parseOptionalNumber(toSearchParamValue(searchParams.maxPrice));
  const rooms = toSearchParamValue(searchParams.rooms).trim();
  const heatingType = toSearchParamValue(searchParams.heatingType).trim();
  const zoningStatus = toSearchParamValue(searchParams.zoningStatus).trim();

  return {
    ...(query ? { query } : {}),
    ...(category ? { category } : {}),
    ...(sortBy ? { sortBy } : {}),
    ...(minPrice !== undefined ? { minPrice } : {}),
    ...(maxPrice !== undefined ? { maxPrice } : {}),
    ...(rooms ? { rooms } : {}),
    ...(heatingType ? { heatingType } : {}),
    ...(zoningStatus ? { zoningStatus } : {})
  };
}

type NormalizedListingResult = {
  listing: Listing;
  changed: boolean;
};

function normalizeListing(raw: unknown): NormalizedListingResult | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const type: ListingType = record.type === "land" ? "land" : "house";
  const rawImages = Array.isArray(record.images)
    ? record.images.map((image) => String(image)).filter((image) => image.trim().length > 0)
    : Array.isArray(record.photos)
      ? record.photos.map((photo) => String(photo)).filter((photo) => photo.trim().length > 0)
      : [];
  const normalizedImages = rawImages.map((image) => getPhotoFileName(image));
  const imagesChanged = rawImages.some((image, index) => image !== normalizedImages[index]);
  const rawCurrency = toText(record.currency, "");
  const normalizedCurrency = normalizeCurrency(rawCurrency);
  const currencyChanged = rawCurrency !== normalizedCurrency;

  const commonFields = {
    id: toText(record.id, crypto.randomUUID()),
    refId: toNumber(record.refId, 0),
    isFeatured: toBoolean(record.isFeatured, false),
    currency: normalizedCurrency,
    title: toText(record.title),
    price: toNumber(record.price),
    location: toText(record.location),
    areaSqm: toNumber(record.areaSqm),
    description: toText(record.description),
    images: normalizedImages,
    photos: normalizedImages,
    createdAt: toText(record.createdAt, new Date().toISOString())
  };

  if (type === "land") {
    const listing: LandListing = {
      ...commonFields,
      type,
      zoningStatus: toText(record.zoningStatus),
      islandNumber: toText(record.islandNumber),
      parcelNumber: toText(record.parcelNumber)
    };

    return {
      listing,
      changed: imagesChanged || currencyChanged
    };
  }

  const listing: HouseListing = {
    ...commonFields,
    type,
    roomCount: toText(record.roomCount),
    floorNumber: toText(record.floorNumber),
    heatingType: toText(record.heatingType)
  };

  return {
    listing,
    changed: imagesChanged || currencyChanged
  };
}

async function readListingsFile(): Promise<Listing[]> {
  const fileContent = await fs.readFile(dataFilePath, "utf8");
  const normalizedContent = fileContent.replace(/^\uFEFF/, "");
  const parsed = JSON.parse(normalizedContent) as unknown;

  if (!Array.isArray(parsed)) {
    return [];
  }

  const normalizedResults = parsed.map(normalizeListing).filter((result): result is NormalizedListingResult => result !== null);
  const normalizedListings = normalizedResults.map((result) => result.listing);
  const photosChanged = normalizedResults.some((result) => result.changed);
  const { listings: withRefIds, changed: refChanged } = normalizeRefIds(normalizedListings);
  const changed = photosChanged || refChanged;

  if (changed) {
    await fs.writeFile(dataFilePath, JSON.stringify(withRefIds, null, 2), "utf8");
  }

  return withRefIds;
}

async function writeListingsFile(listings: Listing[]): Promise<void> {
  await fs.writeFile(dataFilePath, JSON.stringify(listings, null, 2), "utf8");
}

export async function getListings(filters: ListingFilters = {}): Promise<Listing[]> {
  try {
    const listings = await readListingsFile();
    const query = filters.query?.trim().toLowerCase() ?? "";
    const queryIsNumeric = isPureNumber(query);
    const queryAsNumber = queryIsNumeric ? Number(query) : null;
    const hasExplicitSort = typeof filters.sortBy !== "undefined";
    const sortBy = filters.sortBy ?? "newest";

    const filteredListings = listings.filter((listing) => {
      if (typeof filters.refId === "number" && listing.refId !== filters.refId) {
        return false;
      }

      if (query && !buildSearchableText(listing).includes(query)) {
        if (!(queryIsNumeric && listing.refId === queryAsNumber)) {
          return false;
        }
      }

      if (filters.category && listing.type !== filters.category) {
        return false;
      }

      if (typeof filters.minPrice === "number" && listing.price < filters.minPrice) {
        return false;
      }

      if (typeof filters.maxPrice === "number" && listing.price > filters.maxPrice) {
        return false;
      }

      if (listing.type === "house") {
        if (!matchesOptionalValue(listing.roomCount, filters.rooms)) {
          return false;
        }

        if (!matchesOptionalValue(listing.heatingType, filters.heatingType)) {
          return false;
        }
      }

      if (listing.type === "land") {
        if (!matchesOptionalValue(listing.zoningStatus, filters.zoningStatus)) {
          return false;
        }
      }

      return true;
    });

    return filteredListings.sort((a, b) => {
      if (queryIsNumeric && queryAsNumber !== null) {
        const aExact = a.refId === queryAsNumber ? 0 : 1;
        const bExact = b.refId === queryAsNumber ? 0 : 1;

        if (aExact !== bExact) {
          return aExact - bExact;
        }
      }

      if (!hasExplicitSort && a.isFeatured !== b.isFeatured) {
        return a.isFeatured ? -1 : 1;
      }

      if (sortBy === "price-asc") {
        return a.price - b.price;
      }

      if (sortBy === "price-desc") {
        return b.price - a.price;
      }

      if (sortBy === "oldest") {
        return getListingSortTimestamp(a) - getListingSortTimestamp(b);
      }

      return getListingSortTimestamp(b) - getListingSortTimestamp(a);
    });
  } catch {
    return [];
  }
}

export async function getNextListingRefId(): Promise<number> {
  try {
    const listings = await readListingsFile();
    const maxRefId = listings.reduce((max, listing) => Math.max(max, listing.refId), minimumRefId);
    return maxRefId + 1;
  } catch {
    return minimumRefId + 1;
  }
}

export async function getListingById(id: string): Promise<Listing | null> {
  try {
    const listings = await readListingsFile();
    return listings.find((listing) => listing.id === id) ?? null;
  } catch {
    return null;
  }
}

export async function addListing(listing: Listing): Promise<void> {
  const listings = await readListingsFile();
  const nextRefId = listing.refId > 0 ? listing.refId : Math.max(minimumRefId, ...listings.map((item) => item.refId)) + 1;
  const listingToStore = {
    ...listing,
    isFeatured: Boolean(listing.isFeatured),
    currency: normalizeCurrency(listing.currency),
    images: listing.images,
    photos: listing.images,
    refId: nextRefId
  };

  listings.unshift(listingToStore);
  await writeListingsFile(listings);
}

export async function removeListingById(id: string): Promise<Listing | null> {
  const listings = await getListings();
  const index = listings.findIndex((listing) => listing.id === id);

  if (index === -1) {
    return null;
  }

  const [removedListing] = listings.splice(index, 1);
  await writeListingsFile(listings);

  return removedListing;
}

export async function updateListingById(id: string, updatedListing: Listing): Promise<Listing | null> {
  const listings = await readListingsFile();
  const index = listings.findIndex((listing) => listing.id === id);

  if (index === -1) {
    return null;
  }

  const existingListing = listings[index];
  const listingToStore = {
    ...updatedListing,
    isFeatured: Boolean(updatedListing.isFeatured),
    currency: normalizeCurrency(updatedListing.currency),
    images: updatedListing.images,
    photos: updatedListing.images,
    id: existingListing.id,
    refId: existingListing.refId,
    createdAt: existingListing.createdAt
  } as Listing;

  listings[index] = listingToStore;
  await writeListingsFile(listings);

  return listingToStore;
}
