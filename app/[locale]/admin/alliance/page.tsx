"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

interface AllianceSkill {
  id: string;
  name: string;
  developer: string;
  currentBasePrice: string;
  status: "active" | "pending_price_update" | "cooling_down";
  priceEffective?: string;
  calls: number;
}

interface PendingApplication {
  id: string;
  applicant: string;
  skillName: string;
  modelType: string;
  appliedAt: string;
  assessmentScore: number;
  suggestedBasePrice: string;
}

interface ResellerEntry {
  id: string;
  address: string;
  status: "active" | "suspended" | "banned";
  distributedSkills: number;
  totalSales: string;
  totalCommissions: string;
  markupRevenue: string;
  joinedAt: string;
}

interface SettlementEntry {
  orderId: string;
  skillName: string;
  consumer: string;
  basePrice: string;
  aimsShare: string;
  devShare: string;
  resellerShare: string;
  markup: string;
  status: "settled" | "pending" | "anomaly";
}

export default function AdminAlliancePage() {
  const t = useTranslations("AdminAlliancePage");
  const common = useTranslations("Common");
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [priceModal, setPriceModal] = useState<AllianceSkill | null>(null);
  const [newPrice, setNewPrice] = useState("");
  const [approvalModal, setApprovalModal] = useState<{ app: PendingApplication; action: "approve" | "reject" } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [suspendModal, setSuspendModal] = useState<ResellerEntry | null>(null);

  useEffect(() => {
    const w = sessionStorage.getItem("aims_wallet");
    const tok = sessionStorage.getItem("aims_token");
    if (!w || !tok) { router.push("/login"); return; }
    setLoading(false);
  }, [router]);

  const skills: AllianceSkill[] = [
    { id: "3", name: "Code Llama 34B Audit", developer: "0x15d3...6A65", currentBasePrice: "0.0080", status: "active", calls: 45000 },
    { id: "4", name: "Whisper Large v3 TTS", developer: "0xf39F...2266", currentBasePrice: "0.0020", status: "active", calls: 67000 },
    { id: "5", name: "Mixtral 8x7B MoE", developer: "0x7099...79C8", currentBasePrice: "0.0050", status: "pending_price_update", calls: 9100 },
    { id: "7", name: "DeepSeek-R1 Reasoning", developer: "0xA1B2...C3D4", currentBasePrice: "0.0080", status: "active", calls: 45000 },
    { id: "8", name: "Claude-3-Opus Compatible", developer: "0xE5F6...G7H8", currentBasePrice: "0.0150", status: "active", calls: 32000 },
  ];

  const applications: PendingApplication[] = [
    { id: "APP-001", applicant: "0x3C44...93BC", skillName: "LLaMA 3.1 70B Inference", modelType: "LLM Inference", appliedAt: "2 hours ago", assessmentScore: 92, suggestedBasePrice: "0.0050" },
    { id: "APP-002", applicant: "0x90F7...b906", skillName: "Stable Diffusion XL", modelType: "Image Generation", appliedAt: "5 hours ago", assessmentScore: 85, suggestedBasePrice: "0.0120" },
  ];

  const resellers: ResellerEntry[] = [
    { id: "R-001", address: "0x3C44...93BC", status: "active", distributedSkills: 5, totalSales: "12,450.00", totalCommissions: "3,112.50", markupRevenue: "2,890.00", joinedAt: "2026-06-15" },
    { id: "R-002", address: "0x90F7...b906", status: "active", distributedSkills: 3, totalSales: "8,230.00", totalCommissions: "2,057.50", markupRevenue: "1,560.00", joinedAt: "2026-06-20" },
    { id: "R-003", address: "0x7099...79C8", status: "suspended", distributedSkills: 2, totalSales: "3,100.00", totalCommissions: "775.00", markupRevenue: "420.00", joinedAt: "2026-07-01" },
    { id: "R-004", address: "0xA1B2...C3D4", status: "active", distributedSkills: 8, totalSales: "28,900.00", totalCommissions: "7,225.00", markupRevenue: "5,100.00", joinedAt: "2026-05-10" },
  ];

  const settlements: SettlementEntry[] = [
    { orderId: "ORD-1001", skillName: "Mixtral 8x7B MoE", consumer: "0x3C44...93BC", basePrice: "0.0050", aimsShare: "0.00075", devShare: "0.00300", resellerShare: "0.00125", markup: "0.0030", status: "settled" },
    { orderId: "ORD-1002", skillName: "Whisper Large v3 TTS", consumer: "0x90F7...b906", basePrice: "0.0020", aimsShare: "0.00030", devShare: "0.00120", resellerShare: "0.00050", markup: "0.0010", status: "settled" },
    { orderId: "ORD-1003", skillName: "DeepSeek-R1 Reasoning", consumer: "0x15d3...6A65", basePrice: "0.0080", aimsShare: "0.00120", devShare: "0.00480", resellerShare: "0.00200", markup: "0", status: "pending" },
    { orderId: "ORD-1004", skillName: "Code Llama 34B Audit", consumer: "0xA1B2...C3D4", basePrice: "0.0080", aimsShare: "0.00120", devShare: "0.00480", resellerShare: "0.00200", markup: "0.0050", status: "anomaly" },
  ];

  const aiSuggestions = [
    { skillName: "Mixtral 8x7B MoE", currentPrice: "0.0050", suggestedPrice: "0.0065", confidence: "87%" },
    { skillName: "Whisper Large v3 TTS", currentPrice: "0.0020", suggestedPrice: "0.0025", confidence: "92%" },
  ];

  if (loading) return <div style={{ padding: 80, textAlign: "center", color: "var(--muted)" }}>{common("loading")}</div>;

  const tabs = [
    { key: "tabDashboard", label: t("tabDashboard") },
    { key: "tabPricing", label: t("tabPricing") },
    { key: "tabApproval", label: t("tabApproval") },
    { key: "tabResellers", label: t("tabResellers") },
    { key: "tabSettlement", label: t("tabSettlement") },
    { key: "tabAnalytics", label: t("tabAnalytics") },
  ];

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, margin: "0 0 8px" }}>{t("title")}</h1>
        <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>{t("subtitle")}</p>
      </div>

      <div style={{ display: "flex", gap: 0, marginBottom: 28, borderBottom: "1px solid var(--hairline-on-dark)", overflowX: "auto" }}>
        {tabs.map((tab, i) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(i)}
            style={{
              padding: "12px 18px", fontSize: 12, fontWeight: activeTab === i ? 600 : 400,
              color: activeTab === i ? "var(--primary)" : "var(--muted)",
              borderBottom: activeTab === i ? "2px solid var(--primary)" : "2px solid transparent",
              background: "none", borderTop: "none", borderLeft: "none", borderRight: "none",
              cursor: "pointer", whiteSpace: "nowrap",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab 0: Dashboard ── */}
      {activeTab === 0 && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
            {[
              { label: t("allianceSkills"), value: String(skills.length), color: "var(--primary)" },
              { label: t("activeResellers"), value: String(resellers.filter((r) => r.status === "active").length), color: "var(--trading-up)" },
              { label: t("totalConsumers"), value: "1,240", color: "#3b82f6" },
              { label: t("totalVolume"), value: "$52,680.00", color: "var(--trading-up)" },
            ].map((stat, i) => (
              <div key={i} style={{ padding: 18, borderRadius: 10, background: "rgba(59,130,246,0.04)", border: "1px solid var(--hairline-on-dark)", textAlign: "center" }}>
                <div style={{ fontFamily: "monospace", fontSize: 24, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
            {[
              { label: t("aimsRevenue"), value: "$7,902.00", color: "#3b82f6" },
              { label: t("devPayout"), value: "$31,608.00", color: "var(--trading-up)" },
              { label: t("resellerCommission"), value: "$13,170.00", color: "var(--primary)" },
            ].map((stat, i) => (
              <div key={i} style={{ padding: 16, borderRadius: 10, background: "rgba(59,130,246,0.04)", border: "1px solid var(--hairline-on-dark)", textAlign: "center" }}>
                <div style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div className="card-dark" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 12px" }}>{t("skillLeaderboard")}</h3>
              {skills.sort((a, b) => b.calls - a.calls).slice(0, 5).map((s, i) => (
                <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderBottom: i < 4 ? "1px solid var(--hairline-on-dark)" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: i < 3 ? "var(--primary)" : "var(--muted)", width: 24 }}>#{i + 1}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                      <div style={{ fontSize: 10, color: "var(--muted)" }}>{s.developer}</div>
                    </div>
                  </div>
                  <span style={{ fontFamily: "monospace", fontSize: 13 }}>{(s.calls / 1000).toFixed(1)}K calls</span>
                </div>
              ))}
            </div>

            <div className="card-dark" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 12px" }}>{t("resellerLeaderboard")}</h3>
              {resellers.filter((r) => r.status === "active").sort((a, b) => parseFloat(b.totalSales) - parseFloat(a.totalSales)).slice(0, 5).map((r, i) => (
                <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderBottom: i < 4 ? "1px solid var(--hairline-on-dark)" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: i < 3 ? "var(--primary)" : "var(--muted)", width: 24 }}>#{i + 1}</span>
                    <div>
                      <div style={{ fontSize: 13, fontFamily: "monospace" }}>{r.address}</div>
                      <div style={{ fontSize: 10, color: "var(--muted)" }}>{r.distributedSkills} skills</div>
                    </div>
                  </div>
                  <span style={{ fontFamily: "monospace", fontSize: 13, color: "var(--trading-up)", fontWeight: 600 }}>${parseFloat(r.totalSales).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 1: Pricing Management ── */}
      {activeTab === 1 && (
        <div>
          <div style={{ padding: 16, borderRadius: 10, background: "rgba(252,213,53,0.06)", border: "1px solid rgba(252,213,53,0.2)", marginBottom: 20, fontSize: 12, color: "var(--muted)" }}>
            ⚠ {t("noticePeriodDesc")}
          </div>

          <div className="card-dark" style={{ overflowX: "auto", marginBottom: 24 }}>
            <table className="table-dark">
              <thead>
                <tr>
                  <th>{t("skillName")}</th>
                  <th>{t("developer")}</th>
                  <th>{t("currentBasePrice")}</th>
                  <th>{common("status")}</th>
                  <th>{common("action")}</th>
                </tr>
              </thead>
              <tbody>
                {skills.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td style={{ fontFamily: "monospace", fontSize: 12, color: "var(--muted)" }}>{s.developer}</td>
                    <td style={{ fontFamily: "monospace", fontWeight: 600 }}>${s.currentBasePrice}</td>
                    <td>
                      <span className={s.status === "active" ? "badge badge-green" : "badge badge-yellow"}>
                        {s.status === "active" ? t("priceEffective") : t("pricePending")}
                      </span>
                    </td>
                    <td>
                      <button className="btn-secondary" style={{ height: 28, fontSize: 11 }} onClick={() => { setPriceModal(s); setNewPrice(s.currentBasePrice); }}>
                        {t("adjustPrice")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card-dark" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px" }}>{t("priceHistory")}</h3>
            <table className="table-dark">
              <thead>
                <tr>
                  <th>{t("skillName")}</th>
                  <th>{t("previousPrice")}</th>
                  <th>{t("newBasePrice")}</th>
                  <th>{t("changedBy")}</th>
                  <th>{t("changedAt")}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { skill: "Mixtral 8x7B MoE", prev: "0.0040", next: "0.0050", by: "admin", at: "2026-07-08" },
                  { skill: "Whisper Large v3 TTS", prev: "0.0015", next: "0.0020", by: "admin", at: "2026-07-01" },
                ].map((h, i) => (
                  <tr key={i}>
                    <td>{h.skill}</td>
                    <td style={{ fontFamily: "monospace", color: "var(--trading-down)" }}>${h.prev}</td>
                    <td style={{ fontFamily: "monospace", color: "var(--trading-up)" }}>${h.next}</td>
                    <td>{h.by}</td>
                    <td style={{ fontSize: 12, color: "var(--muted)" }}>{h.at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab 2: Skill Approval ── */}
      {activeTab === 2 && (
        <div>
          <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
            {[t("pendingApproval"), t("approved"), t("rejected")].map((label, i) => (
              <button key={i} className={i === 0 ? "btn-primary" : "btn-secondary"} style={{ height: 32, fontSize: 12, padding: "0 16px" }}>{label} {i === 0 ? `(${applications.length})` : ""}</button>
            ))}
          </div>

          <div className="card-dark" style={{ overflowX: "auto" }}>
            <table className="table-dark">
              <thead>
                <tr>
                  <th>{t("applicant")}</th>
                  <th>{t("skillName")}</th>
                  <th>{t("modelType")}</th>
                  <th>{t("appliedAt")}</th>
                  <th>{t("assessmentScore")}</th>
                  <th>{t("suggestedPrice")}</th>
                  <th>{common("action")}</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id}>
                    <td style={{ fontFamily: "monospace", fontSize: 12 }}>{app.applicant}</td>
                    <td style={{ fontWeight: 600 }}>{app.skillName}</td>
                    <td>{app.modelType}</td>
                    <td style={{ fontSize: 12, color: "var(--muted)" }}>{app.appliedAt}</td>
                    <td>
                      <span style={{ color: app.assessmentScore >= 85 ? "var(--trading-up)" : "var(--primary)", fontWeight: 600 }}>{app.assessmentScore}</span>
                    </td>
                    <td style={{ fontFamily: "monospace", fontWeight: 600 }}>${app.suggestedBasePrice}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn-primary" style={{ height: 26, fontSize: 10 }} onClick={() => setApprovalModal({ app, action: "approve" })}>{t("approve")}</button>
                        <button className="btn-secondary" style={{ height: 26, fontSize: 10, color: "var(--trading-down)" }} onClick={() => setApprovalModal({ app, action: "reject" })}>{t("reject")}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab 3: Reseller Management ── */}
      {activeTab === 3 && (
        <div className="card-dark" style={{ overflowX: "auto" }}>
          <table className="table-dark">
            <thead>
              <tr>
                <th>{t("reseller")}</th>
                <th>{common("status")}</th>
                <th>{t("distributedSkills")}</th>
                <th>{t("totalSales")}</th>
                <th>{t("totalCommissions")}</th>
                <th>{t("markupRevenue")}</th>
                <th>{t("joinedAt")}</th>
                <th>{common("action")}</th>
              </tr>
            </thead>
            <tbody>
              {resellers.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontFamily: "monospace", fontSize: 13 }}>{r.address}</td>
                  <td>
                    <span className={r.status === "active" ? "badge badge-green" : r.status === "suspended" ? "badge badge-yellow" : "badge badge-red"}
                      style={r.status === "banned" ? { background: "rgba(239,68,68,0.12)", color: "var(--trading-down)" } : undefined}>
                      {r.status === "active" ? t("activeStatus") : r.status === "suspended" ? t("suspendedStatus") : t("bannedStatus")}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>{r.distributedSkills}</td>
                  <td style={{ fontFamily: "monospace" }}>${r.totalSales}</td>
                  <td style={{ fontFamily: "monospace", color: "var(--trading-up)" }}>${r.totalCommissions}</td>
                  <td style={{ fontFamily: "monospace", color: "var(--primary)" }}>${r.markupRevenue}</td>
                  <td style={{ fontSize: 12, color: "var(--muted)" }}>{r.joinedAt}</td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      {r.status === "active" ? (
                        <button className="btn-secondary" style={{ height: 24, fontSize: 10, color: "var(--primary)" }} onClick={() => setSuspendModal(r)}>{t("suspend")}</button>
                      ) : r.status === "suspended" ? (
                        <button className="btn-secondary" style={{ height: 24, fontSize: 10, color: "var(--trading-up)" }}>{t("reinstate")}</button>
                      ) : null}
                      <button className="btn-secondary" style={{ height: 24, fontSize: 10, color: "var(--trading-down)" }}>{t("ban")}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Tab 4: Settlement ── */}
      {activeTab === 4 && (
        <div>
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <button className="btn-primary" style={{ height: 36, fontSize: 12 }}>{t("batchSettle")}</button>
            <button className="btn-secondary" style={{ height: 36, fontSize: 12 }}>{t("exportReport")}</button>
            <span style={{ marginLeft: "auto", fontSize: 13, color: "var(--muted)", lineHeight: "36px" }}>{t("anomalyOrders")}: {settlements.filter((s) => s.status === "anomaly").length}</span>
          </div>

          <div className="card-dark" style={{ overflowX: "auto", marginBottom: 24 }}>
            <table className="table-dark">
              <thead>
                <tr>
                  <th>{t("orderId")}</th>
                  <th>{t("skillName")}</th>
                  <th>{t("consumer")}</th>
                  <th>{t("basePriceAmount")}</th>
                  <th>{t("aims15")}</th>
                  <th>{t("dev60")}</th>
                  <th>{t("reseller25")}</th>
                  <th>{t("markupAmount")}</th>
                  <th>{common("status")}</th>
                </tr>
              </thead>
              <tbody>
                {settlements.map((s) => (
                  <tr key={s.orderId} style={{ background: s.status === "anomaly" ? "rgba(239,68,68,0.04)" : "transparent" }}>
                    <td style={{ fontFamily: "monospace", fontSize: 12 }}>{s.orderId}</td>
                    <td>{s.skillName}</td>
                    <td style={{ fontFamily: "monospace", fontSize: 12, color: "var(--muted)" }}>{s.consumer}</td>
                    <td style={{ fontFamily: "monospace" }}>${s.basePrice}</td>
                    <td style={{ fontFamily: "monospace", color: "#3b82f6" }}>${s.aimsShare}</td>
                    <td style={{ fontFamily: "monospace", color: "var(--trading-up)" }}>${s.devShare}</td>
                    <td style={{ fontFamily: "monospace", color: "var(--primary)" }}>${s.resellerShare}</td>
                    <td style={{ fontFamily: "monospace", color: s.markup !== "0" ? "var(--primary)" : "var(--muted)" }}>{s.markup !== "0" ? `$${s.markup}` : "—"}</td>
                    <td>
                      {s.status === "anomaly" ? (
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <span className="badge badge-yellow" style={{ background: "rgba(239,68,68,0.12)", color: "var(--trading-down)" }}>Anomaly</span>
                          <button className="btn-secondary" style={{ height: 22, fontSize: 9 }}>{t("resolveAnomaly")}</button>
                        </div>
                      ) : (
                        <span className={s.status === "settled" ? "badge badge-green" : "badge badge-yellow"}>
                          {s.status === "settled" ? t("settled") : t("pending")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab 5: Analytics ── */}
      {activeTab === 5 && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
            {[
              { label: t("conversionRate"), value: "34%", color: "var(--trading-up)" },
              { label: t("allianceRevenue"), value: "$52,680", color: "#3b82f6" },
              { label: t("autonomousRevenue"), value: "$18,240", color: "var(--primary)" },
            ].map((stat, i) => (
              <div key={i} style={{ padding: 18, borderRadius: 10, background: "rgba(59,130,246,0.04)", border: "1px solid var(--hairline-on-dark)", textAlign: "center" }}>
                <div style={{ fontFamily: "monospace", fontSize: 24, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
            <div className="card-dark" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 12px" }}>{t("allianceVsAutonomous")}</h3>
              <div style={{ height: 160, display: "flex", alignItems: "flex-end", gap: 16, padding: "0 8px" }}>
                {[65, 72, 58, 80, 70, 85, 75, 90, 78, 88, 82, 95].map((h, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, height: "100%", justifyContent: "flex-end" }}>
                    <div style={{ height: `${h * 0.65}%`, borderRadius: "2px 2px 0 0", background: "#3b82f6", opacity: 0.7 }} />
                    <div style={{ height: `${h * 0.35}%`, borderRadius: "2px 2px 0 0", background: "var(--primary)", opacity: 0.5 }} />
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 20, marginTop: 10, fontSize: 10, color: "var(--muted)" }}>
                <span>■ {t("allianceRevenue")}</span>
                <span>■ {t("autonomousRevenue")}</span>
              </div>
            </div>

            <div className="card-dark" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 12px" }}>{t("resellerActivity")}</h3>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 160 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 48, fontWeight: 700, color: "var(--trading-up)" }}>75%</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("activeRate")} — 3/4 active this month</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card-dark" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 4px" }}>{t("aiPricingSuggestion")}</h3>
            <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 16px" }}>{t("optimizationNote")}</p>
            <table className="table-dark">
              <thead>
                <tr>
                  <th>{t("skillName")}</th>
                  <th>{t("currentBasePrice")}</th>
                  <th>{t("suggestedPrice")}</th>
                  <th>{t("confidence")}</th>
                  <th>{common("action")}</th>
                </tr>
              </thead>
              <tbody>
                {aiSuggestions.map((s, i) => (
                  <tr key={i}>
                    <td>{s.skillName}</td>
                    <td style={{ fontFamily: "monospace" }}>${s.currentPrice}</td>
                    <td style={{ fontFamily: "monospace", fontWeight: 600, color: "var(--trading-up)" }}>${s.suggestedPrice}</td>
                    <td style={{ color: "var(--trading-up)" }}>{s.confidence}</td>
                    <td>
                      <button className="btn-primary" style={{ height: 26, fontSize: 10 }}>{t("applySuggestion")}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Price Adjust Modal ── */}
      {priceModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="card-dark" style={{ maxWidth: 440, width: "100%", padding: 28 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 4px" }}>{t("adjustPrice")}</h3>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 8px", fontFamily: "monospace" }}>{priceModal.name}</p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>{t("currentBasePrice")}</label>
              <div style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 700 }}>${priceModal.currentBasePrice}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>{t("newBasePrice")}</label>
              <input className="input-dark" type="number" step="0.0001" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} style={{ width: "100%", height: 42, fontSize: 16, fontFamily: "monospace" }} />
            </div>
            <div style={{ padding: 10, borderRadius: 6, background: "rgba(252,213,53,0.06)", fontSize: 11, color: "var(--muted)", marginBottom: 16 }}>
              {t("noticePeriodDesc")}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setPriceModal(null)}>{common("cancel")}</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={() => setPriceModal(null)}>{common("confirm")}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Approval Modal ── */}
      {approvalModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="card-dark" style={{ maxWidth: 440, width: "100%", padding: 28 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 4px" }}>
              {approvalModal.action === "approve" ? t("approveConfirm") : t("rejectConfirm")}
            </h3>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 8px", fontFamily: "monospace" }}>{approvalModal.app.skillName}</p>
            <div style={{ padding: 12, borderRadius: 8, background: "rgba(59,130,246,0.05)", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: "var(--muted)" }}>{t("assessmentScore")}:</span>
                <span style={{ fontWeight: 600, color: "var(--trading-up)" }}>{approvalModal.app.assessmentScore}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: "var(--muted)" }}>{t("suggestedPrice")}:</span>
                <span style={{ fontFamily: "monospace", fontWeight: 600 }}>${approvalModal.app.suggestedBasePrice}</span>
              </div>
            </div>
            {approvalModal.action === "reject" && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>{t("rejectReason")}</label>
                <input className="input-dark" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="e.g. insufficient quality, incomplete documentation..." style={{ width: "100%", height: 38, fontSize: 13 }} />
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => { setApprovalModal(null); setRejectReason(""); }}>{common("cancel")}</button>
              <button className="btn-primary" style={{ flex: 1, background: approvalModal.action === "reject" ? "var(--trading-down)" : undefined }} onClick={() => { setApprovalModal(null); setRejectReason(""); }}>
                {approvalModal.action === "approve" ? t("approve") : t("reject")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Suspend Modal ── */}
      {suspendModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="card-dark" style={{ maxWidth: 420, width: "100%", padding: 28 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>{t("suspendConfirm")}</h3>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 16px", fontFamily: "monospace" }}>{suspendModal.address}</p>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 16px", lineHeight: 1.6 }}>This will temporarily suspend the reseller's ability to distribute skills and earn commissions.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setSuspendModal(null)}>{common("cancel")}</button>
              <button className="btn-primary" style={{ flex: 1, background: "var(--primary)" }} onClick={() => setSuspendModal(null)}>{common("confirm")}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
