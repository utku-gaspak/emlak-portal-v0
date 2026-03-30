"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useTranslation } from "@/context/TranslationContext";

const MapComponent = dynamic(() => import("@/components/MapComponent").then((mod) => mod.MapComponent), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-slate-100 dark:bg-slate-800/60" />
});

type PropertyMapProps = {
  title: string;
  latitude: number | null;
  longitude: number | null;
};

function isValidCoordinate(value: number | null, min: number, max: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

export function PropertyMap({ title, latitude, longitude }: PropertyMapProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const hasCoordinates = isValidCoordinate(latitude, -90, 90) && isValidCoordinate(longitude, -180, 180);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <section className="relative z-10 space-y-4 rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-[0_22px_70px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900/80">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700 dark:text-amber-400">{t.propertyDetail.mapEyebrow}</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-slate-100">{t.propertyDetail.mapTitle}</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t.propertyDetail.mapDescription}</p>
        </div>
        <div className="h-[360px] w-full animate-pulse rounded-[2rem] bg-slate-100 dark:bg-slate-800/60 md:h-[420px]" />
      </section>
    );
  }

  if (!hasCoordinates) {
    return (
      <section className="relative z-10 space-y-4 rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-[0_22px_70px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900/80">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700 dark:text-amber-400">{t.propertyDetail.mapEyebrow}</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-slate-100">{t.propertyDetail.mapTitle}</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t.propertyDetail.mapDescription}</p>
        </div>

        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center dark:border-slate-700 dark:bg-slate-950/50">
          <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{t.propertyDetail.noCoordinatesTitle}</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{t.propertyDetail.noCoordinatesDescription}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative z-10 space-y-4 rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-[0_22px_70px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900/80">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700 dark:text-amber-400">{t.propertyDetail.mapEyebrow}</p>
        <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-slate-100">{t.propertyDetail.mapTitle}</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t.propertyDetail.mapDescription}</p>
      </div>

      <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-100 shadow-[0_20px_60px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-950/50">
        <div className="h-[360px] w-full md:h-[420px]">
          <MapComponent title={title} latitude={latitude} longitude={longitude} showPopup markerLabel="Gaspak Emlak" />
        </div>
      </div>
    </section>
  );
}
