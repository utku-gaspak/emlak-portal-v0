import "server-only";

import { CATEGORIES_TABLE, getSupabaseServerClient, hasSupabaseConfig } from "@/lib/supabase";
import { Category, ListingType } from "@/lib/types";
import {
  determineListingTypeFromCategory,
  findCategoryById,
  getChildCategories,
  getDescendantCategoryIds,
  getParentCategoryById,
  getPreferredParentCategoryId,
  getRootCategories
} from "@/lib/category-utils";

function toText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function normalizeCategoryRow(raw: unknown): Category | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const id = toText(record.id).trim();
  const name = toText(record.name, toText(record.title, toText(record.label))).trim();

  if (!id || !name) {
    return null;
  }

  const parentIdValue = toText(record.parent_id, toText(record.parentId)).trim();
  const slug = toText(record.slug, toText(record.code, name)).trim();

  return {
    id,
    name,
    parentId: parentIdValue ? parentIdValue : null,
    slug
  };
}

async function fetchCategoriesFromDatabase(): Promise<Category[]> {
  if (!hasSupabaseConfig()) {
    return [];
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from(CATEGORIES_TABLE).select("*").order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as unknown[])
    .map(normalizeCategoryRow)
    .filter((category): category is Category => category !== null);
}

export async function getCategories(): Promise<Category[]> {
  try {
    return await fetchCategoriesFromDatabase();
  } catch {
    return [];
  }
}

export async function getParentCategories(): Promise<Category[]> {
  const categories = await getCategories();
  return getRootCategories(categories);
}

export async function getChildCategoriesByParentId(parentId: string): Promise<Category[]> {
  const categories = await getCategories();
  return getChildCategories(categories, parentId);
}

export async function getCategoryById(categoryId: string): Promise<Category | null> {
  const categories = await getCategories();
  return findCategoryById(categories, categoryId);
}

export async function getParentCategoryByCategoryId(categoryId: string): Promise<Category | null> {
  const categories = await getCategories();
  return getParentCategoryById(categories, categoryId);
}

export async function getDescendantCategoryIdsByParentId(parentId: string): Promise<string[]> {
  const categories = await getCategories();
  return getDescendantCategoryIds(categories, parentId);
}

export async function getPreferredParentCategoryIdByType(desiredType: ListingType): Promise<string> {
  const categories = await getCategories();
  return getPreferredParentCategoryId(categories, desiredType);
}

export async function resolveListingTypeFromCategoryId(categoryId: string): Promise<ListingType | null> {
  const categories = await getCategories();
  const category = findCategoryById(categories, categoryId);

  if (!category) {
    return null;
  }

  const parentCategory = category.parentId ? findCategoryById(categories, category.parentId) : null;
  return determineListingTypeFromCategory(category, parentCategory);
}
