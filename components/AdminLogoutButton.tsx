"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { useTranslation } from "@/context/TranslationContext";

type AdminLogoutButtonProps = {
  className?: string;
};

export function AdminLogoutButton({ className = "" }: AdminLogoutButtonProps) {
  const { t } = useTranslation();

  return (
    <button
      id="logout-button"
      data-automation="logout-button"
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-900/60 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-950/30 ${className}`}
    >
      <LogOut className="h-4 w-4" />
      {t.adminPage.logoutButton}
    </button>
  );
}
