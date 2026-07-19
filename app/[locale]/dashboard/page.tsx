"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

const SANDBOX_DAYS = 30;

interface SandboxSkill {
  id: string;
  name: string;
  model: string;
  registeredAt: number;
}

function getSandboxDeadline(registeredAt: number) {
  return registeredAt + SANDBOX_DAYS * 86400_000;
}

function getRemaining(deadline: number) {
  const diff = deadline - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, expired: true };
  return {
    days: Math.floor(diff / 86400_000),
    hours: Math.floor((diff % 86400_000) / 3600_000),
    expired: false,
  };
}

function loadSandboxSkills(): SandboxSkill[] {
  const raw = sessionStorage.getItem("aims_sandbox_skills");
  if (raw) return JSON.parse(raw);
  // Mock defaults — simulate skills the user registered
  const defaults: SandboxSkill[] = [
    { id: "skill-1", name: "LLaMA 3.1 70B Inference", model: "llama-3.1-70b", registeredAt: Date.now() - 2 * 86400_000 },
    { id: "skill-2", name: "DeepSeek-R1 Code Audit", model: "deepseek-r1", registeredAt: Date.now() - 15 * 86400_000 },
    { id: "skill-3", name: "Stable Diffusion XL Gen", model: "sdxl-1.0", registeredAt: Date.now() - 31 * 86400_000 },
  ];
  sessionStorage.setItem("aims_sandbox_skills", JSON.stringify(defaults));
  return defaults;
}

interface Stat {
  label: string;
  value: string;
  trend?: "up" | "down";
}

export default function DashboardPage() {
  const router = useRouter();
  const t = useTranslations("DashboardPage");
  const common = useTranslations("Common");
  const [wallet, setWallet] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Per-skill sandbox state ──
  const [sandboxSkills, setSandboxSkills] = useState<SandboxSkill[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const w = sessionStorage.getItem("aims_wallet");
    const tok = sessionStorage.getItem("aims_token");
    if (!w || !tok) {
      router.push("/login");
      return;
    }
    setWallet(w);
    setSandboxSkills(loadSandboxSkills());
    setLoading(false);
  }, [router]);

  // Re-render sandbox countdowns every minute
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
        <span style={{ color: "var(--muted)" }}>{common('loading')}</span>
      </div>
    );
  }

  const stats: Stat[] = [
    { label: t('totalSettled'), value: "1,250.42 USDT", trend: "up" },
    { label: t('activeAgreements'), value: "7", trend: "up" },
    { label: t('skillsConsumed'), value: "12" },
    { label: t('reputation'), value: "4.8 / 5", trend: "up" },
  ];

  return (
    <main style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 24px" }}>
      {/* Welcome bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 40,
        }}
      >
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>
            {t('welcomeBack')}
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 14, margin: "4px 0 0" }}>
            {wallet}
          </p>
        </div>
        <span className="badge badge-green">{common('active')}</span>
      </div>

      {/* ── Per-Skill Sandbox ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 4px" }}>{t("sandboxLabel")}</h2>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>{t("sandboxPerSkillDesc")}</p>
          </div>
          <span className="badge badge-yellow" style={{ fontSize: 12 }}>
            {sandboxSkills.filter((s) => !getRemaining(getSandboxDeadline(s.registeredAt)).expired).length} {t("sandboxActive")}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {sandboxSkills.map((skill) => {
            const deadline = getSandboxDeadline(skill.registeredAt);
            const r = getRemaining(deadline);
            const endpoint = `https://sandbox.aimsgateway.com/${(wallet ?? "unknown").slice(0, 10)}/${skill.model}/relay`;

            return (
              <div
                key={skill.id}
                className="card-dark"
                style={{
                  padding: "16px 20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderLeft: r.expired ? "3px solid rgba(239,68,68,0.4)" : "3px solid rgba(14,203,129,0.4)",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>{skill.name}</span>
                    <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--muted)", padding: "1px 6px", borderRadius: 3, background: "rgba(112,122,138,0.1)" }}>{skill.model}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {r.expired ? (
                      <span style={{ fontSize: 12, color: "var(--trading-down)", fontWeight: 500 }}>{t("sandboxExpired")}</span>
                    ) : (
                      <span style={{ fontSize: 12, color: "var(--trading-up)", fontWeight: 500 }}>
                        {t("sandboxBanner", { days: r.days.toString(), hours: r.hours.toString() })}
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>·</span>
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>
                      {t("sandboxRegistered")}: {new Date(skill.registeredAt).toLocaleDateString()}
                    </span>
                  </div>
                  <code style={{
                    display: "inline-block", marginTop: 6, padding: "3px 8px", borderRadius: 4,
                    background: "var(--canvas-dark)", fontFamily: "monospace", fontSize: 11, color: "var(--primary)",
                    maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {endpoint}
                  </code>
                </div>
                <div style={{ display: "flex", gap: 8, marginLeft: 16, flexShrink: 0 }}>
                  <button
                    className="btn-secondary"
                    style={{ height: 30, fontSize: 11, whiteSpace: "nowrap" }}
                    onClick={() => {
                      navigator.clipboard.writeText(endpoint);
                      const el = document.getElementById(`copy-${skill.id}`);
                      if (el) { el.textContent = t("endpointCopied"); setTimeout(() => { el.textContent = t("copyEndpoint"); }, 2000); }
                    }}
                    id={`copy-${skill.id}`}
                  >
                    {t("copyEndpoint")}
                  </button>
                  {r.expired && (
                    <button
                      className="btn-primary"
                      style={{ height: 30, fontSize: 11, whiteSpace: "nowrap" }}
                      onClick={() => router.push(`/api-station?skill=${skill.id}`)}
                    >
                      {t("deployToProduction")}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* API Station quick-entry card */}
      <div
        className="card-dark"
        style={{
          marginBottom: 24,
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(14,203,129,0.04) 100%)",
          border: "1px solid rgba(59,130,246,0.15)",
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{t("tokenStationEntry")}</div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("tokenStationEntryDesc")}</div>
        </div>
        <button
          className="btn-primary"
          style={{ height: 32, fontSize: 12, whiteSpace: "nowrap" }}
          onClick={() => router.push("/api-station")}
        >
          {t("tokenStationEntry")} →
        </button>
      </div>

      {/* IP Vault quick-entry card */}
      <div
        className="card-dark"
        style={{
          marginBottom: 24,
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "linear-gradient(135deg, rgba(245,158,11,0.06) 0%, rgba(59,130,246,0.04) 100%)",
          border: "1px solid rgba(245,158,11,0.2)",
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{t("ipVaultCard")}</div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("ipVaultCardDesc")}</div>
        </div>
        <button
          className="btn-primary"
          style={{ height: 32, fontSize: 12, whiteSpace: "nowrap" }}
          onClick={() => router.push("/developer/ip-vault")}
        >
          {t("manageIpVault")} →
        </button>
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 40,
        }}
      >
        {stats.map((s) => (
          <div className="card-dark" key={s.label}>
            <div className="stat-number" style={{ fontSize: 32 }}>
              {s.value}
            </div>
            <div className="stat-label">
              {s.label}
              {s.trend === "up" && (
                <span style={{ color: "var(--trading-up)", marginLeft: 6 }}>
                  {s.label === t('totalSettled') ? "+12.8%" : s.label === t('activeAgreements') ? "+5.2%" : s.label === t('reputation') ? "+0.6" : "+1.8%"}
                </span>
              )}
              {s.trend === "down" && (
                <span style={{ color: "var(--trading-down)", marginLeft: 6 }}>
                  -1.2%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions + Recent activity (2-col) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
          marginBottom: 40,
        }}
      >
        {/* Quick actions */}
        <div className="card-dark">
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 20px" }}>
            {t('quickActions')}
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            <button
              className="btn-secondary"
              onClick={() => router.push("/marketplace")}
            >
              {t('browseMarketplace')}
            </button>
            <button
              className="btn-secondary"
              onClick={() => router.push("/developer/register")}
            >
              {t('registerSkill')}
            </button>
            <button
              className="btn-secondary"
              onClick={() => router.push("/agreements")}
            >
              {t('createAgreement')}
            </button>
            <button
              className="btn-secondary"
              onClick={() => router.push("/api-station")}
            >
              {t('tokenStationEntry')}
            </button>
          </div>
        </div>

        {/* Recent settlements */}
        <div className="card-dark">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>
              {t('recentSettlements')}
            </h2>
            <button
              className="text-link"
              onClick={() => router.push("/settlements")}
            >
              {common('viewAll')}
            </button>
          </div>
          <table className="table-dark">
            <thead>
              <tr>
                <th>{t('task')}</th>
                <th>{t('amount')}</th>
                <th>{common('status')}</th>
                <th>{t('time')}</th>
              </tr>
            </thead>
            <tbody>
              {[
                { task: "LLM Inference #A1B2", amount: "4.20 USDT", status: "Complete", time: "2m ago" },
                { task: "Image Gen #C3D4", amount: "1.50 USDT", status: "Complete", time: "15m ago" },
                { task: "Code Audit #E5F6", amount: "8.00 USDT", status: "Pending", time: "1h ago" },
                { task: "TTS #G7H8", amount: "0.80 USDT", status: "Complete", time: "3h ago" },
              ].map((row, i) => (
                <tr key={i}>
                  <td style={{ fontFamily: "monospace", fontSize: 13 }}>
                    {row.task}
                  </td>
                  <td style={{ fontFamily: "monospace" }}>{row.amount}</td>
                  <td>
                    <span
                      className={
                        row.status === "Complete"
                          ? "badge badge-green"
                          : "badge badge-yellow"
                      }
                    >
                      {row.status === "Complete" ? common("complete") : common("pending")}
                    </span>
                  </td>
                  <td style={{ color: "var(--muted)", fontSize: 13 }}>
                    {row.time}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Agreements */}
      <div className="card-dark">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>
            {t('activeAgreementsTitle')}
          </h2>
          <button
            className="btn-primary"
            style={{ height: 36, padding: "0 20px" }}
            onClick={() => router.push("/agreements")}
          >
            {t('newAgreement')}
          </button>
        </div>
        <table className="table-dark">
          <thead>
            <tr>
              <th>{t('agreementID')}</th>
              <th>{t('counterparty')}</th>
              <th>{t('value')}</th>
              <th>{common('status')}</th>
              <th>{t('expires')}</th>
              <th>{common('action')}</th>
            </tr>
          </thead>
          <tbody>
            {[
              {
                id: "AGR-001",
                party: "0x3C44...93BC",
                value: "500 USDT",
                status: "Active",
                expires: "Block #12.5M",
              },
              {
                id: "AGR-002",
                party: "0x90F7...b906",
                value: "200 USDT",
                status: "Locked",
                expires: "Block #12.4M",
              },
              {
                id: "AGR-003",
                party: "0x15d3...6A65",
                value: "1,000 USDT",
                status: "Active",
                expires: "Block #12.6M",
              },
            ].map((agr, i) => (
              <tr key={i}>
                <td style={{ fontFamily: "monospace" }}>{agr.id}</td>
                <td style={{ fontFamily: "monospace", fontSize: 13 }}>
                  {agr.party}
                </td>
                <td style={{ fontFamily: "monospace" }}>{agr.value}</td>
                <td>
                  <span
                    className={
                      agr.status === "Active"
                        ? "badge badge-green"
                        : "badge badge-yellow"
                    }
                  >
                    {agr.status === "Active" ? common("active") : common("locked")}
                  </span>
                </td>
                <td style={{ color: "var(--muted)", fontSize: 13 }}>
                  {agr.expires}
                </td>
                <td>
                  <button className="btn-subscribe">{common('manage')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
