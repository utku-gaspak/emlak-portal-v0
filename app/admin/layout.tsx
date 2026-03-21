import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getDictionary } from "@/lib/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const t = getDictionary();

  return {
    title: `${t.adminPage.eyebrow} | ${t.siteHeader.brandName}`,
    description: t.adminPage.description
  };
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
