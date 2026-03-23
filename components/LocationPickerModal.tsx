"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useTranslation } from "@/context/TranslationContext";

const MapComponent = dynamic(() => import("@/components/MapComponent").then((mod) => mod.MapComponent), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-slate-100 dark:bg-slate-800/60" />
});

type Coordinates = {
  latitude: number;
  longitude: number;
};

type LocationPickerModalProps = {
  open: boolean;
  title: string;
  latitude: number | null;
  longitude: number | null;
  onClose: () => void;
  onChange: (latitude: number, longitude: number) => void;
};

const DEFAULT_CENTER: Coordinates = {
  latitude: 41.0082,
  longitude: 28.9784
};

function isValidCoordinate(value: number | null, min: number, max: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

function getStartingPosition(latitude: number | null, longitude: number | null): [number, number] {
  if (isValidCoordinate(latitude, -90, 90) && isValidCoordinate(longitude, -180, 180)) {
    return [latitude, longitude];
  }

  return [DEFAULT_CENTER.latitude, DEFAULT_CENTER.longitude];
}

export function LocationPickerModal({ open, title, latitude, longitude, onClose, onChange }: LocationPickerModalProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [isBrowser, setIsBrowser] = useState(false);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsBrowser(typeof window !== "undefined");
  }, []);

  useEffect(() => {
    if (!open) {
      setShowMap(false);
      return;
    }

    const timer = window.setTimeout(() => setShowMap(true), 60);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!mounted || !open || !isBrowser) {
    return null;
  }

  const center = getStartingPosition(latitude, longitude);
  const mapKey = `${open ? "open" : "closed"}-${center[0].toFixed(4)}-${center[1].toFixed(4)}`;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 px-3 py-4 backdrop-blur-md sm:px-4">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_120px_rgba(15,23,42,0.32)] dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700 dark:text-amber-400">{t.admin.form.mapPickerTitle}</p>
            <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950 dark:text-slate-100">{title}</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.admin.form.mapPickerDescription}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-amber-300 hover:text-amber-600 dark:border-slate-800 dark:text-slate-400 dark:hover:border-amber-500/40 dark:hover:text-amber-400"
            aria-label={t.common.close}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 sm:p-5">
          <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-100 shadow-[0_20px_60px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-950/50">
            <div className="h-[68vh] min-h-[420px] w-full">
              <div key={mapKey} className="h-full w-full">
                {showMap ? (
                  <MapComponent
                    title={title}
                    latitude={center[0]}
                    longitude={center[1]}
                    selectable
                    onChange={onChange}
                    markerLabel="Gaspak Emlak"
                    showPopup={false}
                  />
                ) : (
                  <div className="h-full w-full animate-pulse bg-slate-100 dark:bg-slate-800/60" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
