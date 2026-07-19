"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";

import { TRUSTED_ADMIN } from "@/shared/admin-wallet";

// If NEXT_PUBLIC_ADMIN_WALLET is set but differs from TRUSTED_ADMIN, access is denied (tamper detection).
const ENV_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET || "";
const TAMPERED = ENV_WALLET && ENV_WALLET.toLowerCase() !== TRUSTED_ADMIN.toLowerCase();

interface NavItem {
  key: string;
  href: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", href: "/admin", icon: "📊" },
  { key: "apiConfig", href: "/admin/api-config", icon: "🔌" },
  { key: "transactions", href: "/admin/transactions", icon: "💰" },
  { key: "pricing", href: "/admin/pricing", icon: "💲" },
  { key: "forum", href: "/admin/forum", icon: "📝" },
  { key: "delegation", href: "/admin/delegation", icon: "👥" },

  { key: "alliance", href: "/admin/alliance", icon: "💼" },
  { key: "ipVault", href: "/admin/ip-vault", icon: "🛡️" },
  { key: "workers", href: "/admin/workers", icon: "👷" },
  { key: "china", href: "/admin/relay/china", icon: "🇨🇳" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("AdminPage");
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [wallet, setWallet] = useState("");

  useEffect(() => {
    const w = sessionStorage.getItem("aims_wallet");
    const tok = sessionStorage.getItem("aims_token");
    if (!w || !tok) {
      router.push("/login");
      return;
    }
    setWallet(w);
    if (TAMPERED || w.toLowerCase() !== TRUSTED_ADMIN.toLowerCase()) {
      setAuthorized(false);
      return;
    }
    setAuthorized(true);
  }, [router]);

  if (authorized === null) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "var(--canvas-dark)", color: "var(--muted)" }}>
        {t("loading")}
      </div>
    );
  }

  if (!authorized) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "var(--canvas-dark)" }}>
        <div className="card-dark" style={{ maxWidth: 480, padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>{t("accessDenied")}</h2>
          <p style={{ color: "var(--muted)", fontSize: 14, margin: "0 0 8px", lineHeight: 1.6 }}>
            {t("accessDeniedDesc")}
          </p>
          <code style={{ fontSize: 12, padding: "4px 10px", borderRadius: 4, background: "rgba(239,68,68,0.1)", color: "var(--trading-down)", fontFamily: "monospace", wordBreak: "break-all" }}>
            {wallet}
          </code>
          <div style={{ marginTop: 20 }}>
            <button className="btn-secondary" onClick={() => router.push("/")}>{t("backToHome")}</button>
          </div>
        </div>
      </div>
    );
  }

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin" || pathname === "/admin/";
    return pathname?.startsWith(href);
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--canvas-dark)" }}>
      {/* Sidebar */}
      <aside style={{
        width: 240,
        flexShrink: 0,
        background: "rgba(0,0,0,0.3)",
        borderRight: "1px solid var(--hairline-on-dark)",
        display: "flex",
        flexDirection: "column",
        padding: "20px 0",
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{ padding: "0 20px 20px", borderBottom: "1px solid var(--hairline-on-dark)", marginBottom: 12 }}>
          <Link href="/admin" style={{ textDecoration: "none" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--primary)", letterSpacing: "-0.5px" }}>
              AIMS {t("admin")}
            </div>
          </Link>
          <div style={{ fontSize: 11, fontFamily: "monospace", color: "var(--muted)", marginTop: 6, wordBreak: "break-all" }}>
            {wallet.slice(0, 6)}...{wallet.slice(-4)}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "0 12px" }}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: isActive(item.href) ? 600 : 400,
                color: isActive(item.href) ? "var(--primary)" : "var(--muted)",
                background: isActive(item.href) ? "rgba(252,213,53,0.08)" : "transparent",
                textDecoration: "none",
                transition: "background 0.15s, color 0.15s",
                marginBottom: 2,
              }}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {t(item.key as "dashboard" | "apiConfig" | "transactions" | "pricing" | "forum" | "delegation" | "relay" | "alliance" | "ipVault" | "workers" | "china")}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: "16px 20px 0", borderTop: "1px solid var(--hairline-on-dark)", fontSize: 11, color: "var(--muted)" }}>
          <button
            className="text-link"
            style={{ fontSize: 11 }}
            onClick={() => {
              sessionStorage.removeItem("aims_token");
              sessionStorage.removeItem("aims_wallet");
              router.push("/login");
            }}
          >
            {t("logout")}
          </button>
        </div>
      </aside>

      {/* Content */}
      <main style={{ flex: 1, minWidth: 0, padding: "32px", overflow: "auto" }}>
        {children}
      </main>
    </div>
  );
}
