"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function FaqPage() {
  const t = useTranslations("FaqPage");

  const items = Array.from({ length: 8 }, (_, i) => i + 1);

  return (
    <main style={{ maxWidth: 700, margin: "0 auto", padding: "48px 24px" }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>{t("title")}</h1>
      <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.7, marginBottom: 36 }}>
        {t("description")}
      </p>

      {items.map((i) => (
        <div key={`q${i}`} style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{t(`q${i}` as any)}</h3>
          <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>{t(`a${i}` as any)}</p>
        </div>
      ))}
    </main>
  );
}
