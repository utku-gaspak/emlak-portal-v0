"use client";

import { FormEvent, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronDown } from "lucide-react";
import { useTranslation } from "@/context/TranslationContext";
import { Category } from "@/lib/types";
import { CategoryDropdown } from "@/components/CategoryDropdown";
import { StatusDropdown } from "@/components/StatusDropdown";
import { getChildCategories, getParentCategoryById } from "@/lib/category-utils";

type SearchFiltersProps = {
  categories: Category[];
  showHeader?: boolean;
};

type FilterState = {
  query: string;
  currency: "TRY" | "USD" | "EUR";
  status: "" | "satilik" | "kiralik";
  parentCategoryId: string;
  categoryId: string;
  sortBy: "newest" | "oldest" | "price-asc" | "price-desc";
  minPrice: string;
  maxPrice: string;
};

function readFiltersFromParams(params: { get(name: string): string | null }): FilterState {
  const currencyValue = params.get("currency");
  const currency = currencyValue === "USD" || currencyValue === "EUR" ? currencyValue : "TRY";
  const statusValue = params.get("status");
  const status = statusValue === "satilik" || statusValue === "kiralik" ? statusValue : "";
  const sortByValue = params.get("sortBy");
  const sortBy =
    sortByValue === "oldest" || sortByValue === "price-asc" || sortByValue === "price-desc" || sortByValue === "newest"
      ? sortByValue
      : "newest";

  return {
    query: params.get("q") ?? "",
    currency,
    status,
    parentCategoryId: params.get("parentCategoryId") ?? "",
    categoryId: params.get("categoryId") ?? "",
    sortBy,
    minPrice: params.get("minPrice") ?? "",
    maxPrice: params.get("maxPrice") ?? ""
  };
}

function normalizeOptions(values: Category[]): Category[] {
  return values
    .filter((value, index, array) => array.findIndex((item) => item.id === value.id) === index)
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }));
}

export function SearchFilters({ categories, showHeader = true }: SearchFiltersProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const searchSignature = searchParams.toString();
  const rootCategories = useMemo(() => normalizeOptions(categories.filter((category) => !category.parentId)), [categories]);
  const currentFilters = useMemo(() => readFiltersFromParams(searchParams), [searchSignature]);
  const [filters, setFilters] = useState<FilterState>(currentFilters);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  const defaultFilters = useMemo<FilterState>(
    () => ({
      query: "",
      currency: "TRY",
      status: "",
      parentCategoryId: "",
      categoryId: "",
      sortBy: "newest",
      minPrice: "",
      maxPrice: ""
    }),
    []
  );

  const sortOptions = useMemo(
    () => [
      { value: "newest" as const, label: t.filters.sortNewestFirst },
      { value: "price-asc" as const, label: t.filters.sortPriceLowToHigh },
      { value: "price-desc" as const, label: t.filters.sortPriceHighToLow },
      { value: "oldest" as const, label: t.filters.sortOldestFirst }
    ],
    [t.filters.sortNewestFirst, t.filters.sortPriceLowToHigh, t.filters.sortPriceHighToLow, t.filters.sortOldestFirst]
  );

  const statusOptions = useMemo(
    () => [
      { value: "" as const, label: t.filters.statusAll },
      { value: "satilik" as const, label: t.filters.statusForSale },
      { value: "kiralik" as const, label: t.filters.statusForRent }
    ],
    [t.filters.statusAll, t.filters.statusForSale, t.filters.statusForRent]
  );

  const currencyOptions = useMemo(
    () => [
      { value: "TRY" as const, label: t.filters.currencyTL },
      { value: "USD" as const, label: t.filters.currencyUSD },
      { value: "EUR" as const, label: t.filters.currencyEUR }
    ],
    [t.filters.currencyTL, t.filters.currencyUSD, t.filters.currencyEUR]
  );

  const selectedParent = useMemo(
    () => rootCategories.find((category) => category.id === filters.parentCategoryId) ?? null,
    [filters.parentCategoryId, rootCategories]
  );
  const subCategories = useMemo(
    () => (filters.parentCategoryId ? normalizeOptions(getChildCategories(categories, filters.parentCategoryId)) : []),
    [categories, filters.parentCategoryId]
  );
  const selectedSubCategory = useMemo(
    () => categories.find((category) => category.id === filters.categoryId) ?? null,
    [categories, filters.categoryId]
  );

  useEffect(() => {
    if (!filters.categoryId) {
      return;
    }

    const parentFromSelection = getParentCategoryById(categories, filters.categoryId);

    if (parentFromSelection?.id && parentFromSelection.id !== filters.parentCategoryId) {
      setFilters((current) => ({
        ...current,
        parentCategoryId: parentFromSelection.id
      }));
    }
  }, [categories, filters.categoryId, filters.parentCategoryId]);

  useEffect(() => {
    setFilters(currentFilters);
  }, [currentFilters]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node;

      if (sortMenuRef.current && !sortMenuRef.current.contains(target)) {
        setIsSortMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsSortMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function buildUrl(nextFilters: FilterState): string {
    const params = new URLSearchParams();

    if (nextFilters.query.trim()) {
      params.set("q", nextFilters.query.trim());
    }

    params.set("currency", nextFilters.currency);

    if (nextFilters.status) {
      params.set("status", nextFilters.status);
    }

    if (nextFilters.parentCategoryId) {
      params.set("parentCategoryId", nextFilters.parentCategoryId);
    }

    if (nextFilters.categoryId) {
      params.set("categoryId", nextFilters.categoryId);
    }

    if (nextFilters.sortBy) {
      params.set("sortBy", nextFilters.sortBy);
    }

    if (nextFilters.minPrice.trim()) {
      params.set("minPrice", nextFilters.minPrice.trim());
    }

    if (nextFilters.maxPrice.trim()) {
      params.set("maxPrice", nextFilters.maxPrice.trim());
    }

    const queryString = params.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
  }

  function pushFilters(nextFilters: FilterState) {
    startTransition(() => {
      router.push(buildUrl(nextFilters), { scroll: false });
    });
  }

  function updateFilters(patch: Partial<FilterState>) {
    const nextFilters: FilterState = {
      ...filters,
      ...patch
    };

    if (patch.parentCategoryId !== undefined) {
      nextFilters.categoryId = "";
    }

    if (patch.categoryId !== undefined) {
      const nextSubCategory = categories.find((category) => category.id === patch.categoryId) ?? null;
      nextFilters.parentCategoryId = nextSubCategory?.parentId ?? nextFilters.parentCategoryId;
    }

    setFilters(nextFilters);
    pushFilters(nextFilters);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    pushFilters(filters);
  }

  const hasActiveFilters =
    filters.query.trim().length > 0 ||
    filters.currency !== "TRY" ||
    filters.status.length > 0 ||
    filters.parentCategoryId.length > 0 ||
    filters.categoryId.length > 0 ||
    filters.sortBy !== "newest" ||
    filters.minPrice.trim().length > 0 ||
    filters.maxPrice.trim().length > 0;

  function resetAllFilters() {
    setFilters(defaultFilters);
    setIsSortMenuOpen(false);
    pushFilters(defaultFilters);
  }

  return (
    <section
      id="search-filters-panel"
      data-automation="search-filters-panel"
      className="relative z-30 overflow-visible rounded-[2.5rem] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.09)] ring-1 ring-slate-200/70 sm:p-6 lg:p-7 dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-[0_24px_70px_rgba(2,6,23,0.35)] dark:ring-slate-800/70"
    >
      {showHeader ? (
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-end sm:justify-between dark:border-slate-800">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700 dark:text-amber-400">{t.filters.title}</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-slate-100">{t.home.searchTitle}</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-400">{t.home.searchDescription}</p>
          {hasActiveFilters ? (
            <button
              type="button"
              data-automation="reset-all-filters"
              onClick={resetAllFilters}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-950 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:text-slate-100"
            >
              {t.common.clear}
            </button>
          ) : null}
        </div>
      ) : null}

            <form
        id="property-search-filters-form"
        data-automation="property-search-filters-form"
        className="mt-5 space-y-4"
        onSubmit={handleSubmit}
      >
        <div className="grid gap-4 md:grid-cols-4">
          <div className="grid gap-4 md:col-span-4 md:grid-cols-4">
            <div className="space-y-2">
              <label htmlFor="search-filters-query" className="label-base">
                {t.filters.searchLabel}
              </label>
              <input
                id="search-filters-query"
                data-automation="search-input"
                name="q"
                type="search"
                value={filters.query}
                onChange={(event) => updateFilters({ query: event.target.value })}
                placeholder={t.filters.searchPlaceholder}
                className="input-base h-[52px] bg-white/5 dark:bg-slate-800/50"
              />
            </div>

            <StatusDropdown
              id="search-filters-status"
              label={t.filters.statusLabel}
              placeholder={t.filters.statusAll}
              value={filters.status}
              options={statusOptions}
              onChange={(nextValue) => updateFilters({ status: nextValue as FilterState["status"] })}
              dataAutomation="status-filter"
              clearLabel={t.common.clear}
              allowClear
              className="input-base h-[52px] bg-white/5 dark:bg-slate-800/50"
            />

            <div className="space-y-2">
              <CategoryDropdown
                id="search-filters-parent-category"
                label={t.filters.parentCategoryLabel}
                placeholder={t.filters.parentCategoryPlaceholder}
                value={selectedParent?.id ?? ""}
                options={rootCategories}
                onChange={(nextParentId) => updateFilters({ parentCategoryId: nextParentId })}
                dataAutomation="category-filter"
                clearLabel={t.common.clear}
                allowClear
                className="input-base h-[52px] bg-white/5 dark:bg-slate-800/50"
              />
            </div>

            <div className="space-y-2">
              <CategoryDropdown
                id="search-filters-subcategory"
                label={t.filters.subcategoryLabel}
                placeholder={t.filters.subcategoryPlaceholder}
                value={selectedSubCategory?.id ?? ""}
                options={subCategories}
                onChange={(nextCategoryId) => updateFilters({ categoryId: nextCategoryId })}
                dataAutomation="subcategory-filter"
                clearLabel={t.common.clear}
                allowClear
                disabled={!selectedParent}
                className="input-base h-[52px] bg-white/5 dark:bg-slate-800/50"
              />
            </div>

            <StatusDropdown
              id="search-filters-currency"
              label={t.filters.currencyLabel}
              placeholder={t.filters.currencyTL}
              value={filters.currency}
              options={currencyOptions}
              onChange={(nextValue) => updateFilters({ currency: nextValue as FilterState["currency"] })}
              dataAutomation="currency-filter"
              className="input-base h-[52px] bg-white/5 dark:bg-slate-800/50"
            />

            <div className="space-y-2">
              <label htmlFor="search-filters-min-price" className="label-base">
                {t.filters.minPriceLabel}
              </label>
              <input
                id="search-filters-min-price"
                data-automation="min-price-filter"
                name="minPrice"
                type="text"
                inputMode="numeric"
                maxLength={10}
                value={filters.minPrice}
                onChange={(event) => {
                  const nextValue = event.target.value.replace(/\D/g, "").slice(0, 10);
                  updateFilters({ minPrice: nextValue });
                }}
                className="input-base h-[52px] w-full bg-white/5 dark:bg-slate-800/50"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="search-filters-max-price" className="label-base">
                {t.filters.maxPriceLabel}
              </label>
              <input
                id="search-filters-max-price"
                data-automation="max-price-filter"
                name="maxPrice"
                type="text"
                inputMode="numeric"
                maxLength={10}
                value={filters.maxPrice}
                onChange={(event) => {
                  const nextValue = event.target.value.replace(/\D/g, "").slice(0, 10);
                  updateFilters({ maxPrice: nextValue });
                }}
                className="input-base h-[52px] w-full bg-white/5 dark:bg-slate-800/50"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="search-filters-sort-by-trigger" className="label-base">
                {t.filters.sortByLabel}
              </label>
              <div ref={sortMenuRef} className="relative">
                <button
                  id="search-filters-sort-by-trigger"
                  data-automation="sort-by-filter"
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={isSortMenuOpen}
                  onClick={() => setIsSortMenuOpen((value) => !value)}
                  className="input-base relative h-[52px] w-full overflow-hidden pr-10 text-left whitespace-nowrap bg-white/5 dark:bg-slate-800/50"
                >
                  <span className="block truncate text-sm leading-6">
                    {sortOptions.find((option) => option.value === filters.sortBy)?.label ?? t.filters.sortNewestFirst}
                  </span>
                  <ChevronDown
                    className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition ${
                      isSortMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isSortMenuOpen ? (
                  <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_22px_55px_rgba(15,23,42,0.14)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_22px_55px_rgba(2,6,23,0.35)]">
                    <div role="listbox" aria-label={t.filters.sortByLabel} className="p-1">
                      {sortOptions.map((option) => {
                        const isActive = option.value === filters.sortBy;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            data-automation={`sort-by-option-${option.value}`}
                            role="option"
                            aria-selected={isActive}
                            onClick={() => {
                              updateFilters({ sortBy: option.value });
                              setIsSortMenuOpen(false);
                            }}
                            className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${
                              isActive
                                ? "bg-slate-950 text-white"
                                : "text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                            }`}
                          >
                            <span>{option.label}</span>
                            {isActive ? <Check className="h-4 w-4" /> : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="md:col-span-4 mt-1">
            <button
              id="submit-button"
              data-automation="submit-button"
              type="submit"
              className="inline-flex h-[48px] w-full items-center justify-center rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(249,115,22,0.26)] transition hover:-translate-y-0.5 hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isPending}
            >
              {t.filters.submitButton}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}



