"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

interface FooterCol {
  title: string;
  links: FooterLink[];
}

export default function Footer() {
  const t = useTranslations("HomePage");

  const footerCols: FooterCol[] = [
    {
      title: t("footer.columns.0.title"),
      links: [
        { label: t("footer.columns.0.links.0"), href: "/" },
        { label: t("footer.columns.0.links.1"), href: "/" },
        { label: t("footer.columns.0.links.2"), href: "/" },
        { label: t("footer.columns.0.links.3"), href: "/" },
      ],
    },
    {
      title: t("footer.columns.1.title"),
      links: [
        { label: t("footer.columns.1.links.0"), href: "/docs/api" },
        { label: t("footer.columns.1.links.1"), href: "/docs/sdk" },
        { label: t("footer.columns.1.links.2"), href: "/docs/contracts" },
        { label: t("footer.columns.1.links.3"), href: "#", external: true },
      ],
    },
    {
      title: t("footer.columns.2.title"),
      links: [
        { label: t("footer.columns.2.links.0"), href: "/marketplace" },
        { label: t("footer.columns.2.links.1"), href: "/settlements" },
        { label: t("footer.columns.2.links.2"), href: "/api-station" },
        { label: t("footer.columns.2.links.3"), href: "/pricing" },
      ],
    },
    {
      title: t("footer.columns.3.title"),
      links: [
        { label: t("footer.columns.3.links.0"), href: "/developer/alliance" },
        { label: t("footer.columns.3.links.1"), href: "/marketplace" },
        { label: t("footer.columns.3.links.2"), href: "/reseller/alliance" },
        { label: t("footer.columns.3.links.3"), href: "/pricing" },
      ],
    },
    {
      title: t("footer.columns.4.title"),
      links: [
        { label: t("footer.columns.4.links.0"), href: "/support" },
        { label: t("footer.columns.4.links.1"), href: "/status" },
        { label: t("footer.columns.4.links.2"), href: "/security" },
        { label: t("footer.columns.4.links.3"), href: "/privacy" },
      ],
    },
    {
      title: t("footer.columns.5.title"),
      links: [
        { label: t("footer.columns.5.links.0"), href: "/blog" },
        { label: t("footer.columns.5.links.1"), href: "/faq" },
        { label: t("footer.columns.5.links.2"), href: "/tutorials" },
        { label: t("footer.columns.5.links.3"), href: "/web3-basics" },
      ],
    },
  ];

  return (
    <footer style={{ background: "var(--canvas-dark)", borderTop: "1px solid var(--hairline-on-dark)", padding: "56px 24px 32px", fontSize: 14 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 24 }}>
        {footerCols.map((col) => (
          <div key={col.title}>
            <h4 style={{ fontSize: 13, fontWeight: 600, margin: "0 0 14px", color: "var(--on-dark)" }}>
              {col.title}
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              {col.links.map((link) => (
                <li key={link.label}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: 13,
                        color: "var(--muted)",
                        textDecoration: "none",
                        transition: "color 0.15s",
                      }}
                      onMouseEnter={(e) => { (e.target as HTMLElement).style.color = "var(--primary)"; }}
                      onMouseLeave={(e) => { (e.target as HTMLElement).style.color = "var(--muted)"; }}
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      style={{
                        fontSize: 13,
                        color: "var(--muted)",
                        textDecoration: "none",
                        transition: "color 0.15s",
                      }}
                      onMouseEnter={(e) => { (e.target as HTMLElement).style.color = "var(--primary)"; }}
                      onMouseLeave={(e) => { (e.target as HTMLElement).style.color = "var(--muted)"; }}
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div style={{ maxWidth: 1100, margin: "36px auto 0", paddingTop: 20, borderTop: "1px solid var(--hairline-on-dark)", fontSize: 12, color: "var(--muted)", textAlign: "center" }}>
        {t("footer.copyright", { year: new Date().getFullYear() })}
      </div>
    </footer>
  );
}
