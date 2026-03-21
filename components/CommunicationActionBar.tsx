"use client";

import { useState } from "react";
import { MessageCircle, Phone, Share2, Check } from "lucide-react";
import { getCallHref, getWhatsAppHref } from "@/lib/contact-links";

type CommunicationActionBarProps = {
  listingTitle: string;
};

export function CommunicationActionBar({ listingTitle }: CommunicationActionBarProps) {
  const [shareState, setShareState] = useState<"idle" | "copied" | "error">("idle");
  const whatsappHref = getWhatsAppHref(listingTitle);
  const callHref = getCallHref();

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
    <div className="sticky bottom-4 z-30 mx-auto w-full max-w-3xl rounded-3xl border border-slate-200 bg-white/95 p-3 shadow-2xl backdrop-blur lg:static lg:bottom-auto">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <a
          id="whatsapp-button"
          data-automation="whatsapp-button"
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(16,185,129,0.25)] transition hover:-translate-y-0.5 hover:bg-emerald-700"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </a>

        <a
          id="call-button"
          data-automation="call-button"
          href={callHref}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(15,23,42,0.2)] transition hover:-translate-y-0.5 hover:bg-slate-800"
        >
          <Phone className="h-4 w-4" />
          Call
        </a>

        <button
          id="share-button"
          data-automation="share-button"
          type="button"
          onClick={handleShare}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-800 shadow-[0_16px_40px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:bg-slate-200"
        >
          {shareState === "copied" ? <Check className="h-4 w-4 text-emerald-600" /> : <Share2 className="h-4 w-4" />}
          {shareState === "copied" ? "Copied" : shareState === "error" ? "Copy Failed" : "Share"}
        </button>
      </div>
    </div>
  );
}
