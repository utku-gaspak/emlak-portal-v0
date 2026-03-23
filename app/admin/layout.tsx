import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getFirmName } from "@/lib/brand";
import { getDictionary } from "@/lib/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  const firmName = getFirmName();

  return {
    title: `${t.adminPage.eyebrow} | ${firmName}`,
    description: t.adminPage.description
  };
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
