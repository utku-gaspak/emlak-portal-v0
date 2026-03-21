"use client";

import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getDictionary } from "@/lib/locale";
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
  minPrice: string;
  maxPrice: string;
  rooms: string;
  heatingType: string;
  zoningStatus: string;
};

function readFiltersFromParams(params: { get(name: string): string | null }): FilterState {
  const categoryValue = params.get("category");
  const category = categoryValue === "house" || categoryValue === "land" ? categoryValue : "";

  return {
    query: params.get("q") ?? "",
    category,
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
  const t = getDictionary();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const searchSignature = searchParams.toString();
  const normalizedRoomOptions = useMemo(() => normalizeChoices(roomOptions), [roomOptions]);
  const normalizedHeatingOptions = useMemo(() => normalizeChoices(heatingOptions), [heatingOptions]);
  const normalizedZoningOptions = useMemo(() => normalizeChoices(zoningOptions), [zoningOptions]);
  const currentFilters = useMemo(() => readFiltersFromParams(searchParams), [searchSignature]);
  const [filters, setFilters] = useState<FilterState>(currentFilters);

  useEffect(() => {
    setFilters(currentFilters);
  }, [currentFilters]);

  function buildUrl(nextFilters: FilterState): string {
    const params = new URLSearchParams();

    if (nextFilters.query.trim()) {
      params.set("q", nextFilters.query.trim());
    }

    if (nextFilters.category) {
      params.set("category", nextFilters.category);
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
        </div>
      ) : null}

      <form
        id="property-search-filters-form"
        data-automation="property-search-filters-form"
        className="mt-5 space-y-4"
        onSubmit={handleSubmit}
      >
        <div className="grid gap-4 lg:grid-cols-[1.45fr_0.8fr_auto] lg:items-end">
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
            <label htmlFor="search-filters-category" className="label-base">
              {t.filters.categoryLabel}
            </label>
            <select
              id="search-filters-category"
              data-automation="category-filter"
              name="category"
              value={filters.category}
              onChange={(event) => updateFilters({ category: event.target.value as ListingType | "" })}
              className="input-base"
            >
              <option value="">{t.filters.categoryAll}</option>
              <option value="house">{t.filters.categoryHouse}</option>
              <option value="land">{t.filters.categoryLand}</option>
            </select>
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
