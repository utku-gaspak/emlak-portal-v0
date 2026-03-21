"use client";

import { FormEvent, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronDown } from "lucide-react";
import { useTranslation } from "@/context/TranslationContext";
import type { ListingType } from "@/lib/types";

type SearchFiltersProps = {
  roomOptions: string[];
  heatingOptions: string[];
  zoningOptions: string[];
  showHeader?: boolean;
};

type FilterState = {
  query: string;
  category: ListingType | "";
  sortBy: "newest" | "oldest" | "price-asc" | "price-desc";
  minPrice: string;
  maxPrice: string;
  rooms: string;
  heatingType: string;
  zoningStatus: string;
};

function readFiltersFromParams(params: { get(name: string): string | null }): FilterState {
  const categoryValue = params.get("category");
  const category = categoryValue === "house" || categoryValue === "land" ? categoryValue : "";
  const sortByValue = params.get("sortBy");
  const sortBy =
    sortByValue === "oldest" || sortByValue === "price-asc" || sortByValue === "price-desc" || sortByValue === "newest"
      ? sortByValue
      : "newest";

  return {
    query: params.get("q") ?? "",
    category,
    sortBy,
    minPrice: params.get("minPrice") ?? "",
    maxPrice: params.get("maxPrice") ?? "",
    rooms: params.get("rooms") ?? "",
    heatingType: params.get("heatingType") ?? "",
    zoningStatus: params.get("zoningStatus") ?? ""
  };
}

function normalizeChoices(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
  );
}

export function SearchFilters({ roomOptions, heatingOptions, zoningOptions, showHeader = true }: SearchFiltersProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const searchSignature = searchParams.toString();
  const normalizedRoomOptions = useMemo(() => normalizeChoices(roomOptions), [roomOptions]);
  const normalizedHeatingOptions = useMemo(() => normalizeChoices(heatingOptions), [heatingOptions]);
  const normalizedZoningOptions = useMemo(() => normalizeChoices(zoningOptions), [zoningOptions]);
  const currentFilters = useMemo(() => readFiltersFromParams(searchParams), [searchSignature]);
  const [filters, setFilters] = useState<FilterState>(currentFilters);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  const defaultFilters: FilterState = useMemo(
    () => ({
      query: "",
      category: "",
      sortBy: "newest",
      minPrice: "",
      maxPrice: "",
      rooms: "",
      heatingType: "",
      zoningStatus: ""
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

  useEffect(() => {
    setFilters(currentFilters);
  }, [currentFilters]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node;

      if (sortMenuRef.current && !sortMenuRef.current.contains(target)) {
        setIsSortMenuOpen(false);
      }

      if (categoryMenuRef.current && !categoryMenuRef.current.contains(target)) {
        setIsCategoryMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsSortMenuOpen(false);
        setIsCategoryMenuOpen(false);
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

    if (nextFilters.category) {
      params.set("category", nextFilters.category);
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

    if (nextFilters.category === "house") {
      if (nextFilters.rooms.trim()) {
        params.set("rooms", nextFilters.rooms.trim());
      }

      if (nextFilters.heatingType.trim()) {
        params.set("heatingType", nextFilters.heatingType.trim());
      }
    }

    if (nextFilters.category === "land" && nextFilters.zoningStatus.trim()) {
      params.set("zoningStatus", nextFilters.zoningStatus.trim());
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

    if (nextFilters.category === "house") {
      nextFilters.zoningStatus = "";
    } else if (nextFilters.category === "land") {
      nextFilters.rooms = "";
      nextFilters.heatingType = "";
    } else {
      nextFilters.rooms = "";
      nextFilters.heatingType = "";
      nextFilters.zoningStatus = "";
    }

    setFilters(nextFilters);
    pushFilters(nextFilters);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    pushFilters(filters);
  }

  const isHouse = filters.category === "house";
  const isLand = filters.category === "land";
  const categoryOptions = [
    { value: "" as const, label: t.filters.categoryAll },
    { value: "house" as const, label: t.filters.categoryHouse },
    { value: "land" as const, label: t.filters.categoryLand }
  ];
  const hasActiveFilters =
    filters.query.trim().length > 0 ||
    filters.category !== "" ||
    filters.sortBy !== "newest" ||
    filters.minPrice.trim().length > 0 ||
    filters.maxPrice.trim().length > 0 ||
    filters.rooms.trim().length > 0 ||
    filters.heatingType.trim().length > 0 ||
    filters.zoningStatus.trim().length > 0;

  function resetAllFilters() {
    setFilters(defaultFilters);
    setIsSortMenuOpen(false);
    pushFilters(defaultFilters);
  }

  return (
    <section
      id="search-filters-panel"
      data-automation="search-filters-panel"
      className="rounded-[2.5rem] bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.09)] ring-1 ring-slate-200/70 sm:p-6 lg:p-7"
    >
      {showHeader ? (
        <div className="flex flex-col gap-2 border-b border-slate-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">{t.filters.title}</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{t.home.searchTitle}</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-600">{t.home.searchDescription}</p>
          {hasActiveFilters ? (
            <button
              type="button"
              data-automation="reset-all-filters"
              onClick={resetAllFilters}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
            >
              {t.filters.resetAll}
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
        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.85fr_0.95fr_auto] lg:items-end">
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
              className="input-base"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="search-filters-category-trigger" className="label-base">
              {t.filters.categoryLabel}
            </label>
            <div ref={categoryMenuRef} className="relative">
              <button
                id="search-filters-category-trigger"
                data-automation="category-filter"
                type="button"
                aria-haspopup="listbox"
                aria-expanded={isCategoryMenuOpen}
                onClick={() => setIsCategoryMenuOpen((value) => !value)}
                className="input-base relative w-full overflow-hidden pr-10 text-left whitespace-nowrap"
              >
                <span className="block truncate text-sm leading-6">
                  {categoryOptions.find((option) => option.value === filters.category)?.label ?? t.filters.categoryAll}
                </span>
                <ChevronDown
                  className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition ${
                    isCategoryMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isCategoryMenuOpen ? (
                <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_22px_55px_rgba(15,23,42,0.14)]">
                  <div role="listbox" aria-label={t.filters.categoryLabel} className="p-1">
                    {categoryOptions.map((option) => {
                      const isActive = option.value === filters.category;

                      return (
                        <button
                          key={option.value || "all"}
                          type="button"
                          data-automation={`category-option-${option.value || "all"}`}
                          role="option"
                          aria-selected={isActive}
                          onClick={() => {
                            updateFilters({ category: option.value });
                            setIsCategoryMenuOpen(false);
                          }}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${
                            isActive
                              ? "bg-slate-950 text-white"
                              : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
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
                className="input-base relative w-full overflow-hidden pr-10 text-left whitespace-nowrap"
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
                <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_22px_55px_rgba(15,23,42,0.14)]">
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
                              : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
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

          <button
            id="submit-button"
            data-automation="submit-button"
            type="submit"
            className="inline-flex h-[52px] w-full items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isPending}
          >
            {t.filters.submitButton}
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="search-filters-min-price" className="label-base">
              {t.filters.minPriceLabel}
            </label>
            <input
              id="search-filters-min-price"
              data-automation="min-price-filter"
              name="minPrice"
              type="number"
              min="0"
              value={filters.minPrice}
              onChange={(event) => updateFilters({ minPrice: event.target.value })}
              className="input-base"
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
              type="number"
              min="0"
              value={filters.maxPrice}
              onChange={(event) => updateFilters({ maxPrice: event.target.value })}
              className="input-base"
            />
          </div>
        </div>

        {isHouse ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="search-filters-rooms" className="label-base">
                {t.filters.roomCountLabel}
              </label>
              <select
                id="search-filters-rooms"
                data-automation="rooms-filter"
                name="rooms"
                value={filters.rooms}
                onChange={(event) => updateFilters({ rooms: event.target.value })}
                className="input-base"
              >
                <option value="">{t.filters.anyOption}</option>
                {normalizedRoomOptions.map((room) => (
                  <option key={room} value={room}>
                    {room}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="search-filters-heating" className="label-base">
                {t.filters.heatingTypeLabel}
              </label>
              <select
                id="search-filters-heating"
                data-automation="heating-filter"
                name="heatingType"
                value={filters.heatingType}
                onChange={(event) => updateFilters({ heatingType: event.target.value })}
                className="input-base"
              >
                <option value="">{t.filters.anyOption}</option>
                {normalizedHeatingOptions.map((heating) => (
                  <option key={heating} value={heating}>
                    {heating}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null}

        {isLand ? (
          <div className="space-y-2">
            <label htmlFor="search-filters-zoning" className="label-base">
              {t.filters.zoningStatusLabel}
            </label>
            <select
              id="search-filters-zoning"
              data-automation="zoning-filter"
              name="zoningStatus"
              value={filters.zoningStatus}
              onChange={(event) => updateFilters({ zoningStatus: event.target.value })}
              className="input-base"
            >
              <option value="">{t.filters.anyOption}</option>
              {normalizedZoningOptions.map((zoning) => (
                <option key={zoning} value={zoning}>
                  {zoning}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </form>
    </section>
  );
}
