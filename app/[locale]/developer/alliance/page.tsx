"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

interface AllianceSkill {
  id: string;
  name: string;
  pricingModel: "mode1" | "mode2";
  inAlliance: boolean;
  allianceBasePrice: string;
  estMonthlyEarnings: string;
  calls: number;
  status: "active" | "cooling_down" | "none";
  coolingDays?: number;
}

interface EarningsEntry {
  date: string;
  skillName: string;
  calls: number;
  basePrice: string;
  devShare: string;
  status: "settled" | "pending";
}

interface Demand {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: string;
  deadline: string;
  poster: string;
  postedAt: string;
  status: "open" | "fulfilled";
}

interface RegisteredSkill {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string;
  buyoutPrice: string;
  subscriptionMonthly: string;
  subscriptionYearly: string;
  alliance: boolean;
  ipVaultLevel: string;
  sourceRepo: string;
  uploadFileName: string;
  uploadData: string;
  status: "pending_review" | "approved" | "rejected";
  registeredAt: string;
}

interface IpAsset {
  id: string;
  name: string;
  version: string;
  hash: string;
  description: string;
  registeredAt: string;
}

function loadDemands(): Demand[] {
  if (typeof window === "undefined") return [];
  const raw = sessionStorage.getItem("aims_demands");
  return raw ? JSON.parse(raw) : [];
}

function loadRegisteredSkills(): RegisteredSkill[] {
  if (typeof window === "undefined") return [];
  const raw = sessionStorage.getItem("aims_registered_skills");
  return raw ? JSON.parse(raw) : [];
}

function saveRegisteredSkills(skills: RegisteredSkill[]) {
  sessionStorage.setItem("aims_registered_skills", JSON.stringify(skills));
}

function loadIpAssets(): IpAsset[] {
  if (typeof window === "undefined") return [];
  const raw = sessionStorage.getItem("aims_ip_vault");
  return raw ? JSON.parse(raw) : [];
}

const MOCK_SKILLS: AllianceSkill[] = [
  { id: "1", name: "LLaMA 3.1 70B Inference", pricingModel: "mode1", inAlliance: false, allianceBasePrice: "0.0050", estMonthlyEarnings: "1,250.00", calls: 12300, status: "none" },
  { id: "2", name: "Stable Diffusion XL", pricingModel: "mode1", inAlliance: false, allianceBasePrice: "0.0120", estMonthlyEarnings: "890.00", calls: 8100, status: "none" },
  { id: "3", name: "Code Llama 34B Audit", pricingModel: "mode1", inAlliance: true, allianceBasePrice: "0.0080", estMonthlyEarnings: "3,200.00", calls: 45000, status: "active" },
  { id: "4", name: "Whisper Large v3 TTS", pricingModel: "mode2", inAlliance: true, allianceBasePrice: "0.0020", estMonthlyEarnings: "980.00", calls: 67000, status: "active" },
  { id: "5", name: "Mixtral 8x7B MoE", pricingModel: "mode2", inAlliance: true, allianceBasePrice: "0.0050", estMonthlyEarnings: "2,100.00", calls: 9100, status: "active" },
];

const MOCK_EARNINGS: EarningsEntry[] = [
  { date: "2026-07-09", skillName: "Code Llama 34B Audit", calls: 1240, basePrice: "0.0080", devShare: "5.9520", status: "settled" },
  { date: "2026-07-08", skillName: "Mixtral 8x7B MoE", calls: 890, basePrice: "0.0050", devShare: "2.6700", status: "settled" },
  { date: "2026-07-08", skillName: "Whisper Large v3 TTS", calls: 3400, basePrice: "0.0020", devShare: "4.0800", status: "settled" },
  { date: "2026-07-07", skillName: "Code Llama 34B Audit", calls: 1560, basePrice: "0.0080", devShare: "7.4880", status: "settled" },
  { date: "2026-07-07", skillName: "Mixtral 8x7B MoE", calls: 720, basePrice: "0.0050", devShare: "2.1600", status: "pending" },
];

export default function DeveloperAlliancePage() {
  const t = useTranslations("DeveloperAlliancePage");
  const common = useTranslations("Common");
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [joinModal, setJoinModal] = useState<AllianceSkill | null>(null);
  const [leaveModal, setLeaveModal] = useState<AllianceSkill | null>(null);
  const [sellLinkSkill, setSellLinkSkill] = useState<RegisteredSkill | null>(null);
  const [sellLinkTrialQuota, setSellLinkTrialQuota] = useState(50);
  const [sellLinkTrialTTL, setSellLinkTrialTTL] = useState(72);
  const [sellLinkUrl, setSellLinkUrl] = useState("");
  const [sellLinkCopied, setSellLinkCopied] = useState(false);
  const [demands, setDemands] = useState<Demand[]>([]);

  const [registeredSkills, setRegisteredSkills] = useState<RegisteredSkill[]>([]);
  const [ipAssets, setIpAssets] = useState<IpAsset[]>([]);

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regStep, setRegStep] = useState(1);
  const [regName, setRegName] = useState("");
  const [regDesc, setRegDesc] = useState("");
  const [regCategory, setRegCategory] = useState("cat_ai");
  const [regTags, setRegTags] = useState("");
  const [regRepoUrl, setRegRepoUrl] = useState("");
  const [regUploadFile, setRegUploadFile] = useState<File | null>(null);
  const [regUploadName, setRegUploadName] = useState("");
  const [regBuyoutPrice, setRegBuyoutPrice] = useState("");
  const [regSubMonthly, setRegSubMonthly] = useState("");
  const [regAlliance, setRegAlliance] = useState(false);
  const [regIpVault, setRegIpVault] = useState<"L1" | "L2" | "L3">("L1");
  const [regDepModels, setRegDepModels] = useState("");
  const [regDepApis, setRegDepApis] = useState("");
  const [regDepWorkflow, setRegDepWorkflow] = useState("");
  const [regSubmitted, setRegSubmitted] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem("aims_wallet")) { router.push("/login"); return; }
    setDemands(loadDemands());
    setRegisteredSkills(loadRegisteredSkills());
    setIpAssets(loadIpAssets());
    setLoading(false);
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("register") === "true") {
      setShowRegisterModal(true);
    }
  }, [router]);

  const openRegisterModal = () => {
    setRegStep(1);
    setRegName(""); setRegDesc(""); setRegCategory("cat_ai"); setRegTags("");
    setRegRepoUrl(""); setRegUploadFile(null); setRegUploadName("");
    setRegBuyoutPrice(""); setRegSubMonthly(""); setRegAlliance(false);
    setRegIpVault("L1");
    setRegDepModels(""); setRegDepApis(""); setRegDepWorkflow("");
    setRegSubmitted(false);
    setShowRegisterModal(true);
  };

  const closeRegisterModal = () => {
    setShowRegisterModal(false);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("register");
      window.history.replaceState({}, "", url.toString());
    }
  };

  const handleRegisterSubmit = () => {
    if (!regName || !regDesc) return;
    let uploadData = "";
    if (regUploadFile) {
      uploadData = regUploadFile.name;
    }
    const yearly = regSubMonthly ? (parseFloat(regSubMonthly) * 12 * 0.8).toFixed(2) : "";
    const newSkill: RegisteredSkill = {
      id: Date.now().toString(36),
      name: regName,
      description: regDesc,
      category: regCategory,
      tags: regTags,
      buyoutPrice: regBuyoutPrice,
      subscriptionMonthly: regSubMonthly,
      subscriptionYearly: yearly,
      alliance: regAlliance,
      ipVaultLevel: regIpVault,
      sourceRepo: regRepoUrl,
      uploadFileName: regUploadName || (regUploadFile?.name || ""),
      uploadData,
      status: "pending_review",
      registeredAt: new Date().toISOString(),
    };
    const updated = [newSkill, ...registeredSkills];
    saveRegisteredSkills(updated);
    setRegisteredSkills(updated);
    setRegSubmitted(true);
    setTimeout(() => {
      setShowRegisterModal(false);
      setRegSubmitted(false);
    }, 1500);
  };

  const totalEarnings = MOCK_EARNINGS.reduce((s, e) => s + parseFloat(e.devShare), 0);
  const joinedCount = MOCK_SKILLS.filter((s) => s.inAlliance).length;

  if (loading) return <div style={{ padding: 80, textAlign: "center", color: "var(--muted)" }}>{common("loading")}</div>;

  const tabs = [
    { key: "tabOverview", label: t("tabOverview") },
    { key: "tabRegister", label: t("tabRegister") },
    { key: "tabMarketDemand", label: t("tabMarketDemand") },
    { key: "tabIpVault", label: t("tabIpVault") },
    { key: "tabSkills", label: t("tabSkills") },
    { key: "tabEarnings", label: t("tabEarnings") },
  ];

  const openDemands = demands.filter((d) => d.status === "open");

  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "40px 24px" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, margin: "0 0 8px" }}>{t("title")}</h1>
        <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>{t("subtitle")}</p>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 0, marginBottom: 28, borderBottom: "1px solid var(--hairline-on-dark)", overflowX: "auto" }}>
        {tabs.map((tab, i) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(i)}
            style={{
              padding: "12px 20px", fontSize: 13, fontWeight: activeTab === i ? 600 : 400,
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

      {/* ── Tab 0: Overview ── */}
      {activeTab === 0 && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
            {[
              { label: t("joinedSkills"), value: String(joinedCount), color: "var(--primary)" },
              { label: t("totalAllianceEarnings"), value: `$${totalEarnings.toFixed(2)}`, color: "var(--trading-up)" },
              { label: t("monthlyEarnings"), value: "$3,520.00", color: "var(--trading-up)" },
              { label: t("activeResellers"), value: "12", color: "#3b82f6" },
            ].map((stat, i) => (
              <div key={i} style={{ padding: 18, borderRadius: 10, background: "rgba(59,130,246,0.04)", border: "1px solid var(--hairline-on-dark)", textAlign: "center" }}>
                <div style={{ fontFamily: "monospace", fontSize: 24, fontWeight: 700, color: stat.color, marginBottom: 4 }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Quick Action Cards */}
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px" }}>{t("quickActions")}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
            {[
              { title: t("tabRegister"), desc: t("registerDesc"), action: t("goToRegister"), openModal: true, color: "rgba(59,130,246,0.1)", icon: "📝" },
              { title: t("tabMarketDemand"), desc: t("marketDemandDesc"), action: t("goToMarketDemand"), tab: 2, color: "rgba(14,203,129,0.1)", icon: "📋" },
              { title: t("tabIpVault"), desc: t("ipVaultDesc"), action: t("goToIpVault"), tab: 3, color: "rgba(245,158,11,0.1)", icon: "🛡" },
            ].map((card, i) => (
              <div key={i} style={{ padding: 22, borderRadius: 10, background: card.color, border: "1px solid var(--hairline-on-dark)", cursor: "pointer" }}
                onClick={() => card.openModal ? openRegisterModal() : setActiveTab(card.tab!)}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{card.icon}</div>
                <h4 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 6px" }}>{card.title}</h4>
                <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5, margin: "0 0 12px" }}>{card.desc}</p>
                <span style={{ fontSize: 12, color: "var(--primary)", fontWeight: 600 }}>{card.action}</span>
              </div>
            ))}
          </div>

          <div className="card-dark" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px" }}>{t("earningsTrend")}</h3>
            <div style={{ height: 200, display: "flex", alignItems: "flex-end", gap: 8, padding: "0 8px" }}>
              {[40, 55, 38, 62, 48, 70, 52, 65, 45, 72, 58, 68, 50, 75, 55, 80, 60, 72, 48, 85, 62, 78, 55, 90, 65, 82, 58, 88, 70, 95].map((h, i) => (
                <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: "3px 3px 0 0", background: h > 70 ? "var(--trading-up)" : "rgba(59,130,246,0.4)", opacity: 0.8 }} />
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 10, color: "var(--muted)" }}>
              <span>30 days ago</span><span>Today</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 1: My Skills ── */}
      {activeTab === 1 && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 4px" }}>{t("tabRegister")}</h3>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>{t("registerDesc")}</p>
            </div>
            <button className="btn-primary" style={{ height: 38, fontSize: 13, padding: "0 20px" }}
              onClick={openRegisterModal}>
              {t("goToRegister")}
            </button>
          </div>

          {registeredSkills.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: "var(--muted)" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
              <p style={{ fontSize: 14, marginBottom: 16 }}>{t("noRegisteredSkills")}</p>
              <button className="btn-primary" style={{ height: 38, fontSize: 13, padding: "0 24px" }}
                onClick={openRegisterModal}>
                {t("goToRegister")}
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
              {registeredSkills.map((s) => (
                <div key={s.id} className="card-dark" style={{ padding: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 6 }}>
                    <h4 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{s.name}</h4>
                    <span style={{
                      fontSize: 10, padding: "2px 8px", borderRadius: 10,
                      background: s.status === "approved" ? "rgba(14,203,129,0.15)" : s.status === "rejected" ? "rgba(239,68,68,0.15)" : "rgba(59,130,246,0.15)",
                      color: s.status === "approved" ? "var(--trading-up)" : s.status === "rejected" ? "#ef4444" : "var(--primary)",
                    }}>
                      {s.status === "approved" ? t("approved") : s.status === "rejected" ? t("rejected") : t("pendingReview")}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5, margin: "0 0 10px" }}>{s.description}</p>
                  <div style={{ display: "flex", gap: 16, fontSize: 11, color: "var(--muted)", flexWrap: "wrap" }}>
                    <span>{s.category}</span>
                    {s.buyoutPrice && <span style={{ fontFamily: "monospace" }}>Buyout: ${s.buyoutPrice}</span>}
                    {s.subscriptionMonthly && <span style={{ fontFamily: "monospace" }}>Sub: ${s.subscriptionMonthly}/mo</span>}
                    {s.alliance && <span style={{ color: "#3b82f6" }}>Alliance</span>}
                    {s.ipVaultLevel && <span style={{ color: "#f59e0b" }}>IP {s.ipVaultLevel}</span>}
                  </div>
                  {s.status === "approved" && s.buyoutPrice && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--hairline-on-dark)" }}>
                      <button className="btn-primary" style={{ height: 30, fontSize: 11, width: "100%" }}
                        onClick={() => { setSellLinkSkill(s); setSellLinkUrl(""); setSellLinkCopied(false); setSellLinkTrialQuota(50); setSellLinkTrialTTL(72); }}>
                        {t("generateSellLink")}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab 2: Market Demand ── */}
      {activeTab === 2 && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 4px" }}>{t("tabMarketDemand")}</h3>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>{t("marketDemandDesc")}</p>
            </div>
            <span className="badge badge-blue" style={{ fontSize: 12 }}>{t("openDemands")}: {openDemands.length}</span>
          </div>

          {demands.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: "var(--muted)" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
              <p style={{ fontSize: 14 }}>{t("noDemands")}</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
              {demands.map((d) => (
                <div key={d.id} className="card-dark" style={{ padding: 20, opacity: d.status === "fulfilled" ? 0.6 : 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <h4 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{d.title}</h4>
                    <span className={d.status === "open" ? "badge badge-green" : "badge badge-muted"} style={{ fontSize: 10 }}>
                      {d.status === "open" ? t("openDemands") : t("fulfilledDemands")}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5, margin: "0 0 12px" }}>{d.description}</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                    <div><span style={{ fontSize: 10, color: "var(--muted)" }}>{t("demandCategory")}</span><div style={{ fontSize: 12, fontWeight: 600 }}>{d.category}</div></div>
                    <div><span style={{ fontSize: 10, color: "var(--muted)" }}>{t("demandBudget")}</span><div style={{ fontSize: 13, fontFamily: "monospace", fontWeight: 700, color: "var(--primary)" }}>${d.budget}</div></div>
                    <div><span style={{ fontSize: 10, color: "var(--muted)" }}>{t("demandDeadline")}</span><div style={{ fontSize: 12 }}>{d.deadline}</div></div>
                    <div><span style={{ fontSize: 10, color: "var(--muted)" }}>{t("demandPoster")}</span><div style={{ fontSize: 11, fontFamily: "monospace" }}>{d.poster}</div></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab 3: IP Vault ── */}
      {activeTab === 3 && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 4px" }}>{t("tabIpVault")}</h3>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>{t("ipVaultDesc")}</p>
            </div>
            <button className="btn-primary" style={{ height: 38, fontSize: 13, padding: "0 20px" }}
              onClick={() => router.push("/developer/ip-vault")}>
              {t("goToIpVault")}
            </button>
          </div>

          {ipAssets.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: "var(--muted)" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🛡</div>
              <p style={{ fontSize: 14, marginBottom: 16 }}>{t("noIps")}</p>
              <button className="btn-primary" style={{ height: 38, fontSize: 13, padding: "0 24px" }}
                onClick={() => router.push("/developer/ip-vault")}>
                {t("goToIpVault")}
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
              {ipAssets.map((ip) => (
                <div key={ip.id} className="card-dark" style={{ padding: 18, background: "rgba(245,158,11,0.03)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 6 }}>
                    <h4 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{ip.name}</h4>
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>v{ip.version}</span>
                  </div>
                  {ip.description && <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5, margin: "0 0 8px" }}>{ip.description}</p>}
                  <div style={{ fontSize: 10, fontFamily: "monospace", color: "var(--muted)", marginBottom: 8, wordBreak: "break-all" }}>{ip.hash}</div>
                  <div style={{ display: "flex", gap: 16, fontSize: 11 }}>
                    <span style={{ color: "var(--trading-up)" }}>🛡 {t("ipProtected")}</span>
                    <span style={{ color: "var(--muted)" }}>{t("ipLastVerified")}: {new Date(ip.registeredAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab 4: Alliance Management ── */}
      {activeTab === 4 && (
        <div className="card-dark" style={{ overflowX: "auto" }}>
          <table className="table-dark">
            <thead>
              <tr>
                <th>{t("skillName")}</th>
                <th>{t("pricingMode")}</th>
                <th>{t("inAlliance")}</th>
                <th>{t("allianceBasePrice")}</th>
                <th>{t("estMonthlyEarnings")}</th>
                <th>{common("action")}</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_SKILLS.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600 }}>{s.name}</td>
                  <td>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: s.pricingModel === "mode2" ? "rgba(59,130,246,0.12)" : "rgba(14,203,129,0.1)", color: s.pricingModel === "mode2" ? "#3b82f6" : "var(--trading-up)" }}>
                      {s.pricingModel === "mode2" ? "Alliance" : "Autonomous"}
                    </span>
                  </td>
                  <td>
                    {s.inAlliance ? (
                      <span style={{ color: "var(--trading-up)", fontWeight: 600 }}>✓ {s.status === "cooling_down" ? t("coolingDown") + ` (${t("coolingDownDays", { days: s.coolingDays })})` : ""}</span>
                    ) : (
                      <span style={{ color: "var(--muted)" }}>—</span>
                    )}
                  </td>
                  <td style={{ fontFamily: "monospace" }}>{s.inAlliance ? `$${s.allianceBasePrice}` : "—"}</td>
                  <td style={{ fontFamily: "monospace", color: "var(--trading-up)" }}>{s.inAlliance ? `$${s.estMonthlyEarnings}` : "—"}</td>
                  <td>
                    {s.inAlliance ? (
                      <button className="btn-secondary" style={{ height: 28, fontSize: 11, color: "var(--trading-down)" }} onClick={() => setLeaveModal(s)}>
                        {t("leaveAlliance")}
                      </button>
                    ) : (
                      <button className="btn-primary" style={{ height: 28, fontSize: 11 }} onClick={() => setJoinModal(s)}>
                        {t("joinAlliance")}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Tab 5: Earnings ── */}
      {activeTab === 5 && (
        <div>
          <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
            <select className="input-dark" style={{ height: 36, fontSize: 12, padding: "0 12px" }}>
              <option>{t("allSkills")}</option>
              {MOCK_SKILLS.filter((s) => s.inAlliance).map((s) => (
                <option key={s.id}>{s.name}</option>
              ))}
            </select>
            <div style={{ fontSize: 13, fontFamily: "monospace", color: "var(--trading-up)", fontWeight: 600, marginLeft: "auto" }}>
              {t("totalEarnings")}: ${totalEarnings.toFixed(4)}
            </div>
            <button className="btn-primary" style={{ height: 36, fontSize: 12 }}>{t("withdraw")}</button>
          </div>

          <div className="card-dark" style={{ overflowX: "auto" }}>
            <table className="table-dark">
              <thead>
                <tr>
                  <th>{t("date")}</th>
                  <th>{t("skillName")}</th>
                  <th>{t("calls")}</th>
                  <th>{t("allianceBasePrice")}</th>
                  <th>{t("devShare")}</th>
                  <th>{common("status")}</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_EARNINGS.map((e, i) => (
                  <tr key={i}>
                    <td>{e.date}</td>
                    <td>{e.skillName}</td>
                    <td style={{ fontFamily: "monospace" }}>{e.calls.toLocaleString()}</td>
                    <td style={{ fontFamily: "monospace" }}>${e.basePrice}</td>
                    <td style={{ fontFamily: "monospace", color: "var(--trading-up)", fontWeight: 600 }}>${e.devShare}</td>
                    <td>
                      <span className={e.status === "settled" ? "badge badge-green" : "badge badge-yellow"}>
                        {e.status === "settled" ? t("settled") : t("pending")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Join Alliance Modal ── */}
      {joinModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="card-dark" style={{ maxWidth: 480, width: "100%", padding: 28 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 4px" }}>{t("joinAllianceTitle")}</h3>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 8px", fontFamily: "monospace" }}>{joinModal.name}</p>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 16px", lineHeight: 1.6 }}>{t("joinAllianceDesc")}</p>
            <div style={{ padding: 14, borderRadius: 8, background: "rgba(59,130,246,0.06)", marginBottom: 16 }}>
              <div style={{ display: "flex", height: 18, borderRadius: 3, overflow: "hidden", marginBottom: 8 }}>
                <div style={{ width: "10%", background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#fff", fontWeight: 600 }}>AIMS 10%</div>
                <div style={{ width: "40%", background: "#0ecb81", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#fff", fontWeight: 600 }}>Dev 40%</div>
                <div style={{ width: "50%", background: "#fcd535", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#000", fontWeight: 600 }}>Promoter 50%</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: "var(--muted)" }}>Est. Alliance Base Price:</span>
                <span style={{ fontFamily: "monospace", fontWeight: 600 }}>${joinModal.allianceBasePrice}/10K tokens</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setJoinModal(null)}>{common("cancel")}</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={() => setJoinModal(null)}>{t("joinAllianceConfirm")}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Skill Registration Modal ── */}
      {showRegisterModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
          <div className="card-dark" style={{ maxWidth: 620, width: "100%", maxHeight: "90vh", overflowY: "auto", padding: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{t("goToRegister")}</h3>
              <button className="btn-secondary" style={{ height: 32, width: 32, fontSize: 16, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                onClick={closeRegisterModal}>✕</button>
            </div>

            {regSubmitted ? (
              <div style={{ textAlign: "center", padding: 40 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
                <p style={{ fontSize: 16, fontWeight: 600, color: "var(--trading-up)" }}>{t("skillRegistered")}</p>
              </div>
            ) : (
              <>
                {/* Progress steps */}
                <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
                  {[t("step1"), t("step2"), t("stepDependencies"), t("step4"), t("step3")].map((label, i) => (
                    <div key={label} style={{ flex: 1 }}>
                      <div style={{ height: 4, borderRadius: 2, background: regStep > i + 1 ? "var(--trading-up)" : regStep >= i + 1 ? "var(--primary)" : "var(--hairline-on-dark)", marginBottom: 8 }} />
                      <span style={{ fontSize: 11, color: regStep >= i + 1 ? "var(--body)" : "var(--muted)" }}>{label}</span>
                    </div>
                  ))}
                </div>

                {/* Step 1: Basic Info */}
                {regStep === 1 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>{t("skillNameLabel")}</label>
                      <input className="input-dark" value={regName} onChange={(e) => setRegName(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>{t("skillDescLabel")}</label>
                      <textarea className="input-dark" rows={3} value={regDesc} onChange={(e) => setRegDesc(e.target.value)} style={{ height: "auto", resize: "vertical" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>{t("skillCategoryLabel")}</label>
                      <select className="input-dark" value={regCategory} onChange={(e) => setRegCategory(e.target.value)}>
                        <option value="cat_ai">AI & Machine Learning</option>
                        <option value="cat_blockchain">Blockchain & Web3</option>
                        <option value="cat_data">Data Processing</option>
                        <option value="cat_ecommerce">E-Commerce</option>
                        <option value="cat_design">Design</option>
                        <option value="cat_finance">Finance</option>
                        <option value="cat_aitools">AI Tools</option>
                        <option value="cat_food">Food & Beverage</option>
                        <option value="cat_manufacturing">Manufacturing</option>
                        <option value="cat_healthcare">Healthcare</option>
                        <option value="cat_education">Education</option>
                        <option value="cat_legal">Legal</option>
                        <option value="cat_realestate">Real Estate</option>
                        <option value="cat_logistics">Logistics & Supply Chain</option>
                        <option value="cat_entertainment">Entertainment & Media</option>
                        <option value="cat_agriculture">Agriculture</option>
                        <option value="cat_gaming">Gaming</option>
                        <option value="cat_hr">Human Resources</option>
                        <option value="cat_travel">Travel & Hospitality</option>
                        <option value="cat_energy">Energy</option>
                        <option value="cat_marketing">Marketing & Advertising</option>
                        <option value="cat_uncategorized">Uncategorized</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>{t("tags")}</label>
                      <input className="input-dark" placeholder="PyTorch, CUDA, Streaming" value={regTags} onChange={(e) => setRegTags(e.target.value)} />
                    </div>

                    {/* Source Repository */}
                    <div style={{ borderTop: "1px solid var(--hairline-on-dark)", paddingTop: 14, marginTop: 4 }}>
                      <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>{t("sourceRepo")}</label>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 10, lineHeight: 1.5 }}>{t("sourceRepoHint2")}</div>
                      <input className="input-dark" placeholder="https://github.com/username/model-repo" value={regRepoUrl} onChange={(e) => setRegRepoUrl(e.target.value)} />
                      {regRepoUrl && (
                        <div style={{ fontSize: 11, color: "var(--trading-up)", marginTop: 4 }}>
                          ✓ {t("mirrorHint")}
                        </div>
                      )}

                      <div style={{ marginTop: 14, padding: 14, borderRadius: 8, background: "rgba(59,130,246,0.04)", border: "1px solid var(--hairline-on-dark)" }}>
                        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{t("uploadCode")}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 10, lineHeight: 1.5 }}>{t("uploadCodeHint")}</div>
                        <input type="file" accept=".zip,.tar.gz,.tgz" onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setRegUploadFile(file);
                          setRegUploadName(file ? file.name : "");
                        }} style={{ fontSize: 12 }} />
                        {regUploadName && (
                          <div style={{ fontSize: 11, color: "var(--trading-up)", marginTop: 6 }}>
                            ✓ {regUploadName}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                      <button className="btn-secondary" onClick={closeRegisterModal}>{common("cancel")}</button>
                      <button className="btn-primary" onClick={() => setRegStep(2)}>{common("next")}</button>
                    </div>
                  </div>
                )}

                {/* Step 2: Trade & Pricing */}
                {regStep === 2 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Buyout */}
                    <div style={{ padding: 14, borderRadius: 8, border: regBuyoutPrice ? "1px solid var(--primary)" : "1px solid var(--hairline-on-dark)", background: regBuyoutPrice ? "rgba(14,203,129,0.04)" : "transparent" }}>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{t("buyoutModel")}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 10 }}>{t("buyoutModelDesc")}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 13, color: "var(--muted)" }}>USDT</span>
                        <input className="input-dark" type="number" placeholder="5000" value={regBuyoutPrice} onChange={(e) => setRegBuyoutPrice(e.target.value)} style={{ width: 160, height: 36, fontSize: 14, fontFamily: "monospace" }} />
                        <span style={{ fontSize: 11, color: "var(--muted)" }}>{t("buyoutPriceHint")}</span>
                      </div>
                    </div>

                    {/* Subscription */}
                    <div style={{ padding: 14, borderRadius: 8, border: regSubMonthly ? "1px solid var(--primary)" : "1px solid var(--hairline-on-dark)", background: regSubMonthly ? "rgba(59,130,246,0.04)" : "transparent" }}>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{t("subscriptionModel")}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 10 }}>{t("subscriptionModelDesc")}</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        <div>
                          <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>{t("subscriptionMonthlyPrice")} (USDT)</label>
                          <input className="input-dark" type="number" placeholder="99" value={regSubMonthly} onChange={(e) => setRegSubMonthly(e.target.value)} style={{ width: "100%", height: 36, fontSize: 14, fontFamily: "monospace" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>{t("yearlyPrice")}</label>
                          <input className="input-dark" readOnly value={regSubMonthly ? (parseFloat(regSubMonthly) * 12 * 0.8).toFixed(2) : ""} style={{ width: "100%", height: 36, fontSize: 14, fontFamily: "monospace", background: "var(--canvas-dark)", opacity: 0.7 }} />
                          <div style={{ fontSize: 10, color: "var(--trading-up)", marginTop: 2 }}>{t("yearlyAutoDiscount")}</div>
                        </div>
                      </div>
                    </div>

                    {/* Alliance */}
                    <label style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: 8, border: regAlliance ? "1px solid var(--primary)" : "1px solid var(--hairline-on-dark)", background: regAlliance ? "rgba(59,130,246,0.04)" : "transparent", cursor: "pointer" }}>
                      <input type="checkbox" checked={regAlliance} onChange={(e) => setRegAlliance(e.target.checked)} style={{ marginTop: 2 }} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#3b82f6" }}>{t("joinAlliance")}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4, lineHeight: 1.5 }}>{t("allianceCheckboxDesc")}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                          {t("mode2SplitPreview")}
                        </div>
                      </div>
                    </label>

                    <div style={{ display: "flex", gap: 12, justifyContent: "space-between" }}>
                      <button className="btn-secondary" onClick={() => setRegStep(1)}>{common("previous")}</button>
                      <button className="btn-primary" onClick={() => setRegStep(3)}>{common("next")}</button>
                    </div>
                  </div>
                )}

                {/* Step 3: Dependencies */}
                {regStep === 3 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ padding: 14, borderRadius: 8, background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)", marginBottom: 4 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#3b82f6", marginBottom: 4 }}>{t("stepDependencies")}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.5 }}>{t("depHint")}</div>
                    </div>

                    <div>
                      <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>
                        {t("depModels")} <span style={{ fontSize: 10, opacity: 0.6 }}>{t("depModelsHint")}</span>
                      </label>
                      <textarea className="input-dark" rows={3} placeholder="anthropic:claude-4.5 (综合分析和报告生成)&#10;openai:gpt-4o (文本处理)"
                        value={regDepModels} onChange={(e) => setRegDepModels(e.target.value)}
                        style={{ height: "auto", resize: "vertical", fontFamily: "monospace", fontSize: 11 }} />
                    </div>

                    <div>
                      <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>
                        {t("depApis")} <span style={{ fontSize: 10, opacity: 0.6 }}>{t("depApisHint")}</span>
                      </label>
                      <textarea className="input-dark" rows={3} placeholder="Google Search:google (公开信息检索)&#10;Hunter:hunter (公司邮箱验证) — 环境变量: HUNTER_API_KEY"
                        value={regDepApis} onChange={(e) => setRegDepApis(e.target.value)}
                        style={{ height: "auto", resize: "vertical", fontFamily: "monospace", fontSize: 11 }} />
                    </div>

                    <div>
                      <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>
                        {t("depWorkflow")} <span style={{ fontSize: 10, opacity: 0.6 }}>{t("depWorkflowHint")}</span>
                      </label>
                      <textarea className="input-dark" rows={3} placeholder="Step 1: Google 搜公司基础信息&#10;Step 2: 天眼查拉工商数据&#10;Step 3: Hunter 验证联系方式&#10;Step 4: Claude 汇总生成报告"
                        value={regDepWorkflow} onChange={(e) => setRegDepWorkflow(e.target.value)}
                        style={{ height: "auto", resize: "vertical", fontSize: 11 }} />
                    </div>

                    <div style={{ display: "flex", gap: 12, justifyContent: "space-between" }}>
                      <button className="btn-secondary" onClick={() => setRegStep(2)}>{common("previous")}</button>
                      <button className="btn-primary" onClick={() => setRegStep(4)}>{common("next")}</button>
                    </div>
                  </div>
                )}

                {/* Step 4: IP Vault */}
                {regStep === 4 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ padding: 14, borderRadius: 8, background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)", marginBottom: 4 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#3b82f6", marginBottom: 4 }}>{t("ipVaultTitle")}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.5 }}>{t("ipVaultDesc")}</div>
                    </div>

                    {(["L1", "L2", "L3"] as const).map((level) => (
                      <label key={level} style={{
                        display: "flex", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: 8, cursor: "pointer",
                        border: regIpVault === level ? "2px solid var(--primary)" : "1px solid var(--hairline-on-dark)",
                        background: regIpVault === level ? "rgba(252,213,53,0.04)" : "transparent",
                      }} onClick={() => setRegIpVault(level)}>
                        <input type="radio" name="regIpVault" checked={regIpVault === level} onChange={() => setRegIpVault(level)} style={{ marginTop: 2 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>
                              {level === "L1" ? t("l1Basic") : level === "L2" ? t("l2Pro") : t("l3Judicial")}
                            </div>
                            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, fontWeight: 600,
                              background: level === "L1" ? "rgba(14,203,129,0.12)" : level === "L2" ? "rgba(59,130,246,0.12)" : "rgba(245,158,11,0.12)",
                              color: level === "L1" ? "var(--trading-up)" : level === "L2" ? "#3b82f6" : "#f59e0b" }}>
                              {level === "L1" ? common("free") : level === "L2" ? "$5 one-time" : "$19 one-time"}
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4, lineHeight: 1.5 }}>
                            {level === "L1" ? t("l1BasicDesc") : level === "L2" ? t("l2ProDesc") : t("l3JudicialDesc")}
                          </div>
                        </div>
                      </label>
                    ))}

                    <div style={{ display: "flex", gap: 12, justifyContent: "space-between" }}>
                      <button className="btn-secondary" onClick={() => setRegStep(3)}>{common("previous")}</button>
                      <button className="btn-primary" onClick={() => setRegStep(5)}>{common("next")}</button>
                    </div>
                  </div>
                )}

                {/* Step 5: Review & Submit */}
                {regStep === 5 && (
                  <div>
                    <h4 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px" }}>{t("reviewTitle")}</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                      {[
                        { label: common("name"), value: regName || "—" },
                        { label: t("skillCategoryLabel"), value: regCategory },
                        { label: t("tags"), value: regTags || "—" },
                        { label: t("sourceRepo"), value: regRepoUrl || (regUploadName ? regUploadName : "—"), color: regUploadName ? "var(--trading-up)" : undefined },
                        ...(regBuyoutPrice ? [{ label: t("buyoutModel"), value: `$${regBuyoutPrice} USDT` }] : []),
                        ...(regSubMonthly ? [{ label: t("subscriptionModel"), value: `$${regSubMonthly}/mo · $${(parseFloat(regSubMonthly) * 12 * 0.8).toFixed(2)}/yr` }] : []),
                        ...(regAlliance ? [{ label: t("alliancePlan"), value: t("mode2SplitPreview"), color: "#3b82f6" }] : []),
                        { label: t("ipVaultTitle"), value: regIpVault === "L1" ? t("l1Basic") : regIpVault === "L2" ? t("l2Pro") : t("l3Judicial") },
                      ].map((r) => (
                        <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--hairline-on-dark)" }}>
                          <span style={{ color: "var(--muted)", fontSize: 12 }}>{r.label}</span>
                          <span style={{ fontSize: 13, fontWeight: 500, color: r.color || "inherit", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.value}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 12, justifyContent: "space-between" }}>
                      <button className="btn-secondary" onClick={() => setRegStep(4)}>{common("previous")}</button>
                      <button className="btn-primary" onClick={handleRegisterSubmit}>{t("registerSkill")}</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Leave Alliance Modal ── */}
      {leaveModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="card-dark" style={{ maxWidth: 480, width: "100%", padding: 28 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 4px", color: "var(--trading-down)" }}>{t("leaveAllianceTitle")}</h3>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 8px", fontFamily: "monospace" }}>{leaveModal.name}</p>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 16px", lineHeight: 1.6 }}>{t("leaveAllianceDesc")}</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setLeaveModal(null)}>{common("cancel")}</button>
              <button className="btn-primary" style={{ flex: 1, background: "var(--trading-down)" }} onClick={() => setLeaveModal(null)}>{t("leaveAllianceConfirm")}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sell Link Modal ── */}
      {sellLinkSkill && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="card-dark" style={{ maxWidth: 520, width: "100%", padding: 28 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 4px" }}>{t("sellLinkTitle")}</h3>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 8px", fontFamily: "monospace" }}>{sellLinkSkill.name}</p>
            <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 16px", lineHeight: 1.5 }}>{t("sellLinkDesc")}</p>

            {sellLinkUrl ? (
              <div>
                <div style={{ padding: 10, borderRadius: 6, background: "rgba(0,0,0,0.3)", marginBottom: 12, display: "flex", gap: 8, alignItems: "center" }}>
                  <code style={{ flex: 1, fontSize: 11, fontFamily: "monospace", color: "var(--trading-up)", wordBreak: "break-all" }}>{sellLinkUrl}</code>
                  <button className="btn-secondary" style={{ height: 30, fontSize: 11, whiteSpace: "nowrap" }}
                    onClick={() => { navigator.clipboard.writeText(sellLinkUrl); setSellLinkCopied(true); setTimeout(() => setSellLinkCopied(false), 2000); }}>
                    {sellLinkCopied ? "✓" : t("copySellLink")}
                  </button>
                </div>
                <div style={{ fontSize: 11, color: "var(--trading-up)", marginBottom: 12 }}>
                  {t("sellLinkGenerated")}
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>{t("trialQuota")}</label>
                  <input className="input-dark" type="number" value={sellLinkTrialQuota} onChange={(e) => setSellLinkTrialQuota(Number(e.target.value))}
                    style={{ width: "100%", height: 34, fontSize: 13 }} min={1} max={10000} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>{t("trialTTL")}</label>
                  <input className="input-dark" type="number" value={sellLinkTrialTTL} onChange={(e) => setSellLinkTrialTTL(Number(e.target.value))}
                    style={{ width: "100%", height: 34, fontSize: 13 }} min={1} max={720} />
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setSellLinkSkill(null)}>{common("cancel")}</button>
              {!sellLinkUrl && (
                <button className="btn-primary" style={{ flex: 1 }} onClick={() => {
                  const url = `${typeof window !== "undefined" ? window.location.origin : ""}/buy?skill=${encodeURIComponent(sellLinkSkill.id)}&name=${encodeURIComponent(sellLinkSkill.name)}&price=${encodeURIComponent(sellLinkSkill.buyoutPrice)}&quota=${sellLinkTrialQuota}&ttl=${sellLinkTrialTTL}`;
                  setSellLinkUrl(url);
                }}>
                  {t("generateSellLink")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
