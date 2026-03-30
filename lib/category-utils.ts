import type { Category, ListingType } from "@/lib/types";
import type { Locale } from "@/lib/i18n-data";

export type CategoryIconKey = "home" | "building" | "mountain";

function normalizeLookupValue(value: string): string {
  return value
    .replace(/[çÇ]/g, "c")
    .replace(/[ğĞ]/g, "g")
    .replace(/[ıİ]/g, "i")
    .replace(/[öÖ]/g, "o")
    .replace(/[şŞ]/g, "s")
    .replace(/[üÜ]/g, "u")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function getLocalizedCategoryName(category: Pick<Category, "name" | "slug">, locale: Locale): string {
  if (locale !== "en") {
    return category.name;
  }

  const haystack = normalizeLookupValue([category.name, category.slug ?? ""].join(" "));

  if (haystack.includes("daire") || haystack.includes("apartment") || haystack.includes("flat")) {
    return "Apartment";
  }

  if (haystack.includes("villa")) {
    return "Villa";
  }

  if (haystack.includes("arsa") || haystack.includes("land")) {
    return "Land";
  }

  if (haystack.includes("tarla") || haystack.includes("field") || haystack.includes("farm")) {
    return "Field";
  }

  if (haystack.includes("ofis") || haystack.includes("buro") || haystack.includes("bureau") || haystack.includes("office bureau") || haystack.includes("office and bureau")) {
    return "Office & Bureau";
  }

  if (haystack.includes("isyeri") || haystack.includes("is yeri") || haystack.includes("office") || haystack.includes("commercial") || haystack.includes("ticari")) {
    return "Commercial Property";
  }

  if (haystack.includes("dukkan") || haystack.includes("magaza") || haystack.includes("shop")) {
    return "Shop";
  }

  if (haystack.includes("konut") || haystack.includes("residential")) {
    return "Residential";
  }

  if (haystack.includes("mustakil") || haystack.includes("detached")) {
    return "Detached House";
  }

  if (haystack.includes("dublex") || haystack.includes("duplex")) {
    return "Duplex";
  }

  if (haystack.includes("triplex") || haystack.includes("tripleks")) {
    return "Triplex";
  }

  if (haystack.includes("rezidans") || haystack.includes("residence")) {
    return "Residence";
  }

  if (haystack.includes("bahce") || haystack.includes("garden")) {
    return "Garden";
  }

  return category.name;
}

export function getLocalizedHeatingType(value: string, locale: Locale): string {
  const normalized = normalizeLookupValue(value);

  if (!normalized) {
    return value;
  }

  if (locale === "en") {
    if (normalized.includes("dogalgaz") || normalized.includes("combi")) {
      return "Natural Gas (Combi)";
    }

    if (normalized.includes("merkezi sistem") || normalized === "central system") {
      return "Central System";
    }

    if (normalized.includes("yerden isitma") || normalized.includes("underfloor")) {
      return "Underfloor Heating";
    }

    if (normalized === "klima" || normalized.includes("air conditioning")) {
      return "Air Conditioning";
    }

    if (normalized.includes("soba") || normalized.includes("kati yakit") || normalized.includes("solid fuel")) {
      return "Stove / Solid Fuel";
    }

    if (normalized.includes("isi pompas") || normalized.includes("heat pump")) {
      return "Heat Pump";
    }

    if (normalized === "yok" || normalized === "none") {
      return "None";
    }
  }

  if (normalized.includes("dogalgaz") || normalized.includes("natural gas")) {
    return "Doğalgaz (Kombi)";
  }

  if (normalized.includes("merkezi sistem") || normalized.includes("central system")) {
    return "Merkezi Sistem";
  }

  if (normalized.includes("yerden isitma") || normalized.includes("underfloor")) {
    return "Yerden Isıtma";
  }

  if (normalized === "klima" || normalized.includes("air conditioning")) {
    return "Klima";
  }

  if (normalized.includes("soba") || normalized.includes("kati yakit") || normalized.includes("solid fuel")) {
    return "Soba / Katı Yakıt";
  }

  if (normalized.includes("isi pompas") || normalized.includes("heat pump")) {
    return "Isı Pompası";
  }

  if (normalized === "yok" || normalized === "none") {
    return "Yok";
  }

  return value;
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
