"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { getPhotoFileName, getPublicPhotoSrc } from "@/lib/photo-path";

type EditPhotoManagerProps = {
  listingId: string;
  images: string[];
};

const PLACEHOLDER_SRC = "/property-placeholder.svg";

export function EditPhotoManager({ listingId, images }: EditPhotoManagerProps) {
  const router = useRouter();
  const [processingIndex, setProcessingIndex] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const normalizedImages = images.map((image) => getPhotoFileName(image));

  async function handleDeletePhoto(index: number) {
    setProcessingIndex(index);
    setErrorMessage("");

    try {
      const response = await fetch("/api/admin/delete-image", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          propertyId: listingId,
          imageIndex: index
        })
      });

      if (!response.ok) {
        throw new Error("Unable to delete photo.");
      }

      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to delete photo.");
    } finally {
      setProcessingIndex(null);
    }
  }

  if (normalizedImages.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
        No photos available for this listing.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">Photo Manager</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">Manage Listing Images</h2>
        </div>
        <p className="text-sm text-slate-500">Delete a photo to re-index the sequence automatically.</p>
      </div>

      {errorMessage ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div> : null}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: normalizedImages.length }).map((_, index) => {
          const isProcessing = processingIndex === index;
          const imageFile = normalizedImages[index];
          const imageSrc = imageFile ? getPublicPhotoSrc(imageFile, listingId) : PLACEHOLDER_SRC;

          return (
            <div
              key={`${listingId}-${index}`}
              id={`photo-item-${index}`}
              data-automation={`photo-item-${index}`}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-3 shadow-sm"
            >
              <div className="relative overflow-hidden rounded-2xl bg-slate-100">
                <div className="relative aspect-square w-full">
                  <Image
                    src={imageSrc}
                    alt={`Image ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 50vw, 240px"
                    onError={({ currentTarget }) => {
                      currentTarget.src = PLACEHOLDER_SRC;
                    }}
                  />
                </div>

                <button
                  type="button"
                  id={`delete-photo-${index}`}
                  data-automation={`delete-photo-${index}`}
                  onClick={() => handleDeletePhoto(index)}
                  disabled={processingIndex !== null}
                  className="absolute right-3 top-3 inline-flex items-center justify-center rounded-full bg-red-600 p-2 text-white shadow-lg transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                  aria-label={`Delete image ${index + 1}`}
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                </button>

                {isProcessing ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/55">
                    <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg">Processing...</div>
                  </div>
                ) : null}
              </div>

              <div className="mt-3">
                <p data-automation={`admin-image-label-${index + 1}`} className="text-center text-xs text-slate-500">
                  Image {index + 1}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
