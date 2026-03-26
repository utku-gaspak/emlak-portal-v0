"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

type ViewCountTrackerProps = {
  listingId: string;
};

export function ViewCountTracker({ listingId }: ViewCountTrackerProps) {
  const hasTracked = useRef(false);
  const router = useRouter();

  useEffect(() => {
    if (hasTracked.current) {
      return;
    }

    const storageKey = `view-count-tracked:${listingId}`;

    if (typeof window !== "undefined" && window.sessionStorage.getItem(storageKey) === "1") {
      hasTracked.current = true;
      return;
    }

    hasTracked.current = true;

    (async () => {
      try {
        await supabaseBrowser.rpc("increment_view_count", { row_id: listingId } as never);
      } catch {
        await fetch(`/api/listings/${listingId}/view`, {
          method: "POST"
        });
      } finally {
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(storageKey, "1");
        }
        router.refresh();
      }
    })();
  }, [listingId, router]);

  return null;
}
