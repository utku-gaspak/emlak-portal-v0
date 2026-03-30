"use client";

import { useState } from "react";
import { MessageCircle, Phone, Share2, Check } from "lucide-react";
import { getCallHref, getPropertyWhatsAppHref } from "@/lib/contact-links";
import type { Locale } from "@/lib/i18n-data";
import { useTranslation } from "@/context/TranslationContext";

type CommunicationActionBarProps = {
  listingTitle: string;
  listingNo: string | number;
  locale: Locale;
};

export function CommunicationActionBar({ listingTitle, listingNo, locale }: CommunicationActionBarProps) {
  const { t } = useTranslation();
  const [shareState, setShareState] = useState<"idle" | "copied" | "error">("idle");
  const whatsappHref = getPropertyWhatsAppHref(listingTitle, listingNo, locale);
  const callHref = getCallHref();
  const availableActions = [whatsappHref, callHref, "share"].filter(Boolean).length;

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareState("copied");
      window.setTimeout(() => setShareState("idle"), 1800);
    } catch {
      setShareState("error");
      window.setTimeout(() => setShareState("idle"), 2200);
    }
  }

    return (
      <div className="sticky bottom-4 z-30 mx-auto w-full max-w-3xl rounded-3xl border border-slate-200 bg-white/95 p-3 shadow-2xl backdrop-blur lg:static lg:bottom-auto dark:border-slate-800 dark:bg-slate-900/90">
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns:
              availableActions >= 3 ? "repeat(3, minmax(0, 1fr))" : availableActions === 2 ? "repeat(2, minmax(0, 1fr))" : "minmax(0, 1fr)"
          }}
        >
          {whatsappHref ? (
            <a
              id="whatsapp-button"
              data-automation="whatsapp-button"
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(16,185,129,0.25)] transition hover:-translate-y-0.5 hover:bg-emerald-700 dark:shadow-[0_16px_40px_rgba(16,185,129,0.18)]"
            >
              <MessageCircle className="h-4 w-4" />
              {t.communication.whatsapp}
            </a>
          ) : null}

          {callHref ? (
            <a
              id="call-button"
              data-automation="call-button"
              href={callHref}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(15,23,42,0.2)] transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              <Phone className="h-4 w-4" />
              {t.communication.call}
            </a>
          ) : null}

          <button
            id="share-button"
            data-automation="share-button"
            type="button"
            onClick={handleShare}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-800 shadow-[0_16px_40px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            {shareState === "copied" ? <Check className="h-4 w-4 text-emerald-600" /> : <Share2 className="h-4 w-4" />}
            {shareState === "copied" ? t.communication.copied : shareState === "error" ? t.communication.copyFailed : t.communication.share}
          </button>
        </div>
      </div>
    );
}
