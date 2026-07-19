"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function TutorialsPage() {
  const t = useTranslations("TutorialsPage");

  const tutorials = [
    { key: "t0", links: [{ labelKey: "t0Link1", href: "/api-station" }, { labelKey: "t0Link2", href: "/docs/sdk" }] },
    { key: "t1", links: [{ labelKey: "t1Link1", href: "/developer/ip-vault" }, { labelKey: "t1Link2", href: "/docs/contracts" }] },
    { key: "t2", links: [{ labelKey: "t2Link1", href: "/reseller/alliance" }, { labelKey: "t2Link2", href: "/pricing" }] },
    { key: "t3", links: [{ labelKey: "t3Link1", href: "/agreements" }, { labelKey: "t3Link2", href: "/marketplace" }] },
  ];

  return (
    <main style={{ maxWidth: 700, margin: "0 auto", padding: "48px 24px" }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>{t("title")}</h1>
      <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.7, marginBottom: 36 }}>
        {t("description")}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {tutorials.map((tutorial) => (
          <div key={tutorial.key} className="card-dark" style={{ padding: "18px 22px" }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{t(`${tutorial.key}Title` as any)}</h3>
            <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginBottom: 12 }}>{t(`${tutorial.key}Desc` as any)}</p>
            <div style={{ display: "flex", gap: 8 }}>
              {tutorial.links.map((link) => (
                <Link key={link.href} href={link.href} className="btn-secondary" style={{ padding: "4px 12px", fontSize: 11, textDecoration: "none" }}>
                  {t(link.labelKey as any)}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
