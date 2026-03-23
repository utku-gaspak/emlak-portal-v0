import type { Category, ListingType } from "@/lib/types";

export type CategoryIconKey = "home" | "building" | "mountain";

function normalizeLookupValue(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function getCategoryIconKey(category?: Pick<Category, "name" | "slug"> | null): CategoryIconKey {
  const haystack = normalizeLookupValue([category?.name ?? "", category?.slug ?? ""].join(" "));

  if (haystack.includes("arsa") || haystack.includes("tarla") || haystack.includes("land") || haystack.includes("plot")) {
    return "mountain";
  }

  if (haystack.includes("is yeri") || haystack.includes("isyeri") || haystack.includes("office") || haystack.includes("ticari")) {
    return "building";
  }

  return "home";
}

export function determineListingTypeFromCategory(
  category?: Pick<Category, "name" | "slug"> | null,
  parentCategory?: Pick<Category, "name" | "slug"> | null
): ListingType {
  const haystack = normalizeLookupValue([category?.name ?? "", category?.slug ?? "", parentCategory?.name ?? "", parentCategory?.slug ?? ""].join(" "));

  if (haystack.includes("arsa") || haystack.includes("tarla") || haystack.includes("land") || haystack.includes("plot")) {
    return "land";
  }

  return "house";
}

export function shouldShowHeatingType(
  category?: Pick<Category, "name" | "slug"> | null,
  parentCategory?: Pick<Category, "name" | "slug"> | null
): boolean {
  const haystack = normalizeLookupValue([category?.name ?? "", category?.slug ?? "", parentCategory?.name ?? "", parentCategory?.slug ?? ""].join(" "));

  if (
    haystack.includes("arsa") ||
    haystack.includes("tarla") ||
    haystack.includes("land") ||
    haystack.includes("plot") ||
    haystack.includes("ticari") ||
    haystack.includes("is yeri") ||
    haystack.includes("isyeri") ||
    haystack.includes("office") ||
    haystack.includes("commercial") ||
    haystack.includes("shop") ||
    haystack.includes("magaza") ||
    haystack.includes("depo") ||
    haystack.includes("warehouse")
  ) {
    return false;
  }

  if (
    haystack.includes("konut") ||
    haystack.includes("daire") ||
    haystack.includes("villa") ||
    haystack.includes("mustakil") ||
    haystack.includes("apart") ||
    haystack.includes("ev") ||
    haystack.includes("house") ||
    haystack.includes("home") ||
    haystack.includes("residence")
  ) {
    return true;
  }

  return determineListingTypeFromCategory(category, parentCategory) === "house";
}

export function findCategoryById(categories: Category[], categoryId: string): Category | null {
  return categories.find((category) => category.id === categoryId) ?? null;
}

export function getParentCategoryById(categories: Category[], categoryId: string): Category | null {
  const category = findCategoryById(categories, categoryId);

  if (!category?.parentId) {
    return null;
  }

  return findCategoryById(categories, category.parentId);
}

export function getRootCategories(categories: Category[]): Category[] {
  return categories.filter((category) => !category.parentId);
}

export function getChildCategories(categories: Category[], parentId: string): Category[] {
  return categories.filter((category) => category.parentId === parentId);
}

export function getDescendantCategoryIds(categories: Category[], parentId: string): string[] {
  const queue = [parentId];
  const collected = new Set<string>();

  while (queue.length > 0) {
    const currentId = queue.shift();

    if (!currentId) {
      continue;
    }

    const children = categories.filter((category) => category.parentId === currentId);

    for (const child of children) {
      if (!collected.has(child.id)) {
        collected.add(child.id);
        queue.push(child.id);
      }
    }
  }

  return Array.from(collected);
}

export function getPreferredParentCategoryId(categories: Category[], desiredType: ListingType): string {
  const roots = getRootCategories(categories);

  if (roots.length === 0) {
    return "";
  }

  const matchingRoot =
    desiredType === "land"
      ? roots.find((category) => getCategoryIconKey(category) === "mountain")
      : roots.find((category) => getCategoryIconKey(category) === "home") ?? roots.find((category) => getCategoryIconKey(category) === "building");

  return matchingRoot?.id ?? roots[0]?.id ?? "";
}
