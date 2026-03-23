"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

type ViewCounterProps = {
  id: string;
};

export function ViewCounter({ id }: ViewCounterProps) {
  const router = useRouter();

  useEffect(() => {
    if (!id) {
      return;
    }

    const supabase = createClientComponentClient();
    let cancelled = false;
    const storageKey = `view-count-tracked:${id}`;

    if (typeof window !== "undefined" && window.sessionStorage.getItem(storageKey) === "1") {
      return;
    }

    (async () => {
      try {
        const { error } = await supabase.rpc("increment_view_count", {
          row_id: id
        });

        if (error) {
          console.error("ViewCounter RPC error:", error.message);
          const fallbackResponse = await fetch(`/api/listings/${id}/view`, {
            method: "POST"
          });

          if (!fallbackResponse.ok) {
            const fallbackText = await fallbackResponse.text();
            console.error("ViewCounter fallback error:", fallbackText);
            return;
          }

          if (!cancelled) {
            console.log("ViewCounter fallback success:", id);
          }
        } else if (!cancelled) {
          console.log("ViewCounter RPC success:", id);
        }

        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(storageKey, "1");
        }

        router.refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown view counter error";
        console.error("ViewCounter unexpected error:", message);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, router]);

  return null;
}
