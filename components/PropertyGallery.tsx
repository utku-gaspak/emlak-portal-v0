"use client";

import { useEffect, useMemo, useState } from "react";
import { getDictionary } from "@/lib/locale";
import { getPhotoFileName, getPublicPhotoSrc } from "@/lib/photo-path";

type PropertyGalleryProps = {
  listingId: string;
  title: string;
  images: string[];
};

const PLACEHOLDER_SRC = "/property-placeholder.svg";

export function PropertyGallery({ listingId, title, images }: PropertyGalleryProps) {
  const t = getDictionary();
  const normalizedImages = useMemo(() => images.map((image) => getPhotoFileName(image)), [images]);
  const imageCount = normalizedImages.length;
  const hasPhotos = imageCount > 0;

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setSelectedIndex(0);
    setIsLightboxOpen(false);
    setFailedImages({});
  }, [listingId, imageCount]);

  useEffect(() => {
    if (!isLightboxOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsLightboxOpen(false);
        return;
      }

      if (!hasPhotos || imageCount <= 1) {
        return;
      }

      if (event.key === "ArrowLeft") {
        setSelectedIndex((current) => (current - 1 + imageCount) % imageCount);
      }

      if (event.key === "ArrowRight") {
        setSelectedIndex((current) => (current + 1) % imageCount);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [hasPhotos, imageCount, isLightboxOpen]);

  const currentImageFile = normalizedImages[selectedIndex];
  const currentImageSrc = currentImageFile ? getPublicPhotoSrc(currentImageFile, listingId) : PLACEHOLDER_SRC;

  const handleImageError = (index: number) => {
    setFailedImages((current) => (current[index] ? current : { ...current, [index]: true }));
  };

  const goPrev = () => {
    if (!hasPhotos) {
      return;
    }

    setSelectedIndex((current) => (current - 1 + imageCount) % imageCount);
  };

  const goNext = () => {
    if (!hasPhotos) {
      return;
    }

    setSelectedIndex((current) => (current + 1) % imageCount);
  };

  return (
    <section data-automation="property-gallery" className="space-y-4">
      <button
        type="button"
        onClick={() => {
          if (hasPhotos) {
            setIsLightboxOpen(true);
          }
        }}
        className="block w-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-100"
        aria-label={t.gallery.openPreviewAria}
      >
        <div className="relative aspect-[4/3] w-full bg-slate-200 sm:aspect-[16/9]">
          <img
            id={hasPhotos ? "main-image-display" : "image-placeholder"}
            data-automation="main-property-image"
            src={failedImages[selectedIndex] || !hasPhotos ? PLACEHOLDER_SRC : currentImageSrc}
            alt={hasPhotos ? `${title} photo ${selectedIndex + 1}` : t.propertyDetail.placeholderAlt}
            className="h-full w-full object-cover"
            onError={() => handleImageError(selectedIndex)}
          />
        </div>
      </button>

      {!hasPhotos ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-600">
          {t.gallery.placeholderMessage}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: imageCount }).map((_, index) => {
            const isSelected = selectedIndex === index;
            const fileName = normalizedImages[index];
            const imageSrc = failedImages[index] || !fileName ? PLACEHOLDER_SRC : getPublicPhotoSrc(fileName, listingId);

            return (
              <button
                key={`${listingId}-${index}`}
                type="button"
                id={`thumbnail-image-${index + 1}`}
                data-automation={`thumbnail-image-${index + 1}`}
                onClick={() => setSelectedIndex(index)}
                className={`overflow-hidden rounded-2xl border bg-white transition focus:outline-none focus:ring-2 focus:ring-brand-100 ${
                  isSelected ? "border-brand-500 ring-2 ring-brand-100" : "border-slate-200"
                }`}
                aria-label={`${t.gallery.thumbnailAria} ${index + 1}`}
              >
                <div className="relative aspect-square w-full bg-slate-100">
                  <img
                    src={imageSrc}
                    alt={`${title} thumbnail ${index + 1}`}
                    className="h-full w-full object-cover"
                    onError={() => handleImageError(index)}
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {isLightboxOpen ? (
        <div
          data-automation="lightbox-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t.gallery.photoPreviewAria}
          onClick={() => setIsLightboxOpen(false)}
        >
          <div
            className="relative flex w-full max-w-6xl flex-col items-center gap-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl">
              <div className="relative aspect-[4/3] w-full sm:aspect-[16/9]">
                <img
                  src={failedImages[selectedIndex] || !currentImageFile ? PLACEHOLDER_SRC : currentImageSrc}
                  alt={`${title} lightbox image ${selectedIndex + 1}`}
                  className="h-full w-full bg-black object-contain"
                  onError={() => handleImageError(selectedIndex)}
                />
                <div
                  data-automation="viewer-image-index"
                  className="absolute left-4 top-4 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur"
                >
                  Image {selectedIndex + 1}
                </div>
              </div>
            </div>

            <div className="flex w-full flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                data-automation="lightbox-close"
                onClick={() => setIsLightboxOpen(false)}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100"
              >
                {t.common.close}
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  data-automation="lightbox-prev"
                  onClick={goPrev}
                  className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  {t.common.previous}
                </button>
                <button
                  type="button"
                  data-automation="lightbox-next"
                  onClick={goNext}
                  className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  {t.common.next}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
