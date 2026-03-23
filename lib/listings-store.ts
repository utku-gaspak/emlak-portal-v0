import "server-only";

import { normalizeCurrency } from "@/lib/currency";
import { getSupabaseServerClient, LISTINGS_TABLE } from "@/lib/supabase";
import { HouseListing, LandListing, Listing, ListingType } from "@/lib/types";

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
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
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
  return [listing.title, listing.location, listing.description].join(" ").toLowerCase();
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

function getRecordText(record: Record<string, unknown>, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return fallback;
}

function getRecordNumber(record: Record<string, unknown>, keys: string[], fallback = 0): number {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return fallback;
}

function getRecordBoolean(record: Record<string, unknown>, keys: string[], fallback = false): boolean {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (normalized === "true" || normalized === "on" || normalized === "1") {
        return true;
      }

      if (normalized === "false" || normalized === "off" || normalized === "0") {
        return false;
      }
    }
  }

  return fallback;
}

function getRecordImages(record: Record<string, unknown>): string[] {
  const rawImages = Array.isArray(record.images)
    ? record.images
    : Array.isArray(record.photos)
      ? record.photos
      : [];

  return rawImages
    .map((image) => (typeof image === "string" ? image.trim() : ""))
    .filter((image) => image.length > 0);
}

function normalizeListingRow(raw: unknown): Listing | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const type: ListingType = record.type === "land" ? "land" : "house";
  const images = getRecordImages(record);

  const commonFields = {
    id: getRecordText(record, ["id"], crypto.randomUUID()),
    refId: getRecordNumber(record, ["ref_id", "refId"], 0),
    isFeatured: getRecordBoolean(record, ["is_featured", "isFeatured"], false),
    currency: normalizeCurrency(getRecordText(record, ["currency"], "TL")),
    title: getRecordText(record, ["title"]),
    price: getRecordNumber(record, ["price"]),
    location: getRecordText(record, ["location"]),
    areaSqm: getRecordNumber(record, ["area_sqm", "areaSqm"]),
    description: getRecordText(record, ["description"]),
    images,
    createdAt: getRecordText(record, ["created_at", "createdAt"], new Date().toISOString())
  };

  if (type === "land") {
    const listing: LandListing = {
      ...commonFields,
      type,
      zoningStatus: getRecordText(record, ["zoning_status", "zoningStatus"]),
      islandNumber: getRecordText(record, ["island_number", "islandNumber"]),
      parcelNumber: getRecordText(record, ["parcel_number", "parcelNumber"])
    };

    return listing;
  }

  const listing: HouseListing = {
    ...commonFields,
    type,
    roomCount: getRecordText(record, ["room_count", "roomCount"]),
    floorNumber: getRecordText(record, ["floor_number", "floorNumber"]),
    heatingType: getRecordText(record, ["heating_type", "heatingType"])
  };

  return listing;
}

function toDatabaseRow(listing: Listing, refId: number = listing.refId): Record<string, unknown> {
  const baseRow = {
    id: listing.id,
    ref_id: refId,
    is_featured: Boolean(listing.isFeatured),
    currency: normalizeCurrency(listing.currency),
    title: listing.title,
    price: Number(listing.price),
    location: listing.location,
    area_sqm: Number(listing.areaSqm),
    description: listing.description,
    images: listing.images,
    created_at: listing.createdAt
  };

  if (listing.type === "land") {
    return {
      ...baseRow,
      type: "land",
      zoning_status: listing.zoningStatus,
      island_number: listing.islandNumber,
      parcel_number: listing.parcelNumber,
      room_count: null,
      floor_number: null,
      heating_type: null
    };
  }

  return {
    ...baseRow,
    type: "house",
    room_count: listing.roomCount,
    floor_number: listing.floorNumber,
    heating_type: listing.heatingType,
    zoning_status: null,
    island_number: null,
    parcel_number: null
  };
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

async function fetchAllListingsFromDatabase(): Promise<Listing[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from(LISTINGS_TABLE).select("*");

  if (error) {
    throw error;
  }

  return (data ?? [])
    .map(normalizeListingRow)
    .filter((listing): listing is Listing => listing !== null);
}

export async function getListings(filters: ListingFilters = {}): Promise<Listing[]> {
  try {
    const listings = await fetchAllListingsFromDatabase();
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
    const listings = await fetchAllListingsFromDatabase();
    const maxRefId = listings.reduce((max, listing) => Math.max(max, listing.refId), minimumRefId);
    return maxRefId + 1;
  } catch {
    return minimumRefId + 1;
  }
}

export async function getListingById(id: string): Promise<Listing | null> {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase.from(LISTINGS_TABLE).select("*").eq("id", String(id)).maybeSingle();

    if (error) {
      throw error;
    }

    return normalizeListingRow(data);
  } catch {
    return null;
  }
}

export async function addListing(listing: Listing): Promise<Listing> {
  const supabase = getSupabaseServerClient();
  const refId = listing.refId > 0 ? listing.refId : await getNextListingRefId();
  const row = toDatabaseRow(
    {
      ...listing,
      refId,
      isFeatured: Boolean(listing.isFeatured),
      currency: normalizeCurrency(listing.currency),
      images: listing.images
    },
    refId
  );

  const { data, error } = await supabase.from(LISTINGS_TABLE).insert(row).select("*").single();

  if (error) {
    throw error;
  }

  const normalized = normalizeListingRow(data);

  if (!normalized) {
    throw new Error("Failed to normalize inserted listing.");
  }

  return normalized;
}

export async function removeListingById(id: string): Promise<Listing | null> {
  const existingListing = await getListingById(id);

  if (!existingListing) {
    return null;
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from(LISTINGS_TABLE).delete().eq("id", String(id));

  if (error) {
    throw error;
  }

  return existingListing;
}

export async function updateListingById(id: string, updatedListing: Listing): Promise<Listing | null> {
  const existingListing = await getListingById(id);

  if (!existingListing) {
    return null;
  }

  const supabase = getSupabaseServerClient();
  const row = toDatabaseRow(
    {
      ...updatedListing,
      id: existingListing.id,
      refId: existingListing.refId,
      createdAt: existingListing.createdAt,
      isFeatured: Boolean(updatedListing.isFeatured),
      currency: normalizeCurrency(updatedListing.currency),
      images: updatedListing.images
    },
    existingListing.refId
  );

  const { data, error } = await supabase.from(LISTINGS_TABLE).update(row).eq("id", existingListing.id).select("*").single();

  if (error) {
    throw error;
  }

  return normalizeListingRow(data);
}
