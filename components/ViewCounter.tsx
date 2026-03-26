"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type ViewCounterProps = {
  id: string;
};

export function ViewCounter({ id }: ViewCounterProps) {
  const hasTrackedRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    if (!id || hasTrackedRef.current) {
      return;
    }

    const storageKey = `view-count-tracked:${id}`;

    if (typeof window !== "undefined" && window.sessionStorage.getItem(storageKey) === "1") {
      hasTrackedRef.current = true;
      return;
    }

    hasTrackedRef.current = true;

    (async () => {
      try {
        const response = await fetch(`/api/listings/${id}/view`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          cache: "no-store"
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("ViewCounter route error:", errorText);
          return;
        }

        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(storageKey, "1");
        }

        console.log("ViewCounter route success:", id);
        router.refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown view counter error";
        console.error("ViewCounter unexpected error:", message);
      }
    })();
  }, [id, router]);

  return null;
}
