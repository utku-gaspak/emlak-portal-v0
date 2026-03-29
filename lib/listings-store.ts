import "server-only";

import { getDescendantCategoryIdsByParentId } from "@/lib/categories";
import { normalizeCurrency } from "@/lib/currency";
import { getSupabaseServerClient, LISTINGS_TABLE } from "@/lib/supabase";
import { HouseListing, LandListing, Listing, ListingStatus, ListingType } from "@/lib/types";

export type ListingFilters = {
  query?: string;
  listingNo?: string;
  currency?: "TRY" | Listing["currency"];
  status?: ListingStatus;
  parentCategoryId?: string;
  categoryId?: string;
  sortBy?: "newest" | "oldest" | "price-asc" | "price-desc";
  minPrice?: number;
  maxPrice?: number;
  rooms?: string;
  heatingType?: string;
  zoningStatus?: string;
};

type SearchParamsLike = Record<string, string | string[] | undefined>;
type ListingInsert = {
  listingNo: string;
  type: ListingType;
  status: Listing["status"];
  categoryId: string;
  isFeatured: boolean;
  currency: Listing["currency"];
  title: string;
  price: number;
  location: string;
  areaSqm: number;
  latitude?: number | null;
  longitude?: number | null;
  description: string;
  images: string[];
  createdAt: string;
  viewCount?: number;
  roomCount?: string;
  floorNumber?: string;
  heatingType?: string;
  zoningStatus?: string;
  islandNumber?: string;
  parcelNumber?: string;
};

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

function normalizeValue(value: string): string {
  return value.trim().toLowerCase();
}

function getListingSortTimestamp(listing: Listing): number {
  const createdAtTime = Date.parse(listing.createdAt);

  if (Number.isFinite(createdAtTime)) {
    return createdAtTime;
  }

  return 0;
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

function getRecordNullableNumber(record: Record<string, unknown>, keys: string[]): number | null {
  const value = getRecordNumber(record, keys, Number.NaN);
  return Number.isFinite(value) ? value : null;
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
    listingNo: getRecordText(record, ["listing_no", "listingNo"], ""),
    isFeatured: getRecordBoolean(record, ["is_featured", "isFeatured"], false),
    status: getRecordText(record, ["status", "listing_status"], "satilik") as Listing["status"],
    categoryId: getRecordText(record, ["category_id", "categoryId"], ""),
    currency: normalizeCurrency(getRecordText(record, ["currency"], "TL")),
    title: getRecordText(record, ["title"]),
    price: getRecordNumber(record, ["price"]),
    location: getRecordText(record, ["location"]),
    areaSqm: getRecordNumber(record, ["area_sqm", "areaSqm"]),
    description: getRecordText(record, ["description"]),
    images,
    createdAt: getRecordText(record, ["created_at", "createdAt"], new Date().toISOString()),
    latitude: getRecordNullableNumber(record, ["latitude"]),
    longitude: getRecordNullableNumber(record, ["longitude"]),
    viewCount: getRecordNumber(record, ["view_count", "viewCount"], 0)
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

function toDatabaseRow(listing: ListingInsert): Record<string, unknown> {
  const baseRow = {
    is_featured: Boolean(listing.isFeatured),
    status: listing.status,
    category_id: listing.categoryId || null,
    currency: normalizeCurrency(listing.currency),
    title: listing.title,
    price: Number(listing.price),
    location: listing.location,
    area_sqm: Number(listing.areaSqm),
    description: listing.description,
    images: listing.images,
    created_at: listing.createdAt,
    latitude: typeof listing.latitude === "number" ? listing.latitude : null,
    longitude: typeof listing.longitude === "number" ? listing.longitude : null,
    view_count: typeof listing.viewCount === "number" ? listing.viewCount : 0
  };

  if (listing.type === "land") {
    return {
      ...baseRow,
      listing_no: listing.listingNo || null,
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
    listing_no: listing.listingNo || null,
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
  const currencyValue = toSearchParamValue(searchParams.currency);
  const currency =
    currencyValue === "TRY" || currencyValue === "TL" || currencyValue === "USD" || currencyValue === "EUR"
      ? currencyValue === "TL"
        ? "TRY"
        : currencyValue
      : "TRY";
  const statusValue = toSearchParamValue(searchParams.status);
  const status = statusValue === "satilik" || statusValue === "kiralik" ? statusValue : undefined;
  const parentCategoryId = toSearchParamValue(searchParams.parentCategoryId).trim();
  const categoryId = toSearchParamValue(searchParams.categoryId).trim();
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
    currency,
    ...(status ? { status } : {}),
    ...(parentCategoryId ? { parentCategoryId } : {}),
    ...(categoryId ? { categoryId } : {}),
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

  return ((data ?? []) as unknown[])
    .map(normalizeListingRow)
    .filter((listing): listing is Listing => listing !== null);
}

export async function getListings(filters: ListingFilters = {}): Promise<Listing[]> {
  try {
    const listings = await fetchAllListingsFromDatabase();
    const query = filters.query?.trim().toLowerCase() ?? "";
    const hasExplicitSort = typeof filters.sortBy !== "undefined";
    const sortBy = filters.sortBy ?? "newest";
    const categoryFilterIds =
      filters.categoryId?.trim() || filters.parentCategoryId?.trim()
        ? filters.categoryId?.trim()
          ? [filters.categoryId.trim()]
          : filters.parentCategoryId?.trim()
          ? await getDescendantCategoryIdsByParentId(filters.parentCategoryId.trim())
          : []
        : [];
    const currencyFilter =
      typeof filters.currency === "string" && filters.currency.trim()
        ? normalizeCurrency(filters.currency === "TRY" ? "TL" : filters.currency)
        : undefined;

    const filteredListings = listings.filter((listing) => {
      if (typeof filters.listingNo === "string" && normalizeValue(listing.listingNo) !== normalizeValue(filters.listingNo)) {
        return false;
      }

      if (query && !buildSearchableText(listing).includes(query)) {
        if (normalizeValue(listing.listingNo) !== normalizeValue(query)) {
          return false;
        }
      }

      if (filters.status && listing.status !== filters.status) {
        return false;
      }

      if (currencyFilter && listing.currency !== currencyFilter) {
        return false;
      }

      if (categoryFilterIds.length > 0 && !categoryFilterIds.includes(listing.categoryId)) {
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
      if (query) {
        const normalizedQuery = normalizeValue(query);
        const aExact = normalizeValue(a.listingNo) === normalizedQuery ? 0 : 1;
        const bExact = normalizeValue(b.listingNo) === normalizedQuery ? 0 : 1;

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

export async function getListingById(id: string): Promise<Listing | null> {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from(LISTINGS_TABLE)
      .select(
        "id, listing_no, is_featured, status, category_id, currency, title, price, location, area_sqm, description, images, created_at, latitude, longitude, view_count, type, room_count, floor_number, heating_type, zoning_status, island_number, parcel_number"
      )
      .eq("id", String(id))
      .maybeSingle();

    if (error) {
      throw error;
    }

    return normalizeListingRow(data);
  } catch {
    return null;
  }
}

export async function addListing(listing: ListingInsert): Promise<Listing> {
  const supabase = getSupabaseServerClient();
  const row = toDatabaseRow({
    ...listing,
    isFeatured: Boolean(listing.isFeatured),
    currency: normalizeCurrency(listing.currency),
    images: listing.images
  });

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
      listingNo: updatedListing.listingNo,
      createdAt: existingListing.createdAt,
      isFeatured: Boolean(updatedListing.isFeatured),
      currency: normalizeCurrency(updatedListing.currency),
      images: updatedListing.images
    },
  );

  const { data, error } = await supabase.from(LISTINGS_TABLE).update(row).eq("id", existingListing.id).select("*").single();

  if (error) {
    throw error;
  }

  return normalizeListingRow(data);
}

export async function incrementListingViewCount(id: string): Promise<Listing | null> {
  const existingListing = await getListingById(id);

  if (!existingListing) {
    return null;
  }

  const supabase = getSupabaseServerClient();
  const nextViewCount = (existingListing.viewCount ?? 0) + 1;

  const { data, error } = await supabase
    .from(LISTINGS_TABLE)
    .update({ view_count: nextViewCount })
    .eq("id", existingListing.id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return normalizeListingRow(data);
}




