"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/context/TranslationContext";

type DeleteListingButtonProps = {
  listingId: string;
};

export function DeleteListingButton({ listingId }: DeleteListingButtonProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(t.deleteListing.confirm);

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/delete-listing/${listingId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? t.errors.deleteFailed);
      }

      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : t.errors.deleteFailed);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <button
      id={`delete-button-${listingId}`}
      data-automation={`delete-button-${listingId}`}
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className="rounded-full bg-red-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {isDeleting ? t.deleteListing.deleting : t.deleteListing.button}
    </button>
  );
}
