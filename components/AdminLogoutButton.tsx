"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { getDictionary } from "@/lib/locale";

type AdminLogoutButtonProps = {
  className?: string;
};

export function AdminLogoutButton({ className = "" }: AdminLogoutButtonProps) {
  const t = getDictionary();

  return (
    <button
      id="logout-button"
      data-automation="logout-button"
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 ${className}`}
    >
      <LogOut className="h-4 w-4" />
      {t.adminPage.logoutButton}
    </button>
  );
}
