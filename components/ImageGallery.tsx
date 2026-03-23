"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, MessageCircle, X } from "lucide-react";
import { useTranslation } from "@/context/TranslationContext";
import { getClientLocale } from "@/lib/locale";
import { getOptimizedCloudinaryUrl } from "@/lib/image-url";
import { getPropertyWhatsAppHref } from "@/lib/contact-links";

type ImageGalleryProps = {
  title: string;
  images: string[];
  listingId?: string;
  listingRef?: string | number;
};

const PLACEHOLDER_SRC = "/property-placeholder.svg";
const DEFAULT_LIGHTBOX_WIDTH = 1600;
const DEFAULT_THUMB_WIDTH = 700;
const DEFAULT_LOCALE = "tr" as const;

function buildAltText(title: string, index: number, suffix: string) {
  return `${title} ${suffix} ${index + 1}`;
}

function getSwipeDirection(offsetX: number, velocityX: number) {
  const swipePower = Math.abs(offsetX) * velocityX;
  const offsetThreshold = 110;
  const velocityThreshold = 700;

  if (offsetX > offsetThreshold || swipePower > velocityThreshold) {
    return -1;
  }

  if (offsetX < -offsetThreshold || swipePower < -velocityThreshold) {
    return 1;
  }

  return 0;
}

export function ImageGallery({ title, images, listingId, listingRef }: ImageGalleryProps) {
  const { t } = useTranslation();
  const locale = getClientLocale() || DEFAULT_LOCALE;
  const [mounted, setMounted] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

  const normalizedImages = useMemo(
    () => images.map((image) => image.trim()).filter((image) => image.length > 0),
    [images]
  );
  const imageCount = normalizedImages.length;
  const hasPhotos = imageCount > 0;
  const previewImages = useMemo(() => normalizedImages.slice(0, 4), [normalizedImages]);
  const previewCount = previewImages.length;
  const remainingCount = Math.max(imageCount - previewCount, 0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
    setIsLightboxOpen(false);
    setFailedImages({});
    setLoadedImages({});
  }, [listingId, imageCount]);

  useEffect(() => {
    if (!isLightboxOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

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

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [hasPhotos, imageCount, isLightboxOpen]);

  const currentImageFile = normalizedImages[selectedIndex];
  const currentImageSrc = currentImageFile
    ? getOptimizedCloudinaryUrl(currentImageFile, DEFAULT_LIGHTBOX_WIDTH)
    : PLACEHOLDER_SRC;
  const whatsappHref = listingRef ? getPropertyWhatsAppHref(title, listingRef, locale) : "";

  const handleImageError = (index: number) => {
    setFailedImages((current) => (current[index] ? current : { ...current, [index]: true }));
  };

  const markLoaded = (key: string) => {
    setLoadedImages((current) => (current[key] ? current : { ...current, [key]: true }));
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

  const openLightboxAt = (index: number) => {
    if (!hasPhotos) {
      return;
    }

    setSelectedIndex(index);
    setIsLightboxOpen(true);
  };

  const currentMainKey = currentImageFile ? `${listingId ?? "listing"}-main-${selectedIndex}` : "placeholder";
  const currentPreviewKey = (index: number) => `${listingId ?? "listing"}-preview-${index}`;

  const lightbox =
    mounted && isLightboxOpen && hasPhotos
      ? createPortal(
          <AnimatePresence mode="wait">
            <motion.div
              key="image-lightbox-overlay"
              data-automation="lightbox-overlay"
              className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-3 backdrop-blur-xl sm:p-6"
              role="dialog"
              aria-modal="true"
              aria-label={t.gallery.photoPreviewAria}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              onClick={() => setIsLightboxOpen(false)}
            >
              <motion.div
                className="relative flex w-full max-w-7xl flex-col gap-4"
                initial={{ scale: 0.98, y: 24, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.98, y: 24, opacity: 0 }}
                transition={{ duration: 0.24, ease: "easeOut" }}
                onClick={(event) => event.stopPropagation()}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.15}
                onDragEnd={(_, info) => {
                  if (info.offset.y > 120 || info.velocity.y > 900) {
                    setIsLightboxOpen(false);
                  }
                }}
              >
                <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
                  <div className="absolute left-4 top-4 z-20 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                    {selectedIndex + 1} / {imageCount}
                  </div>

                  <button
                    type="button"
                    data-automation="lightbox-close"
                    onClick={() => setIsLightboxOpen(false)}
                    className="absolute right-4 top-4 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
                    aria-label={t.common.close}
                  >
                    <X className="h-5 w-5" />
                  </button>

                  {whatsappHref ? (
                    <Link
                      href={whatsappHref}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute bottom-4 right-4 z-20 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-500/95 px-4 py-2 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(16,185,129,0.28)] transition hover:-translate-y-0.5 hover:bg-emerald-600 dark:border-emerald-700 dark:bg-emerald-500/90"
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </Link>
                  ) : null}

                  <div className="relative flex h-[72dvh] min-h-[480px] w-full items-center justify-center bg-black sm:h-[76dvh]">
                    <button
                      type="button"
                      data-automation="lightbox-prev"
                      onClick={goPrev}
                      className="absolute left-4 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/10 p-3 text-white transition hover:bg-white/20 sm:inline-flex"
                      aria-label={t.common.previous}
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>

                    <button
                      type="button"
                      data-automation="lightbox-next"
                      onClick={goNext}
                      className="absolute right-4 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/10 p-3 text-white transition hover:bg-white/20 sm:inline-flex"
                      aria-label={t.common.next}
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`${selectedIndex}-${normalizedImages[selectedIndex] ?? "placeholder"}`}
                        className="relative flex h-full w-full items-center justify-center"
                        initial={{ opacity: 0, scale: 0.96, x: 40 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.96, x: -40 }}
                        transition={{ duration: 0.28, ease: "easeOut" }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.18}
                        onDragEnd={(_, info) => {
                          const direction = getSwipeDirection(info.offset.x, info.velocity.x);

                          if (direction === -1) {
                            goPrev();
                          }

                          if (direction === 1) {
                            goNext();
                          }
                        }}
                      >
                        <div className="relative h-full w-full">
                          {!loadedImages[currentImageFile ?? ""] ? <div className="absolute inset-0 animate-pulse bg-slate-900/80" /> : null}
                          <Image
                            src={failedImages[selectedIndex] || !currentImageFile ? PLACEHOLDER_SRC : currentImageSrc}
                            alt={buildAltText(title, selectedIndex, "large view")}
                            fill
                            sizes="100vw"
                            className="object-contain"
                            onError={() => handleImageError(selectedIndex)}
                            onLoadingComplete={() => markLoaded(currentImageFile ?? `fallback-${selectedIndex}`)}
                            draggable={false}
                            priority
                          />
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>

                <div className="flex flex-col gap-3 rounded-[1.75rem] border border-slate-200 bg-white/95 p-3 shadow-[0_18px_50px_rgba(15,23,42,0.12)] backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</p>
                    <div className="hidden items-center gap-2 sm:flex">
                      <button
                        type="button"
                        onClick={goPrev}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-white"
                        aria-label={t.common.previous}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={goNext}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-white"
                        aria-label={t.common.next}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                    {previewImages.map((image, index) => {
                      const isSelected = index === selectedIndex;
                      const thumbSrc = failedImages[index] ? PLACEHOLDER_SRC : getOptimizedCloudinaryUrl(image, DEFAULT_THUMB_WIDTH);
                      const previewKey = currentPreviewKey(index);
                      const hasLoaded = loadedImages[previewKey];
                      const isLastPreview = remainingCount > 0 && index === previewCount - 1;

                      return (
                        <button
                          key={`lightbox-thumb-${listingId ?? "listing"}-${index}`}
                          type="button"
                          onClick={() => setSelectedIndex(index)}
                          className={`relative aspect-square overflow-hidden rounded-2xl border transition focus:outline-none focus:ring-2 focus:ring-brand-100 ${
                            isSelected
                              ? "border-brand-500 ring-2 ring-brand-100 dark:border-amber-400 dark:ring-amber-500/20"
                              : "border-slate-200 dark:border-slate-800"
                          }`}
                          aria-label={`${t.gallery.thumbnailAria} ${index + 1}`}
                        >
                          {!hasLoaded ? <div className="absolute inset-0 animate-pulse bg-slate-200 dark:bg-slate-800" /> : null}
                          <Image
                            src={thumbSrc}
                            alt={buildAltText(title, index, "thumbnail")}
                            fill
                            sizes="96px"
                            className="object-cover"
                            onError={() => handleImageError(index)}
                            onLoadingComplete={() => markLoaded(previewKey)}
                            draggable={false}
                          />
                          {isLastPreview ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/55 text-center backdrop-blur-[1px]">
                              <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-white">
                                <p className="text-lg font-black leading-none">+{remainingCount}</p>
                                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.22em]">more</p>
                              </div>
                            </div>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>,
          document.body
        )
      : null;

  return (
    <section data-automation="property-gallery" className="space-y-4">
      {!hasPhotos ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          {t.gallery.placeholderMessage}
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => openLightboxAt(selectedIndex)}
            className="block w-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-slate-800 dark:bg-slate-900"
            aria-label={t.gallery.openPreviewAria}
          >
            <div className="relative aspect-[4/3] w-full bg-slate-200 sm:aspect-[16/9] dark:bg-slate-800">
              {!loadedImages[currentMainKey] ? <div className="absolute inset-0 animate-pulse bg-slate-200 dark:bg-slate-800" /> : null}
              <Image
                id="main-image-display"
                data-automation="main-property-image"
                src={failedImages[selectedIndex] ? PLACEHOLDER_SRC : getOptimizedCloudinaryUrl(currentImageFile ?? "", DEFAULT_LIGHTBOX_WIDTH)}
                alt={buildAltText(title, selectedIndex, "featured photo")}
                fill
                sizes="(max-width: 1024px) 100vw, 720px"
                className="object-cover"
                onError={() => handleImageError(selectedIndex)}
                onLoadingComplete={() => markLoaded(currentMainKey)}
                draggable={false}
                priority
              />
            </div>
          </button>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {previewImages.map((image, index) => {
              const isSelected = selectedIndex === index;
              const imageSrc = failedImages[index] || !image ? PLACEHOLDER_SRC : getOptimizedCloudinaryUrl(image, DEFAULT_THUMB_WIDTH);
              const previewKey = `${listingId ?? "listing"}-page-preview-${index}`;
              const hasLoaded = loadedImages[previewKey];
              const isLastPreview = remainingCount > 0 && index === previewCount - 1;

              return (
                <button
                  key={`${listingId}-${index}`}
                  type="button"
                  id={`thumbnail-image-${index + 1}`}
                  data-automation={`thumbnail-image-${index + 1}`}
                  onClick={() => openLightboxAt(index)}
                  className={`relative overflow-hidden rounded-2xl border bg-white transition focus:outline-none focus:ring-2 focus:ring-brand-100 dark:bg-slate-900 ${
                    isSelected ? "border-brand-500 ring-2 ring-brand-100 dark:border-amber-400 dark:ring-amber-500/20" : "border-slate-200 dark:border-slate-800"
                  }`}
                  aria-label={`${t.gallery.thumbnailAria} ${index + 1}`}
                >
                  <div className="relative aspect-square w-full bg-slate-100 dark:bg-slate-800">
                    {!hasLoaded ? <div className="absolute inset-0 animate-pulse bg-slate-200 dark:bg-slate-800" /> : null}
                    <Image
                      src={imageSrc}
                      alt={buildAltText(title, index, "thumbnail")}
                      fill
                      sizes="(max-width: 1024px) 50vw, 25vw"
                      className="object-cover"
                      onError={() => handleImageError(index)}
                      onLoadingComplete={() => markLoaded(previewKey)}
                      draggable={false}
                    />
                    {isLastPreview ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-950/55 text-center backdrop-blur-[1px]">
                        <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-white">
                          <p className="text-lg font-black leading-none">+{remainingCount}</p>
                          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.22em]">more</p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {lightbox}
    </section>
  );
}
