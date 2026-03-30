"use client";

import { FormEvent, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronDown, Settings2, X } from "lucide-react";
import { useTranslation } from "@/context/TranslationContext";
import type { Category } from "@/lib/types";
import { CategoryDropdown } from "@/components/CategoryDropdown";
import { StatusDropdown } from "@/components/StatusDropdown";
import {
  determineListingTypeFromCategory,
  getChildCategories,
  getLocalizedCategoryName,
  getParentCategoryById
} from "@/lib/category-utils";
import {
  DEFAULT_LISTING_SEARCH_FILTERS,
  buildListingSearchUrl,
  readListingSearchFilters,
  type ListingSearchFilters
} from "@/lib/listing-filters";
import type { Locale } from "@/lib/i18n-data";

type SearchFiltersProps = {
  categories: Category[];
  showHeader?: boolean;
};

type FilterState = ListingSearchFilters;

const HEATING_TYPE_OPTIONS = [
  { value: "Doğalgaz (Kombi)", labelTr: "Doğalgaz (Kombi)", labelEn: "Natural Gas (Combi)" },
  { value: "Merkezi Sistem", labelTr: "Merkezi Sistem", labelEn: "Central System" },
  { value: "Yerden Isıtma", labelTr: "Yerden Isıtma", labelEn: "Underfloor Heating" },
  { value: "Klima", labelTr: "Klima", labelEn: "Air Conditioning" },
  { value: "Soba / Katı Yakıt", labelTr: "Soba / Katı Yakıt", labelEn: "Stove / Solid Fuel" },
  { value: "Isı Pompası", labelTr: "Isı Pompası", labelEn: "Heat Pump" },
  { value: "Yok", labelTr: "Yok", labelEn: "None" }
];

const ZONING_STATUS_OPTIONS = [
  { value: "İmarlı", labelTr: "İmarlı", labelEn: "Zoned" },
  { value: "İmarsız", labelTr: "İmarsız", labelEn: "Unzoned" }
];

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
  const locale = (t.meta.lang === "en" ? "en" : "tr") as Locale;
  const localizedCategories = useMemo(
    () => categories.map((category) => ({ ...category, name: getLocalizedCategoryName(category, locale) })),
    [categories, locale]
  );
  const rootCategories = useMemo(() => normalizeOptions(localizedCategories.filter((category) => !category.parentId)), [localizedCategories]);
  const currentFilters = useMemo(() => readListingSearchFilters(searchParams, categories), [searchSignature, categories]);
  const [filters, setFilters] = useState<FilterState>(currentFilters);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const localeIsEnglish = locale === "en";
  const advancedButtonLabel = localeIsEnglish ? "Search Now" : "Arama Yap";
  const advancedTitle = localeIsEnglish ? "Advanced Search" : "Gelişmiş Arama";
  const closeLabel = localeIsEnglish ? "Close" : "Kapat";
  const searchActionLabel = t.filters.submitButton;

  const defaultFilters = DEFAULT_LISTING_SEARCH_FILTERS;

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

  const heatingOptions = useMemo(
    () =>
      HEATING_TYPE_OPTIONS.map((option) => ({
        value: option.value,
        label: localeIsEnglish ? option.labelEn : option.labelTr
      })),
    [localeIsEnglish]
  );

  const zoningOptions = useMemo(
    () =>
      ZONING_STATUS_OPTIONS.map((option) => ({
        value: option.value,
        label: localeIsEnglish ? option.labelEn : option.labelTr
      })),
    [localeIsEnglish]
  );

  const selectedParent = useMemo(
    () => rootCategories.find((category) => category.id === filters.parentCategoryId) ?? null,
    [filters.parentCategoryId, rootCategories]
  );
  const subCategories = useMemo(
    () => (filters.parentCategoryId ? normalizeOptions(getChildCategories(localizedCategories, filters.parentCategoryId)) : []),
    [filters.parentCategoryId, localizedCategories]
  );
  const selectedSubCategory = useMemo(
    () => categories.find((category) => category.id === filters.categoryId) ?? null,
    [categories, filters.categoryId]
  );
  const selectedListingType = useMemo(() => {
    if (!selectedParent && !selectedSubCategory) {
      return null;
    }

    return determineListingTypeFromCategory(selectedSubCategory, selectedParent);
  }, [selectedParent, selectedSubCategory]);
  const showHouseFilters = selectedListingType !== "land";
  const showLandFilters = selectedListingType !== "house";

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
        setIsAdvancedOpen(false);
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
    return buildListingSearchUrl(pathname, nextFilters);
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

    const nextParentCategory = nextFilters.parentCategoryId
      ? categories.find((category) => category.id === nextFilters.parentCategoryId) ?? null
      : null;
    const nextSubCategory = nextFilters.categoryId ? categories.find((category) => category.id === nextFilters.categoryId) ?? null : null;

    if (nextParentCategory || nextSubCategory) {
      const nextListingType = determineListingTypeFromCategory(nextSubCategory, nextParentCategory);

      if (nextListingType === "house") {
        nextFilters.zoningStatus = "";
      }

      if (nextListingType === "land") {
        nextFilters.rooms = "";
        nextFilters.heatingType = "";
      }
    }

    setFilters(nextFilters);
    pushFilters(nextFilters);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    pushFilters(filters);
  }

  const hasAdvancedFilters =
    filters.currency !== "TRY" ||
    filters.status.length > 0 ||
    filters.parentCategoryId.length > 0 ||
    filters.categoryId.length > 0 ||
    filters.sortBy !== "newest" ||
    filters.minPrice.trim().length > 0 ||
    filters.maxPrice.trim().length > 0 ||
    filters.rooms.trim().length > 0 ||
    filters.heatingType.trim().length > 0 ||
    filters.zoningStatus.trim().length > 0;

  function resetAllFilters() {
    setFilters(defaultFilters);
    setIsSortMenuOpen(false);
    setIsAdvancedOpen(false);
    pushFilters(defaultFilters);
  }

  return (
    <section
      id="search-filters-panel"
      data-automation="search-filters-panel"
      className="relative z-30 overflow-visible rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.09)] ring-1 ring-slate-200/70 sm:p-6 lg:p-7 dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-[0_24px_70px_rgba(2,6,23,0.35)] dark:ring-slate-800/70"
    >
      {showHeader ? (
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-end sm:justify-between dark:border-slate-800">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700 dark:text-amber-400">{t.filters.title}</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-slate-100">{t.home.searchTitle}</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-400">{t.home.searchDescription}</p>
          {hasAdvancedFilters ? (
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

      <form id="property-search-filters-form" data-automation="property-search-filters-form" className="mt-5 space-y-5" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
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

          <div className="flex items-end sm:w-auto">
            <button
              type="button"
              onClick={() => setIsAdvancedOpen((current) => !current)}
              aria-expanded={isAdvancedOpen}
              aria-controls="advanced-search-panel"
              className={`inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(249,115,22,0.28)] transition duration-300 hover:-translate-y-0.5 hover:from-orange-400 hover:to-amber-400 hover:shadow-[0_18px_38px_rgba(249,115,22,0.34)] sm:min-w-[180px]`}
            >
              <Settings2 className="h-4 w-4 flex-shrink-0" />
              <span>{advancedButtonLabel}</span>
              {hasAdvancedFilters ? (
                <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 px-1 text-[10px] font-black leading-none text-current">
                  {[
                    filters.currency !== "TRY",
                    filters.status.length > 0,
                    filters.parentCategoryId.length > 0,
                    filters.categoryId.length > 0,
                    filters.sortBy !== "newest",
                    filters.minPrice.trim().length > 0,
                    filters.maxPrice.trim().length > 0,
                    filters.rooms.trim().length > 0,
                    filters.heatingType.trim().length > 0,
                    filters.zoningStatus.trim().length > 0
                  ].filter(Boolean).length}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        <div id="advanced-search-panel" className="relative md:block">
          <div className={`fixed inset-0 z-50 p-4 md:static md:inset-auto md:z-auto md:block md:p-0 ${isAdvancedOpen ? "block" : "hidden md:block"}`}>
            <button
              type="button"
              aria-label={closeLabel}
              onClick={() => setIsAdvancedOpen(false)}
              className={`absolute inset-0 bg-slate-950/50 backdrop-blur-[2px] transition-opacity duration-300 md:hidden ${isAdvancedOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
            />

            <div
              className={`relative flex h-full max-h-[calc(100vh-2rem)] w-full flex-col overflow-y-auto rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_28px_80px_rgba(15,23,42,0.18)] transition-all duration-300 ease-out sm:p-6 md:mt-4 md:block md:max-h-none md:h-auto md:rounded-3xl dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_28px_80px_rgba(2,6,23,0.4)] ${isAdvancedOpen ? "scale-100 opacity-100" : "scale-[0.98] opacity-0 md:scale-100 md:opacity-100"}`}
            >
              <div className="mb-5 flex items-center justify-between gap-4 md:hidden">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-500">{advancedTitle}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{t.home.searchDescription}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAdvancedOpen(false)}
                  aria-label={closeLabel}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:text-slate-950 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:text-slate-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2 md:col-span-4">
                  <label htmlFor="search-filters-query-advanced" className="label-base">
                    {t.filters.searchLabel}
                  </label>
                  <input
                    id="search-filters-query-advanced"
                    data-automation="search-input-advanced"
                    name="q-advanced"
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

                {showHouseFilters ? (
                  <>
                    <div className="space-y-2">
                      <label htmlFor="search-filters-rooms" className="label-base">
                        {t.filters.roomCountLabel}
                      </label>
                      <input
                        id="search-filters-rooms"
                        data-automation="rooms-filter"
                        name="rooms"
                        type="text"
                        value={filters.rooms}
                        onChange={(event) => updateFilters({ rooms: event.target.value })}
                        placeholder="3+1"
                        className="input-base h-[52px] w-full bg-white/5 dark:bg-slate-800/50"
                      />
                    </div>

                    <StatusDropdown
                      id="search-filters-heating-type"
                      label={t.filters.heatingTypeLabel}
                      placeholder={t.filters.anyOption}
                      value={filters.heatingType}
                      options={heatingOptions}
                      onChange={(nextValue) => updateFilters({ heatingType: nextValue })}
                      dataAutomation="heating-type-filter"
                      clearLabel={t.common.clear}
                      allowClear
                      className="input-base h-[52px] bg-white/5 dark:bg-slate-800/50"
                    />
                  </>
                ) : null}

                {showLandFilters ? (
                  <StatusDropdown
                    id="search-filters-zoning-status"
                    label={t.filters.zoningStatusLabel}
                    placeholder={t.filters.anyOption}
                    value={filters.zoningStatus}
                    options={zoningOptions}
                    onChange={(nextValue) => updateFilters({ zoningStatus: nextValue })}
                    dataAutomation="zoning-status-filter"
                    clearLabel={t.common.clear}
                    allowClear
                    className="input-base h-[52px] bg-white/5 dark:bg-slate-800/50"
                  />
                ) : null}

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
                      className="input-base relative h-[52px] w-full overflow-hidden bg-white/5 pr-10 text-left whitespace-nowrap dark:bg-slate-800/50"
                    >
                      <span className="block truncate text-sm leading-6">
                        {sortOptions.find((option) => option.value === filters.sortBy)?.label ?? t.filters.sortNewestFirst}
                      </span>
                      <ChevronDown
                        className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition ${isSortMenuOpen ? "rotate-180" : ""}`}
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
                                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${isActive ? "bg-slate-950 text-white" : "text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"}`}
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

              <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                <button
                  type="button"
                  data-automation="clear-filters-button"
                  onClick={resetAllFilters}
                  className="inline-flex h-[48px] items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:text-slate-50"
                >
                  {t.common.clear}
                </button>

                <button
                  id="submit-button"
                  data-automation="submit-button"
                  type="submit"
                  className="inline-flex h-[48px] w-full items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(249,115,22,0.28)] transition duration-300 hover:-translate-y-0.5 hover:from-orange-400 hover:to-amber-400 hover:shadow-[0_18px_38px_rgba(249,115,22,0.34)] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto sm:min-w-[180px]"
                  disabled={isPending}
                >
                  {searchActionLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </section>
  );
}
