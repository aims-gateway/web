"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

interface AttestationApproval {
  skillId: string;
  skillName: string;
  developer: string;
  currentLevel: string;
  appliedAt: string;
  l2Duration: string;
  historyDisputes: number;
}

interface IssuedCert {
  certId: string;
  skill: string;
  level: string;
  issueDate: string;
  status: "valid" | "revoked";
}

interface NotaryProvider {
  name: string;
  serviceType: string;
  status: "normal" | "degraded" | "down";
  uptime: string;
  monthlyCalls: number;
}

export default function AdminIpVaultPage() {
  const t = useTranslations("AdminIpVaultPage");
  const common = useTranslations("Common");
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [approvalFilter, setApprovalFilter] = useState("pending");

  // Modals
  const [approvalDetail, setApprovalDetail] = useState<AttestationApproval | null>(null);
  const [revokeCert, setRevokeCert] = useState<IssuedCert | null>(null);
  const [revokeReason, setRevokeReason] = useState("");

  const pendingApprovals: AttestationApproval[] = [
    { skillId: "1", skillName: "LLaMA 3.1 70B", developer: "0x3C44...93BC", currentLevel: "L2", appliedAt: "2026-07-09", l2Duration: "35 days", historyDisputes: 0 },
    { skillId: "2", skillName: "SD XL", developer: "0x90F7...b906", currentLevel: "L2", appliedAt: "2026-07-08", l2Duration: "60 days", historyDisputes: 0 },
    { skillId: "3", skillName: "Claude Fine-tuned", developer: "0xABCD...EF01", currentLevel: "L1", appliedAt: "2026-07-07", l2Duration: "—", historyDisputes: 0 },
  ];

  const issuedCerts: IssuedCert[] = [
    { certId: "AIMS-IPV-20260709-00042", skill: "LLaMA 3.1", level: "L2", issueDate: "2026-07-09", status: "valid" },
    { certId: "AIMS-IPV-20250315-00008", skill: "GPT-4o FT", level: "L3", issueDate: "2025-03-15", status: "valid" },
    { certId: "AIMS-IPV-20260201-00012", skill: "Fraud Skill", level: "L1", issueDate: "2026-02-01", status: "revoked" },
  ];

  const notaryProviders: NotaryProvider[] = [
    { name: "eIDAS TS", serviceType: "EU Timestamp", status: "normal", uptime: "99.9%", monthlyCalls: 1245 },
    { name: "China Judicial Chain", serviceType: "China Notary", status: "normal", uptime: "99.5%", monthlyCalls: 890 },
    { name: "US Notary", serviceType: "US E-Notary", status: "normal", uptime: "99.8%", monthlyCalls: 567 },
    { name: "Japan TS", serviceType: "Japan Timestamp", status: "degraded", uptime: "95.2%", monthlyCalls: 234 },
  ];

  useEffect(() => {
    if (!sessionStorage.getItem("aims_wallet")) { router.push("/login"); return; }
    setLoading(false);
  }, [router]);

  if (loading) return <div style={{ padding: 80, textAlign: "center", color: "var(--muted)" }}>{common("loading")}</div>;

  const tabs = [t("tabDashboard"), t("tabApprovals"), t("tabCertificates"), t("tabFees"), t("tabNotary")];

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 24px" }}>{t("title")}</h1>

      <div style={{ display: "flex", gap: 4, marginBottom: 28, borderBottom: "1px solid var(--hairline-on-dark)", overflowX: "auto" }}>
        {tabs.map((label, i) => (
          <button
            key={i}
            onClick={() => setTab(i)}
            data-testid={`ipvault-admin-tab-${i}`}
            style={{
              padding: "10px 20px", fontSize: 13, fontWeight: tab === i ? 600 : 400,
              color: tab === i ? "var(--primary)" : "var(--muted)",
              borderBottom: tab === i ? "2px solid var(--primary)" : "2px solid transparent",
              background: "none", borderTop: "none", borderLeft: "none", borderRight: "none",
              cursor: "pointer", marginBottom: -1, whiteSpace: "nowrap",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab 0: Dashboard ── */}
      {tab === 0 && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
            {[
              { label: t("totalAttested"), value: "156" },
              { label: t("l1Count"), value: "89" },
              { label: t("l2Count"), value: "45" },
              { label: t("l3Count"), value: "22" },
            ].map((s) => (
              <div key={s.label} className="card-dark" style={{ textAlign: "center", padding: 20 }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: "var(--primary)" }}>{s.value}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
            {[
              { label: t("monthlyRevenue"), value: "$4,250.00" },
              { label: t("gasRelay"), value: "$1,245.00" },
              { label: t("arweaveStorage"), value: "$890.00" },
              { label: t("reservePool"), value: "$2,200.00" },
            ].map((s) => (
              <div key={s.label} className="card-dark" style={{ textAlign: "center", padding: 16 }}>
                <div style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 700, color: "var(--trading-up)" }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div className="card-dark" style={{ marginBottom: 24, padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px" }}>{t("revenueTrend30d")}</h3>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", alignItems: "flex-end", height: 120 }}>
              {[1200, 1450, 1320, 1680, 1890, 2100, 2250, 2400, 2600, 3100, 3450, 3800, 4000, 4100, 3950, 4200, 4250, 4180, 4300, 4500, 4450, 4380, 4420, 4350, 4280, 4220, 4250, 4200, 4180, 4250].map((v, i) => (
                <div key={i} style={{ flex: 1, height: v / 4500 * 120, background: "linear-gradient(180deg, rgba(59,130,246,0.5) 0%, rgba(59,130,246,0.1) 100%)", borderRadius: "3px 3px 0 0", maxWidth: 12 }} title={`$${v}`} />
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--muted)", marginTop: 8 }}>
              <span>Day 1</span><span>Day 15</span><span>Day 30</span>
            </div>
          </div>

          <div className="card-dark" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px" }}>{t("attestationGrowth")}</h3>
            <div style={{ fontSize: 13, color: "var(--muted)", textAlign: "center" }}>
              {t("attestationGrowth")}: L1 {t("l1Count")} · L2 {t("l2Count")} · L3 {t("l3Count")}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 1: Approvals ── */}
      {tab === 1 && (
        <div className="card-dark">
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 16px" }}>{t("approvalTitle")}</h2>

          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {(["pending", "approved", "rejected"] as const).map((f) => (
              <button
                key={f}
                className={approvalFilter === f ? "btn-primary" : "btn-secondary"}
                style={{ height: 32, fontSize: 12 }}
                onClick={() => setApprovalFilter(f)}
              >
                {f === "pending" ? t("filterPending") : f === "approved" ? t("filterApproved") : t("filterRejected")}
              </button>
            ))}
          </div>

          {approvalFilter === "pending" && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, color: "var(--muted)", borderBottom: "1px solid var(--hairline-on-dark)" }}>Skill</th>
                    <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, color: "var(--muted)", borderBottom: "1px solid var(--hairline-on-dark)" }}>Developer</th>
                    <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, color: "var(--muted)", borderBottom: "1px solid var(--hairline-on-dark)" }}>{t("currentLevelShort")}</th>
                    <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, color: "var(--muted)", borderBottom: "1px solid var(--hairline-on-dark)" }}>{t("appliedAt")}</th>
                    <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, color: "var(--muted)", borderBottom: "1px solid var(--hairline-on-dark)" }}>{common("action")}</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingApprovals.map((a) => (
                    <tr key={a.skillId}>
                      <td style={{ padding: "10px 12px", fontSize: 13, borderBottom: "1px solid var(--hairline-on-dark)" }}>{a.skillName}</td>
                      <td style={{ padding: "10px 12px", fontSize: 12, fontFamily: "monospace", color: "var(--muted)", borderBottom: "1px solid var(--hairline-on-dark)" }}>{a.developer}</td>
                      <td style={{ padding: "10px 12px", fontSize: 12, borderBottom: "1px solid var(--hairline-on-dark)" }}>{a.currentLevel}</td>
                      <td style={{ padding: "10px 12px", fontSize: 12, color: "var(--muted)", borderBottom: "1px solid var(--hairline-on-dark)" }}>{a.appliedAt}</td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--hairline-on-dark)" }}>
                        <button className="btn-primary" style={{ height: 26, fontSize: 11 }} onClick={() => setApprovalDetail(a)}>{t("approve")}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {approvalFilter !== "pending" && (
            <div style={{ textAlign: "center", padding: 40, color: "var(--muted)", fontSize: 13 }}>{t("filterPending")}: 0</div>
          )}
        </div>
      )}

      {/* ── Tab 2: Certificate Management ── */}
      {tab === 2 && (
        <div className="card-dark">
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 16px" }}>{t("certManagementTitle")}</h2>

          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            <input className="input-dark" style={{ flex: 1, minWidth: 200, height: 36, fontSize: 12 }} placeholder={t("searchCert")} />
            {([
              { lvl: "L1", label: t("filterL1") },
              { lvl: "L2", label: t("filterL2") },
              { lvl: "L3", label: t("filterL3") },
            ]).map((f) => (
              <button key={f.lvl} className="btn-secondary" style={{ height: 36, fontSize: 12 }}>{f.label}</button>
            ))}
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, color: "var(--muted)", borderBottom: "1px solid var(--hairline-on-dark)" }}>Certificate ID</th>
                  <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, color: "var(--muted)", borderBottom: "1px solid var(--hairline-on-dark)" }}>Skill</th>
                  <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, color: "var(--muted)", borderBottom: "1px solid var(--hairline-on-dark)" }}>Level</th>
                  <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, color: "var(--muted)", borderBottom: "1px solid var(--hairline-on-dark)" }}>Issue Date</th>
                  <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, color: "var(--muted)", borderBottom: "1px solid var(--hairline-on-dark)" }}>{common("status")}</th>
                  <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, color: "var(--muted)", borderBottom: "1px solid var(--hairline-on-dark)" }}>{common("action")}</th>
                </tr>
              </thead>
              <tbody>
                {issuedCerts.map((c) => (
                  <tr key={c.certId}>
                    <td style={{ padding: "10px 12px", fontSize: 12, fontFamily: "monospace", color: "var(--primary)", borderBottom: "1px solid var(--hairline-on-dark)" }}>{c.certId}</td>
                    <td style={{ padding: "10px 12px", fontSize: 13, borderBottom: "1px solid var(--hairline-on-dark)" }}>{c.skill}</td>
                    <td style={{ padding: "10px 12px", fontSize: 12, borderBottom: "1px solid var(--hairline-on-dark)" }}>{c.level}</td>
                    <td style={{ padding: "10px 12px", fontSize: 12, color: "var(--muted)", borderBottom: "1px solid var(--hairline-on-dark)" }}>{c.issueDate}</td>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--hairline-on-dark)" }}>
                      <span className={c.status === "valid" ? "badge badge-green" : "badge badge-red"} style={c.status === "revoked" ? { background: "rgba(239,68,68,0.12)", color: "var(--trading-down)" } : undefined}>
                        {c.status === "valid" ? "✅" : "❌"} {c.status}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--hairline-on-dark)" }}>
                      {c.status === "valid" && (
                        <button className="btn-secondary" style={{ height: 26, fontSize: 11, color: "var(--trading-down)" }} onClick={() => { setRevokeCert(c); setRevokeReason(""); }}>
                          {t("revokeCert")}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab 3: Fee Management ── */}
      {tab === 3 && (
        <div>
          <div className="card-dark" style={{ marginBottom: 24, padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 16px" }}>{t("revenueSummary")}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
              {[
                { label: t("l1Revenue"), value: "$0.00" },
                { label: t("l2Revenue"), value: "$225.00", sub: "45 × $5" },
                { label: t("l3Revenue"), value: "$418.00", sub: "22 × $19" },
                { label: t("gasServiceFee"), value: "~$250.00" },
                { label: t("arweaveServiceFee"), value: "~$90.00" },
                { label: t("totalRevenue"), value: "$1,665.00", highlight: true },
              ].map((r) => (
                <div key={r.label} style={{ padding: 12, borderRadius: 8, background: r.highlight ? "rgba(14,203,129,0.08)" : "rgba(59,130,246,0.04)", border: r.highlight ? "1px solid rgba(14,203,129,0.2)" : "1px solid var(--hairline-on-dark)", textAlign: "center" }}>
                  <div style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 700, color: r.highlight ? "var(--trading-up)" : "var(--primary)" }}>{r.value}</div>
                  <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>{r.label}</div>
                  {r.sub && <div style={{ fontSize: 9, color: "var(--muted)", marginTop: 2 }}>{r.sub}</div>}
                </div>
              ))}
            </div>
          </div>

          <div className="card-dark" style={{ marginBottom: 24, padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 16px" }}>{t("splitExpenditure")}</h3>
            {[
              { label: t("notaryProvider"), pct: "30% L3", value: "$330.00" },
              { label: t("legalPartners"), pct: "20% L3", value: "$220.00" },
              { label: t("arbitrationReserve"), pct: "10% L3", value: "$110.00" },
              { label: t("aimsPlatform"), pct: "", value: "$1,005.00" },
            ].map((r) => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--hairline-on-dark)", fontSize: 13 }}>
                <span style={{ color: "var(--muted)" }}>{r.label} {r.pct && <span style={{ fontSize: 10 }}>({r.pct})</span>}</span>
                <span style={{ fontFamily: "monospace", fontWeight: 500 }}>{r.value}</span>
              </div>
            ))}
          </div>

          <div className="card-dark" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 16px" }}>{t("reservePoolTitle")}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 12 }}>
              {[
                { label: t("currentBalance"), value: "$2,200.00" },
                { label: t("depositedThisMonth"), value: "$110.00" },
                { label: t("spentThisMonth"), value: "$0.00" },
              ].map((r) => (
                <div key={r.label} style={{ padding: 12, borderRadius: 8, background: "rgba(59,130,246,0.04)", border: "1px solid var(--hairline-on-dark)", textAlign: "center" }}>
                  <div style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 700 }}>{r.value}</div>
                  <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>{r.label}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>{t("reservePurpose")}</div>
          </div>
        </div>
      )}

      {/* ── Tab 4: Notary Monitor ── */}
      {tab === 4 && (
        <div className="card-dark">
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 16px" }}>{t("notaryTitle")}</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, color: "var(--muted)", borderBottom: "1px solid var(--hairline-on-dark)" }}>{t("provider")}</th>
                  <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, color: "var(--muted)", borderBottom: "1px solid var(--hairline-on-dark)" }}>{t("serviceType")}</th>
                  <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, color: "var(--muted)", borderBottom: "1px solid var(--hairline-on-dark)" }}>{common("status")}</th>
                  <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, color: "var(--muted)", borderBottom: "1px solid var(--hairline-on-dark)" }}>{t("uptime")}</th>
                  <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, color: "var(--muted)", borderBottom: "1px solid var(--hairline-on-dark)" }}>{t("monthlyCalls")}</th>
                </tr>
              </thead>
              <tbody>
                {notaryProviders.map((p) => (
                  <tr key={p.name}>
                    <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 500, borderBottom: "1px solid var(--hairline-on-dark)" }}>{p.name}</td>
                    <td style={{ padding: "10px 12px", fontSize: 12, color: "var(--muted)", borderBottom: "1px solid var(--hairline-on-dark)" }}>{p.serviceType}</td>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--hairline-on-dark)" }}>
                      <span style={{
                        fontSize: 11, padding: "2px 8px", borderRadius: 4, fontWeight: 600,
                        background: p.status === "normal" ? "rgba(14,203,129,0.12)" : p.status === "degraded" ? "rgba(252,213,53,0.12)" : "rgba(239,68,68,0.12)",
                        color: p.status === "normal" ? "var(--trading-up)" : p.status === "degraded" ? "var(--primary)" : "var(--trading-down)",
                      }}>
                        {p.status === "normal" ? `✅ ${t("normal")}` : p.status === "degraded" ? `⚠️ ${t("degraded")}` : `❌ ${t("down")}`}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", fontSize: 13, fontFamily: "monospace", borderBottom: "1px solid var(--hairline-on-dark)" }}>{p.uptime}</td>
                    <td style={{ padding: "10px 12px", fontSize: 13, fontFamily: "monospace", borderBottom: "1px solid var(--hairline-on-dark)" }}>{p.monthlyCalls.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {notaryProviders.some((p) => p.status === "degraded") && (
            <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: "rgba(252,213,53,0.06)", border: "1px solid rgba(252,213,53,0.2)" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--primary)", marginBottom: 4 }}>⚠️ {t("anomalyAlert")}: Japan TS</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("autoSwitch")}</div>
            </div>
          )}
        </div>
      )}

      {/* ── Approval Detail Modal ── */}
      {approvalDetail && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="card-dark" style={{ maxWidth: 500, width: "100%", padding: 28, maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 4px" }}>{t("approvalDetail")} — {approvalDetail.skillName}</h3>

            <div style={{ padding: 16, borderRadius: 8, background: "rgba(59,130,246,0.04)", marginBottom: 16 }}>
              <div style={{ fontSize: 13, marginBottom: 8 }}>
                <span style={{ color: "var(--muted)" }}>Skill:</span> {approvalDetail.skillName}<br />
                <span style={{ color: "var(--muted)" }}>Developer:</span> <span style={{ fontFamily: "monospace" }}>{approvalDetail.developer}</span><br />
                <span style={{ color: "var(--muted)" }}>{t("currentLevelShort")}:</span> {approvalDetail.currentLevel}<br />
                <span style={{ color: "var(--muted)" }}>{t("l2Duration")}:</span> {approvalDetail.l2Duration}<br />
                <span style={{ color: "var(--muted)" }}>{t("historyDisputes")}:</span> {approvalDetail.historyDisputes}
              </div>
            </div>

            <div style={{ padding: 14, borderRadius: 8, background: "rgba(59,130,246,0.06)", marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{t("upgradeWillEnable")}</div>
              {["Multi-chain attestation (ETH + Polygon + Arweave)", "eIDAS + China Judicial Chain notary", "5 jurisdiction templates", "Quarterly auto-audit", "Priority arbitration (48hr)"].map((f, i) => (
                <div key={i} style={{ fontSize: 12, color: "var(--muted)", padding: "2px 0" }}>✅ {f}</div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn-secondary" style={{ flex: 1, height: 40 }} onClick={() => setApprovalDetail(null)}>{t("rejectWithReason")}</button>
              <button className="btn-primary" style={{ flex: 1, height: 40 }} onClick={() => setApprovalDetail(null)}>{t("approveUpgrade")}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Revoke Modal ── */}
      {revokeCert && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="card-dark" style={{ maxWidth: 480, width: "100%", padding: 28 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 4px", color: "var(--trading-down)" }}>⚠️ {t("revokeTitle")} — {revokeCert.certId}</h3>
            <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 16px" }}>{t("revokeWarning")}</p>
            <ul style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.8, margin: "0 0 16px", paddingLeft: 20 }}>
              <li>{t("revokeConsequence1")}</li>
              <li>{t("revokeConsequence2")}</li>
              <li>{t("revokeConsequence3")}</li>
            </ul>
            <textarea
              className="input-dark"
              rows={3}
              placeholder={t("revokeReason")}
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              style={{ width: "100%", marginBottom: 16, resize: "vertical", height: "auto" }}
            />
            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn-secondary" style={{ flex: 1, height: 40 }} onClick={() => setRevokeCert(null)}>{common("cancel")}</button>
              <button className="btn-primary" style={{ flex: 1, height: 40, background: "var(--trading-down)" }} disabled={!revokeReason} onClick={() => setRevokeCert(null)}>{t("confirmRevoke")}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
