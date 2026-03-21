import type { Metadata } from "next";
import "@/app/globals.css";
import { Footer } from "@/components/Footer";
import { getDictionary } from "@/lib/locale";

const t = getDictionary();

export const metadata: Metadata = {
  title: t.meta.title,
  description: t.meta.description
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={t.meta.lang}>
      <body>
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
