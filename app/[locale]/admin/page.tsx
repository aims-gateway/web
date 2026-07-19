"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

interface DashboardStat {
  key: string;
  value: string;
  trend: string;
  icon: string;
}

export default function AdminDashboardPage() {
  const t = useTranslations("AdminPage");
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [recentLogins, setRecentLogins] = useState<{wallet:string; time:string; action:string}[]>([]);

  useEffect(() => {
    setStats([
      { key: "totalUsers", value: "1,284", trend: "+12%", icon: "👥" },
      { key: "totalTransactions", value: "45,832", trend: "+8.5%", icon: "💰" },
      { key: "totalRevenue", value: "$128,450.50", trend: "+15.2%", icon: "📈" },
      { key: "activeApis", value: "34", trend: "+3", icon: "🔌" },
      { key: "forumTopics", value: "892", trend: "+24", icon: "📝" },
      { key: "totalSkills", value: "156", trend: "+6", icon: "⚡" },
    ]);

    setRecentLogins([
      { wallet: "0x3C44...93BC", time: "2 min ago", action: t("actionLogin") },
      { wallet: "0x90F7...b906", time: "5 min ago", action: t("actionPurchase") },
      { wallet: "0x15d3...6A65", time: "8 min ago", action: t("actionRegister") },
      { wallet: "0xf39F...2266", time: "12 min ago", action: t("actionApiCall") },
      { wallet: "0x7099...79C8", time: "15 min ago", action: t("actionLogin") },
      { wallet: "0xA1B2...C3D4", time: "18 min ago", action: t("actionSettlement") },
      { wallet: "0xE5F6...G7H8", time: "22 min ago", action: t("actionForum") },
    ]);
  }, [t]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 4px" }}>{t("dashboard")}</h1>
          <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>{t("dashboardDesc")}</p>
        </div>
        <span className="badge badge-green" style={{ fontSize: 13, padding: "6px 14px" }}>● {t("systemOnline")}</span>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
        {stats.map((s) => (
          <div key={s.key} className="card-dark" style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <span style={{ fontSize: 24 }}>{s.icon}</span>
              <span style={{ fontSize: 11, color: s.trend.startsWith("+") ? "var(--trading-up)" : "var(--muted)", fontWeight: 600 }}>
                {s.trend}
              </span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "monospace", marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>{t(s.key as "totalUsers" | "totalTransactions" | "totalRevenue" | "activeApis" | "forumTopics" | "totalSkills")}</div>
          </div>
        ))}
      </div>

      {/* Two column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Recent activity */}
        <div className="card-dark" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px" }}>{t("recentActivity")}</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {recentLogins.map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < recentLogins.length - 1 ? "1px solid var(--hairline-on-dark)" : "none" }}>
                <div>
                  <span style={{ fontFamily: "monospace", fontSize: 13 }}>{r.wallet}</span>
                  <span style={{ marginLeft: 10, fontSize: 12, color: "var(--muted)" }}>{r.action}</span>
                </div>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>{r.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="card-dark" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px" }}>{t("quickActions")}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { key: "addApiProvider", href: "/admin/api-config", icon: "🔌" },
              { key: "adjustPricing", href: "/admin/pricing", icon: "💲" },
              { key: "reviewForum", href: "/admin/forum", icon: "📝" },
              { key: "manageDelegation", href: "/admin/delegation", icon: "👥" },
              { key: "viewTransactions", href: "/admin/transactions", icon: "💰" },
              { key: "manageWorkers", href: "/admin/workers", icon: "👷" },
            ].map((a) => (
              <button key={a.key} className="btn-secondary" style={{ height: 44, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                onClick={() => router.push(a.href)}>
                <span>{a.icon}</span> {t(a.key as "addApiProvider" | "adjustPricing" | "reviewForum" | "manageDelegation" | "viewTransactions" | "manageWorkers")}
              </button>
            ))}
          </div>

          {/* System health */}
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: "20px 0 12px" }}>{t("systemHealth")}</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { label: t("apiServer"), status: "ok", value: "http://localhost:8003" },
              { label: t("relayService"), status: "ok", value: t("running") },
              { label: t("dbStatus"), status: "ok", value: "PostgreSQL 16" },
              { label: t("redisStatus"), status: "ok", value: "Redis 7.2" },
              { label: t("forumWebhook"), status: "ok", value: t("connected") },
            ].map((h) => (
              <div key={h.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                <span style={{ color: "var(--muted)" }}>{h.label}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: "var(--trading-up)" }}></span>
                  {h.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
