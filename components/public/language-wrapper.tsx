"use client";

import { useLanguageStore } from "@/store/language";

export function LanguageWrapper({ children }: { children: React.ReactNode }) {
  const lang = useLanguageStore((s) => s.lang);
  const isAr = lang === "ar";

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      lang={isAr ? "ar" : "en"}
      className={isAr ? "font-arabic" : ""}
    >
      {children}
    </div>
  );
}
