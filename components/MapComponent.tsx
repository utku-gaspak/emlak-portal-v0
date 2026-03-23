"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";

type MapComponentProps = {
  title: string;
  latitude: number;
  longitude: number;
  zoom?: number;
  selectable?: boolean;
  onChange?: (latitude: number, longitude: number) => void;
  markerLabel?: string;
  showPopup?: boolean;
};

function isValidCoordinate(value: number) {
  return Number.isFinite(value);
}

function clearLeafletContainer(container: HTMLDivElement) {
  const leafletContainer = container as HTMLDivElement & { _leaflet_id?: number };
  if (leafletContainer._leaflet_id) {
    delete leafletContainer._leaflet_id;
  }
  container.innerHTML = "";
}

export function MapComponent({
  title,
  latitude,
  longitude,
  zoom = 14,
  selectable = false,
  onChange,
  markerLabel = "Gaspak Emlak",
  showPopup = true
}: MapComponentProps) {
  const [isMounted, setIsMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setIsMounted(true);

    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, []);

  const markerIcon = useMemo(
    () =>
      L.divIcon({
        className: "",
        html: `
          <div class="flex flex-col items-center">
            <div class="flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-amber-500 text-white shadow-[0_14px_30px_rgba(245,158,11,0.35)]">
              <div class="h-3.5 w-3.5 rounded-full border-2 border-white bg-amber-400"></div>
            </div>
            <div class="mt-1 rounded-full bg-slate-950 px-2.5 py-0.5 text-[10px] font-semibold tracking-[0.18em] text-white shadow-lg">
              ${markerLabel}
            </div>
          </div>
        `,
        iconSize: [60, 64],
        iconAnchor: [30, 56],
        popupAnchor: [0, -52]
      }),
    [markerLabel]
  );

  useEffect(() => {
    if (!isMounted || typeof window === "undefined" || !containerRef.current) {
      return;
    }

    if (!isValidCoordinate(latitude) || !isValidCoordinate(longitude)) {
      return;
    }

    if (mapRef.current) {
      return;
    }

    const container = containerRef.current;
    clearLeafletContainer(container);

    const map = L.map(container, {
      center: [latitude, longitude],
      zoom,
      scrollWheelZoom: false,
      zoomControl: true
    });

    const marker = L.marker([latitude, longitude], {
      draggable: selectable,
      icon: markerIcon
    }).addTo(map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    if (showPopup) {
      marker.bindPopup(
        `
          <div class="space-y-1">
            <p class="font-semibold text-slate-900">${title}</p>
            <p class="text-xs text-slate-500">${latitude.toFixed(5)}, ${longitude.toFixed(5)}</p>
          </div>
        `
      );
    }

    const handleMapClick = (event: L.LeafletMouseEvent) => {
      if (!selectable || !onChange) {
        return;
      }

      const nextLatitude = event.latlng.lat;
      const nextLongitude = event.latlng.lng;
      marker.setLatLng([nextLatitude, nextLongitude]);
      onChange(nextLatitude, nextLongitude);
    };

    const handleDragEnd = () => {
      if (!selectable || !onChange) {
        return;
      }

      const nextPosition = marker.getLatLng();
      onChange(nextPosition.lat, nextPosition.lng);
    };

    if (selectable) {
      map.on("click", handleMapClick);
      marker.on("dragend", handleDragEnd);
    }

    mapRef.current = map;
    markerRef.current = marker;

    cleanupRef.current = () => {
      if (selectable) {
        map.off("click", handleMapClick);
        marker.off("dragend", handleDragEnd);
      }

      marker.off();
      marker.remove();
      map.off();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      clearLeafletContainer(container);
    };
  }, [isMounted, markerIcon, onChange, selectable, showPopup, title]);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) {
      return;
    }

    if (!isValidCoordinate(latitude) || !isValidCoordinate(longitude)) {
      return;
    }

    const nextCenter: [number, number] = [latitude, longitude];
    mapRef.current.setView(nextCenter, zoom, { animate: true });
    markerRef.current.setLatLng(nextCenter);
  }, [latitude, longitude, zoom]);

  if (!isMounted) {
    return <div className="h-full w-full animate-pulse bg-slate-100 dark:bg-slate-800/60" />;
  }

  return <div ref={containerRef} className="h-full w-full" />;
}
