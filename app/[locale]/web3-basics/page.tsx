"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function Web3BasicsPage() {
  const t = useTranslations("Web3BasicsPage");

  const items = Array.from({ length: 8 }, (_, i) => i);

  return (
    <main style={{ maxWidth: 700, margin: "0 auto", padding: "48px 24px" }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>{t("title")}</h1>
      <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.7, marginBottom: 36 }}>
        {t("description")}
      </p>

      {items.map((i) => (
        <div key={`item${i}`} style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{t(`item${i}Title` as any)}</h3>
          <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>{t(`item${i}Desc` as any)}</p>
        </div>
      ))}

      <div style={{ marginTop: 32, padding: 20, borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid var(--hairline-on-dark)", textAlign: "center" }}>
        <Link href="/docs/contracts" style={{ color: "var(--primary)", fontSize: 14 }}>
          {t("ctaLink")}
        </Link>
      </div>
    </main>
  );
}
