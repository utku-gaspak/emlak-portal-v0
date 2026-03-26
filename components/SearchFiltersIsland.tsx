"use client";

import dynamic from "next/dynamic";
import type { Category } from "@/lib/types";

type SearchFiltersIslandProps = {
  categories: Category[];
  showHeader?: boolean;
};

const SearchFilters = dynamic(() => import("@/components/SearchFilters").then((module) => module.SearchFilters), {
  ssr: false,
  loading: () => (
    <div className="w-full overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white/80 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900/70">
      <div className="h-[160px] animate-pulse rounded-[2rem] bg-slate-200/70 dark:bg-slate-800/70" />
    </div>
  )
});

export function SearchFiltersIsland({ categories, showHeader = true }: SearchFiltersIslandProps) {
  return <SearchFilters categories={categories} showHeader={showHeader} />;
}
