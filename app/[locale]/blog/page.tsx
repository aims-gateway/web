"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function BlogPage() {
  const t = useTranslations("BlogPage");

  const posts = [
    { key: "post1", date: "2026-07-01" },
    { key: "post2", date: "2026-06-20" },
  ];

  return (
    <main style={{ maxWidth: 700, margin: "0 auto", padding: "48px 24px" }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>{t("title")}</h1>
      <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.7, marginBottom: 32 }}>
        {t("description")}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {posts.map((post) => (
          <div key={post.key} className="card-dark" style={{ padding: "18px 22px" }}>
            <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>{post.date}</div>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 6px" }}>{t(`${post.key}Title` as any)}</h3>
            <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>{t(`${post.key}Excerpt` as any)}</p>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 32, textAlign: "center" }}>
        {t("morePostsBefore")}{" "}
        <a href="https://twitter.com/aims_v2" style={{ color: "var(--primary)" }}>{t("twitterAlt")}</a>
        {t("morePostsAfter")}
      </p>
    </main>
  );
}
