"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { usePathname, useRouter, Link, locales, type Locale } from "@/i18n/navigation";
import ForumModal from "./ForumModal";

const langLabels: Record<Locale, string> = {
  en: "English",
  zh: "中文",
  ja: "日本語",
  de: "Deutsch",
  fr: "Français",
};

export default function TopNav() {
  const t = useTranslations("TopNav");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [wallet, setWallet] = useState<string | null>(null);
  const [showLang, setShowLang] = useState(false);
  const [showForum, setShowForum] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const w = sessionStorage.getItem("aims_wallet");
    setWallet(w);
    const raw = sessionStorage.getItem("aims_cart");
    if (raw) {
      const items = JSON.parse(raw) as { quantity: number }[];
      setCartCount(items.reduce((s, i) => s + i.quantity, 0));
    }
  }, [pathname]);

  const handleLogout = () => {
    sessionStorage.removeItem("aims_token");
    sessionStorage.removeItem("aims_wallet");
    setWallet(null);
    router.push("/");
  };

  const isActive = (path: string) =>
    pathname === path || pathname?.startsWith(path + "/");

  return (
    <nav
      style={{
        height: 64,
        background: "var(--canvas-dark)",
        borderBottom: "1px solid var(--hairline-on-dark)",
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        position: "sticky",
        top: 0,
        zIndex: 50,
        gap: 32,
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: "var(--primary)",
          textDecoration: "none",
          letterSpacing: "-0.5px",
        }}
      >
        {t("logo")}
      </Link>

      {/* Nav links */}
      <div className="mobile-nav-scroll" style={{ display: "flex", gap: 24, fontSize: 14, fontWeight: 500, alignItems: "center" }}>
        <Link
          href="/marketplace"
          style={{
            color: isActive("/marketplace") ? "var(--primary)" : "var(--muted)",
            textDecoration: "none",
          }}
        >
          {t("marketplace")}
        </Link>
        <button
          onClick={() => (wallet ? router.push("/route") : router.push("/login"))}
          style={{
            color: isActive("/route") ? "var(--primary)" : "var(--muted)",
            fontSize: 14,
            fontWeight: 500,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          {t("trading")}
        </button>
        <button
          onClick={() => (wallet ? setShowForum(true) : router.push("/login"))}
          style={{
            color: showForum ? "var(--primary)" : "var(--muted)",
            fontSize: 14,
            fontWeight: 500,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
          data-testid="topnav-forum"
        >
          {t("forum")}
        </button>
        {wallet && (
          <>
            <Link
              href="/api-station"
              style={{
                color: isActive("/api-station") ? "var(--primary)" : "var(--muted)",
                textDecoration: "none",
              }}
            >
              {t("apiStation")}
            </Link>
            <Link
              href="/developer/alliance"
              style={{
                color: isActive("/developer/alliance") ? "var(--primary)" : "var(--muted)",
                textDecoration: "none",
              }}
            >
              {t("developerAlliance")}
            </Link>
            <Link
              href="/reseller/alliance"
              style={{
                color: isActive("/reseller/alliance") ? "var(--primary)" : "var(--muted)",
                textDecoration: "none",
              }}
            >
              {t("resellerAlliance")}
            </Link>
          </>
        )}
      </div>

      {/* Language Switcher */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setShowLang(!showLang)}
          className="btn-secondary"
          style={{ height: 36, padding: "0 12px", fontSize: 13, minWidth: 44 }}
        >
          {locale.toUpperCase()}
        </button>
        {showLang && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              right: 0,
              marginTop: 4,
              background: "var(--surface-card-dark)",
              border: "1px solid var(--hairline-on-dark)",
              borderRadius: 8,
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              zIndex: 100,
              minWidth: 140,
              overflow: "hidden",
            }}
          >
            {locales.map((l) => (
              <button
                key={l}
                onClick={() => {
                  router.replace(pathname, { locale: l });
                  setShowLang(false);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "8px 16px",
                  textAlign: "left",
                  fontSize: 13,
                  background:
                    l === locale
                      ? "rgba(252,213,53,0.1)"
                      : "transparent",
                  color:
                    l === locale ? "var(--primary)" : "var(--body)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {langLabels[l]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right side */}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
        {/* Cart */}
        <button
          onClick={() => (wallet ? router.push("/route") : router.push("/login"))}
          style={{
            position: "relative",
            color: "var(--muted)",
            background: "none",
            border: "none",
            textDecoration: "none",
            fontSize: 13,
            fontWeight: 500,
            padding: "4px 8px",
            cursor: "pointer",
          }}
        >
          {t("cart")}
          {cartCount > 0 && (
            <span style={{
              position: "absolute", top: -2, right: -2,
              background: "var(--primary)", color: "#000",
              fontSize: 10, fontWeight: 700, minWidth: 16, height: 16,
              borderRadius: 8, display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}>
              {cartCount}
            </span>
          )}
        </button>
        {wallet ? (
          <>
            <span style={{ fontSize: 12, color: "var(--muted)", fontFamily: "monospace" }}>
              {wallet.slice(0, 6)}...{wallet.slice(-4)}
            </span>
            <button onClick={() => router.push("/profile")} className="btn-secondary" style={{ padding: "6px 14px", fontSize: 13, height: 32 }}>
              {t("settings")}
            </button>
            <button onClick={handleLogout} className="btn-secondary" style={{ padding: "6px 16px", fontSize: 13, height: 32 }}>
              {t("disconnect")}
            </button>
          </>
        ) : (
          <button onClick={() => router.push("/login")} className="btn-primary" style={{ height: 36, padding: "0 20px" }}>
            {t("connectWallet")}
          </button>
        )}
      </div>
      <ForumModal open={showForum} onClose={() => setShowForum(false)} />
    </nav>
  );
}
