import type { Category } from "@/lib/types";
import { findCategoryById } from "@/lib/category-utils";

export type ListingSearchFilters = {
  query: string;
  currency: "TRY" | "USD" | "EUR";
  status: "" | "satilik" | "kiralik";
  parentCategoryId: string;
  categoryId: string;
  sortBy: "newest" | "oldest" | "price-asc" | "price-desc";
  minPrice: string;
  maxPrice: string;
  rooms: string;
  heatingType: string;
  zoningStatus: string;
};

type SearchParamsLike = {
  get(name: string): string | null;
};

export const DEFAULT_LISTING_SEARCH_FILTERS: ListingSearchFilters = {
  query: "",
  currency: "TRY",
  status: "",
  parentCategoryId: "",
  categoryId: "",
  sortBy: "newest",
  minPrice: "",
  maxPrice: "",
  rooms: "",
  heatingType: "",
  zoningStatus: ""
};

function readTextParam(params: SearchParamsLike, name: string): string {
  return params.get(name)?.trim() ?? "";
}

function normalizeCurrency(value: string): ListingSearchFilters["currency"] {
  if (value === "USD" || value === "EUR") {
    return value;
  }

  return "TRY";
}

function normalizeStatus(value: string): ListingSearchFilters["status"] {
  if (value === "satilik" || value === "kiralik") {
    return value;
  }

  return "";
}

function normalizeSortBy(value: string): ListingSearchFilters["sortBy"] {
  if (value === "oldest" || value === "price-asc" || value === "price-desc" || value === "newest") {
    return value;
  }

  return "newest";
}

function sanitizePriceText(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10);
}

function normalizeCategorySelection(
  categoryId: string,
  parentCategoryId: string,
  categories?: Category[]
): Pick<ListingSearchFilters, "categoryId" | "parentCategoryId"> {
  if (!categories?.length) {
    return {
      parentCategoryId,
      categoryId
    };
  }

  const selectedCategory = categoryId ? findCategoryById(categories, categoryId) : null;

  if (selectedCategory) {
    if (selectedCategory.parentId) {
      return {
        parentCategoryId: selectedCategory.parentId,
        categoryId: selectedCategory.id
      };
    }

    return {
      parentCategoryId: selectedCategory.id,
      categoryId: ""
    };
  }

  const selectedParent = parentCategoryId ? findCategoryById(categories, parentCategoryId) : null;

  return {
    parentCategoryId: selectedParent?.parentId ? "" : parentCategoryId,
    categoryId: ""
  };
}

export function readListingSearchFilters(params: SearchParamsLike, categories?: Category[]): ListingSearchFilters {
  const categoryId = readTextParam(params, "categoryId");
  const parentCategoryId = readTextParam(params, "parentCategoryId");
  const categorySelection = normalizeCategorySelection(categoryId, parentCategoryId, categories);

  return {
    query: readTextParam(params, "q"),
    currency: normalizeCurrency(readTextParam(params, "currency")),
    status: normalizeStatus(readTextParam(params, "status")),
    parentCategoryId: categorySelection.parentCategoryId,
    categoryId: categorySelection.categoryId,
    sortBy: normalizeSortBy(readTextParam(params, "sortBy")),
    minPrice: sanitizePriceText(readTextParam(params, "minPrice")),
    maxPrice: sanitizePriceText(readTextParam(params, "maxPrice")),
    rooms: readTextParam(params, "rooms"),
    heatingType: readTextParam(params, "heatingType"),
    zoningStatus: readTextParam(params, "zoningStatus")
  };
}

export function buildListingSearchParams(filters: ListingSearchFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.query.trim()) {
    params.set("q", filters.query.trim());
  }

  params.set("currency", filters.currency);

  if (filters.status) {
    params.set("status", filters.status);
  }

  if (filters.parentCategoryId) {
    params.set("parentCategoryId", filters.parentCategoryId);
  }

  if (filters.categoryId) {
    params.set("categoryId", filters.categoryId);
  }

  if (filters.sortBy) {
    params.set("sortBy", filters.sortBy);
  }

  if (filters.minPrice.trim()) {
    params.set("minPrice", filters.minPrice.trim());
  }

  if (filters.maxPrice.trim()) {
    params.set("maxPrice", filters.maxPrice.trim());
  }

  if (filters.rooms.trim()) {
    params.set("rooms", filters.rooms.trim());
  }

  if (filters.heatingType.trim()) {
    params.set("heatingType", filters.heatingType.trim());
  }

  if (filters.zoningStatus.trim()) {
    params.set("zoningStatus", filters.zoningStatus.trim());
  }

  return params;
}

export function buildListingSearchUrl(pathname: string, filters: ListingSearchFilters): string {
  const queryString = buildListingSearchParams(filters).toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}
