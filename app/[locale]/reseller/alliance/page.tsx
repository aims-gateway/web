"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

interface ShelfSkill {
  id: string;
  name: string;
  category: string;
  allianceBasePrice: string;
  baseCommission: string;
  developer: string;
  monthlyVolume: string;
  distributing: boolean;
}

interface MyDistributedSkill {
  id: string;
  name: string;
  allianceBasePrice: string;
  mySellPrice: string;
  markupRate: string;
  baseCommission: string;
  markupProfit: string;
  totalRevenue: string;
  status: "active" | "paused";
}

interface SalesEntry {
  time: string;
  skillName: string;
  consumer: string;
  basePricePaid: string;
  markupEarned: string;
  commissionEarned: string;
  totalEarned: string;
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

function loadDemands(): Demand[] {
  if (typeof window === "undefined") return [];
  const raw = sessionStorage.getItem("aims_demands");
  return raw ? JSON.parse(raw) : [];
}

function saveDemands(demands: Demand[]) {
  sessionStorage.setItem("aims_demands", JSON.stringify(demands));
}

export default function ResellerAlliancePage() {
  const t = useTranslations("ResellerAlliancePage");
  const common = useTranslations("Common");
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [pricingSkill, setPricingSkill] = useState<ShelfSkill | null>(null);
  const [sellPrice, setSellPrice] = useState("");
  const [priceSaved, setPriceSaved] = useState(false);
  const [copiedLink, setCopiedLink] = useState("");
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [demands, setDemands] = useState<Demand[]>([]);
  const [demandForm, setDemandForm] = useState({ title: "", description: "", category: "LLM Inference", budget: "", deadline: "" });
  const [demandPublished, setDemandPublished] = useState(false);

  useEffect(() => { setDemands(loadDemands()); }, []);

  const posterAddress = typeof window !== "undefined" ? sessionStorage.getItem("aims_wallet") || "0x0000" : "0x0000";

  const handlePublishDemand = () => {
    if (!demandForm.title || !demandForm.description || !demandForm.budget || !demandForm.deadline) return;
    const newDemand: Demand = {
      id: Date.now().toString(36),
      title: demandForm.title,
      description: demandForm.description,
      category: demandForm.category,
      budget: demandForm.budget,
      deadline: demandForm.deadline,
      poster: posterAddress,
      postedAt: new Date().toISOString(),
      status: "open",
    };
    const updated = [newDemand, ...demands];
    saveDemands(updated);
    setDemands(updated);
    setDemandForm({ title: "", description: "", category: "LLM Inference", budget: "", deadline: "" });
    setDemandPublished(true);
    setTimeout(() => setDemandPublished(false), 3000);
  };

  const myDemands = demands.filter((d) => d.poster === posterAddress);

  const handleFulfillDemand = (id: string) => {
    const updated = demands.map((d) => d.id === id ? { ...d, status: "fulfilled" as const } : d);
    saveDemands(updated);
    setDemands(updated);
  };

  useEffect(() => {
    if (!sessionStorage.getItem("aims_wallet")) { router.push("/login"); return; }
    setLoading(false);
  }, [router]);

  const shelfSkills: ShelfSkill[] = [
    { id: "4", name: "Whisper Large v3 TTS", category: "Audio & TTS", allianceBasePrice: "0.0020", baseCommission: "0.0005", developer: "0xf39F...2266", monthlyVolume: "2.4M", distributing: true },
    { id: "5", name: "Mixtral 8x7B MoE", category: "LLM Inference", allianceBasePrice: "0.0050", baseCommission: "0.00125", developer: "0x7099...79C8", monthlyVolume: "18M", distributing: true },
    { id: "7", name: "DeepSeek-R1 Reasoning", category: "LLM Inference", allianceBasePrice: "0.0080", baseCommission: "0.00200", developer: "0xA1B2...C3D4", monthlyVolume: "45M", distributing: false },
    { id: "8", name: "Claude-3-Opus Compatible", category: "LLM Inference", allianceBasePrice: "0.0150", baseCommission: "0.00375", developer: "0xE5F6...G7H8", monthlyVolume: "32M", distributing: false },
  ];

  const mySkills: MyDistributedSkill[] = [
    { id: "4", name: "Whisper Large v3 TTS", allianceBasePrice: "0.0020", mySellPrice: "0.0030", markupRate: "+50%", baseCommission: "0.0005", markupProfit: "0.0010", totalRevenue: "0.0015", status: "active" },
    { id: "5", name: "Mixtral 8x7B MoE", allianceBasePrice: "0.0050", mySellPrice: "0.0080", markupRate: "+60%", baseCommission: "0.00125", markupProfit: "0.0030", totalRevenue: "0.00425", status: "active" },
  ];

  const sales: SalesEntry[] = [
    { time: "2 hours ago", skillName: "Mixtral 8x7B MoE", consumer: "0x3C44...93BC", basePricePaid: "0.0050", markupEarned: "0.0030", commissionEarned: "0.00125", totalEarned: "0.00425" },
    { time: "5 hours ago", skillName: "Whisper Large v3 TTS", consumer: "0x90F7...b906", basePricePaid: "0.0020", markupEarned: "0.0010", commissionEarned: "0.0005", totalEarned: "0.0015" },
    { time: "8 hours ago", skillName: "Mixtral 8x7B MoE", consumer: "0x15d3...6A65", basePricePaid: "0.0050", markupEarned: "0.0030", commissionEarned: "0.00125", totalEarned: "0.00425" },
    { time: "1 day ago", skillName: "Whisper Large v3 TTS", consumer: "0xA1B2...C3D4", basePricePaid: "0.0020", markupEarned: "0.0010", commissionEarned: "0.0005", totalEarned: "0.0015" },
  ];

  const handleSelectPricing = (skill: ShelfSkill) => {
    setPricingSkill(skill);
    setSellPrice((parseFloat(skill.allianceBasePrice) * 1.5).toFixed(4));
    setPriceSaved(false);
  };

  const calcMarkup = () => {
    if (!pricingSkill || !sellPrice) return { markupAmount: "0", markupPct: "0", commission: "0", total: "0" };
    const base = parseFloat(pricingSkill.allianceBasePrice);
    const sell = parseFloat(sellPrice);
    const commission = base * 0.25;
    const markup = sell - base;
    const pct = ((sell - base) / base * 100);
    return {
      markupAmount: markup.toFixed(4),
      markupPct: pct.toFixed(0),
      commission: commission.toFixed(4),
      total: (commission + markup).toFixed(4),
    };
  };

  const totalRevenue = sales.reduce((s, e) => s + parseFloat(e.totalEarned), 0);

  if (loading) return <div style={{ padding: 80, textAlign: "center", color: "var(--muted)" }}>{common("loading")}</div>;

  const tabs = [
    { key: "tabShelf", label: t("tabShelf") },
    { key: "tabMySkills", label: t("tabMySkills") },
    { key: "tabPricing", label: t("tabPricing") },
    { key: "tabSales", label: t("tabSales") },
    { key: "tabTools", label: t("tabTools") },
    { key: "tabPublishDemand", label: t("tabPublishDemand") },
  ];

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
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

      {/* ── Tab 0: Alliance Shelf ── */}
      {activeTab === 0 && (
        <div>
          <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
            <input className="input-dark" placeholder={t("searchSkills")} style={{ flex: 1, height: 36, fontSize: 13 }} />
            <select className="input-dark" style={{ height: 36, fontSize: 12, padding: "0 12px" }}>
              <option>{t("allCategories")}</option>
              <option>LLM Inference</option>
              <option>Image Generation</option>
              <option>Code & Audit</option>
              <option>Audio & TTS</option>
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
            {shelfSkills.map((skill) => {
              const c = calcMarkup;
              return (
                <div key={skill.id} style={{ padding: 18, borderRadius: 10, border: "1px solid var(--hairline-on-dark)", background: skill.distributing ? "rgba(59,130,246,0.03)" : "transparent" }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{skill.name}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 12 }}>{skill.category} · {skill.developer}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 10, color: "var(--muted)" }}>{t("basePrice")}</div>
                      <div style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 700 }}>${skill.allianceBasePrice}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: "var(--muted)" }}>{t("baseCommission")}</div>
                      <div style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 700, color: "var(--trading-up)" }}>${skill.baseCommission}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 12 }}>{t("monthlyVolume")}: {skill.monthlyVolume} tokens</div>
                  {skill.distributing ? (
                    <button className="btn-secondary" style={{ width: "100%", height: 34, fontSize: 12 }} onClick={() => { setActiveTab(2); handleSelectPricing(skill); }}>
                      {t("distributing")} — {t("adjustPrice")}
                    </button>
                  ) : (
                    <button className="btn-primary" style={{ width: "100%", height: 34, fontSize: 12 }} onClick={() => { setActiveTab(2); handleSelectPricing(skill); }}>
                      {t("startDistributing")}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Tab 1: My Distributed Skills ── */}
      {activeTab === 1 && (
        <div>
          {mySkills.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--muted)", fontSize: 14 }}>{t("noDistributedSkills")}</div>
          ) : (
            <div className="card-dark" style={{ overflowX: "auto" }}>
              <table className="table-dark">
                <thead>
                  <tr>
                    <th>{t("myDistributedSkills")}</th>
                    <th>{t("allianceBaseCost")}</th>
                    <th>{t("mySellPrice")}</th>
                    <th>{t("markupRate")}</th>
                    <th>{t("baseCommission")}</th>
                    <th>{t("markupEarned")}</th>
                    <th>{t("totalRevenue")}</th>
                    <th>{common("action")}</th>
                  </tr>
                </thead>
                <tbody>
                  {mySkills.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
                      <td style={{ fontFamily: "monospace" }}>${s.allianceBasePrice}</td>
                      <td style={{ fontFamily: "monospace", fontWeight: 600 }}>${s.mySellPrice}</td>
                      <td style={{ fontFamily: "monospace", color: "var(--trading-up)" }}>{s.markupRate}</td>
                      <td style={{ fontFamily: "monospace", color: "var(--trading-up)" }}>${s.baseCommission}</td>
                      <td style={{ fontFamily: "monospace", color: "var(--primary)" }}>${s.markupProfit}</td>
                      <td style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--trading-up)" }}>${s.totalRevenue}</td>
                      <td>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button className="btn-secondary" style={{ height: 26, fontSize: 10 }} onClick={() => { setActiveTab(2); handleSelectPricing(shelfSkills.find((sk) => sk.id === s.id) || shelfSkills[0]); }}>{t("adjustPrice")}</button>
                          <button className="btn-secondary" style={{ height: 26, fontSize: 10 }} onClick={() => setActiveTab(4)}>{t("promoteLink")}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 2: Pricing & Markup ── */}
      {activeTab === 2 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div className="card-dark" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 4px" }}>{t("pricingCalculator")}</h3>
            <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 20px" }}>{t("calculatorDesc")}</p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>{t("selectSkill")}</label>
              <select className="input-dark" style={{ width: "100%", height: 40, fontSize: 13 }} value={pricingSkill?.id || ""} onChange={(e) => {
                const s = shelfSkills.find((sk) => sk.id === e.target.value);
                if (s) handleSelectPricing(s);
              }}>
                <option value="">-- {t("selectSkill")} --</option>
                {shelfSkills.map((s) => <option key={s.id} value={s.id}>{s.name} — ${s.allianceBasePrice}/10K</option>)}
              </select>
            </div>

            {pricingSkill && (() => {
              const m = calcMarkup();
              return (
                <div>
                  <div style={{ padding: 14, borderRadius: 8, background: "rgba(59,130,246,0.05)", marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>{t("allianceBaseCost")}</span>
                      <span style={{ fontFamily: "monospace", fontWeight: 600 }}>${pricingSkill.allianceBasePrice}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>{t("baseCommission25")}</span>
                      <span style={{ fontFamily: "monospace", color: "var(--trading-up)" }}>+${m.commission}</span>
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>{t("yourSellPrice")} (USDT)</label>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <input className="input-dark" type="number" step="0.0001" value={sellPrice} onChange={(e) => { setSellPrice(e.target.value); setPriceSaved(false); }} style={{ flex: 1, height: 40, fontSize: 16, fontFamily: "monospace" }} />
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>per 10K tokens</span>
                    </div>
                    <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                      {[10, 25, 50, 100].map((pct) => (
                        <button key={pct} className="btn-secondary" style={{ flex: 1, height: 28, fontSize: 10 }} onClick={() => {
                          setSellPrice((parseFloat(pricingSkill.allianceBasePrice) * (1 + pct / 100)).toFixed(4));
                          setPriceSaved(false);
                        }}>+{pct}%</button>
                      ))}
                    </div>
                  </div>

                  <div style={{ padding: 14, borderRadius: 8, background: "rgba(14,203,129,0.05)", border: "1px solid rgba(14,203,129,0.15)", marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>{t("markupAmount")}</span>
                      <span style={{ fontFamily: "monospace", fontWeight: 600, color: "var(--primary)" }}>+${m.markupAmount}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>{t("markupPercent")}</span>
                      <span style={{ fontFamily: "monospace", fontWeight: 600, color: "var(--primary)" }}>{m.markupPct}%</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid var(--hairline-on-dark)" }}>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{t("yourTotalPerCall")}</span>
                      <span style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 700, color: "var(--trading-up)" }}>${m.total}</span>
                    </div>
                    <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4 }}>{t("commissionPlusMarkup")}</div>
                  </div>

                  <div style={{ padding: 10, borderRadius: 6, background: "rgba(59,130,246,0.06)", textAlign: "center", marginBottom: 16 }}>
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>{t("estimatedMonthly")}: </span>
                    <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--trading-up)" }}>${(parseFloat(m.total) * 100000).toFixed(2)}</span>
                  </div>

                  <button className="btn-primary" style={{ width: "100%" }} onClick={() => setPriceSaved(true)}>
                    {priceSaved ? "✓ " + t("priceSaved") : t("savePrice")}
                  </button>
                </div>
              );
            })()}
          </div>

          <div className="card-dark" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 16px" }}>{t("priceHistory")}</h3>
            {pricingSkill ? (
              <table className="table-dark">
                <thead>
                  <tr>
                    <th>{t("mySellPrice")}</th>
                    <th>{t("markupRate")}</th>
                    <th>{t("effectiveSince")}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { price: (parseFloat(pricingSkill.allianceBasePrice) * 1.6).toFixed(4), rate: "+60%", date: "2026-07-08" },
                    { price: (parseFloat(pricingSkill.allianceBasePrice) * 1.5).toFixed(4), rate: "+50%", date: "2026-07-01" },
                    { price: (parseFloat(pricingSkill.allianceBasePrice) * 1.3).toFixed(4), rate: "+30%", date: "2026-06-20" },
                  ].map((h, i) => (
                    <tr key={i}>
                      <td style={{ fontFamily: "monospace" }}>${h.price}</td>
                      <td style={{ fontFamily: "monospace", color: "var(--primary)" }}>{h.rate}</td>
                      <td style={{ fontSize: 12, color: "var(--muted)" }}>{h.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: 40, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>Select a skill to view price history</div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab 3: Sales & Earnings ── */}
      {activeTab === 3 && (
        <div>
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            {[t("today"), t("thisWeek"), t("thisMonth"), t("allTime")].map((label, i) => (
              <button key={i} className={i === 0 ? "btn-primary" : "btn-secondary"} style={{ height: 32, fontSize: 12, padding: "0 16px" }}>{label}</button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
            {[
              { label: t("salesCount"), value: "156", color: "var(--primary)" },
              { label: t("totalRevenueTab"), value: `$${totalRevenue.toFixed(4)}`, color: "var(--trading-up)" },
              { label: t("netProfit"), value: `$${totalRevenue.toFixed(4)}`, color: "var(--trading-up)" },
              { label: t("markupRate"), value: "+55%", color: "#3b82f6" },
            ].map((stat, i) => (
              <div key={i} style={{ padding: 16, borderRadius: 10, background: "rgba(59,130,246,0.04)", border: "1px solid var(--hairline-on-dark)", textAlign: "center" }}>
                <div style={{ fontFamily: "monospace", fontSize: 22, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="card-dark" style={{ overflowX: "auto" }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px" }}>{t("salesDetail")}</h3>
            <table className="table-dark">
              <thead>
                <tr>
                  <th>{t("time")}</th>
                  <th>{t("skillName")}</th>
                  <th>{t("consumer")}</th>
                  <th>{t("basePricePaid")}</th>
                  <th>{t("markupEarned")}</th>
                  <th>{t("commissionEarned")}</th>
                  <th>{t("totalEarned")}</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: 12, color: "var(--muted)" }}>{s.time}</td>
                    <td>{s.skillName}</td>
                    <td style={{ fontFamily: "monospace", fontSize: 12, color: "var(--muted)" }}>{s.consumer}</td>
                    <td style={{ fontFamily: "monospace" }}>${s.basePricePaid}</td>
                    <td style={{ fontFamily: "monospace", color: "var(--primary)" }}>${s.markupEarned}</td>
                    <td style={{ fontFamily: "monospace", color: "var(--trading-up)" }}>${s.commissionEarned}</td>
                    <td style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--trading-up)" }}>${s.totalEarned}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab 4: Promotion Tools ── */}
      {activeTab === 4 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Referral Link */}
          <div className="card-dark" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 12px" }}>{t("referralLink")}</h3>
            <select className="input-dark" style={{ width: "100%", height: 38, fontSize: 12, marginBottom: 12 }}>
              <option value="">{t("selectSkill")}</option>
              {mySkills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input className="input-dark" readOnly value={`${typeof window !== "undefined" ? window.location.origin : ""}/buy?ref=${posterAddress}&skill=4`} style={{ flex: 1, height: 38, fontSize: 11, fontFamily: "monospace" }} />
              <button className="btn-primary" style={{ height: 38, fontSize: 12, whiteSpace: "nowrap" }} onClick={() => { setCopiedLink("link"); setTimeout(() => setCopiedLink(""), 2000); }}>
                {copiedLink === "link" ? "✓ " + t("linkCopied") : t("copyLink")}
              </button>
            </div>
            <button className="btn-secondary" style={{ width: "100%", height: 36 }}>{t("generateLink")}</button>
          </div>

          {/* QR Code */}
          <div className="card-dark" style={{ padding: 20, textAlign: "center" }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 12px" }}>{t("qrCode")}</h3>
            <div style={{ width: 140, height: 140, margin: "0 auto 12px", borderRadius: 8, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 120, height: 120, background: "repeating-linear-gradient(45deg, #000 0px, #000 8px, #fff 8px, #fff 16px)" }} />
            </div>
            <button className="btn-secondary" style={{ width: "100%", height: 36 }}>{t("downloadQR")}</button>
          </div>

          {/* Embed Code */}
          <div className="card-dark" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 4px" }}>{t("embedCode")}</h3>
            <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 12px" }}>{t("embedDesc")}</p>
            <textarea
              className="input-dark"
              readOnly
              rows={4}
              value={`<iframe src="${typeof window !== "undefined" ? window.location.origin : ""}/embed/buy?ref=${posterAddress}&skill=4" width="100%" height="400" frameborder="0"></iframe>`}
              style={{ width: "100%", fontSize: 11, fontFamily: "monospace", marginBottom: 12, resize: "vertical" }}
            />
            <button className="btn-secondary" style={{ width: "100%", height: 36 }} onClick={() => { setCopiedEmbed(true); setTimeout(() => setCopiedEmbed(false), 2000); }}>
              {copiedEmbed ? "✓ " + t("embedCopied") : t("copyEmbed")}
            </button>
          </div>

          {/* API Docs */}
          <div className="card-dark" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 4px" }}>{t("apiDoc")}</h3>
            <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 12px" }}>{t("apiDocDesc")}</p>
            <button className="btn-primary" style={{ width: "100%", height: 36 }} onClick={() => router.push("/api-station")}>
              {t("viewApiDoc")}
            </button>
          </div>
        </div>
      )}

      {/* ── Tab 5: Publish Demand ── */}
      {activeTab === 5 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div className="card-dark" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 4px" }}>{t("publishDemandTitle")}</h3>
            <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 20px" }}>{t("publishDemandDesc")}</p>

            {demandPublished && (
              <div style={{ padding: 12, borderRadius: 8, background: "rgba(14,203,129,0.1)", border: "1px solid rgba(14,203,129,0.2)", marginBottom: 16, fontSize: 13, color: "var(--trading-up)" }}>
                {"✓ " + t("demandPublished")}
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>{t("demandTitleLabel")}</label>
              <input className="input-dark" value={demandForm.title} onChange={(e) => setDemandForm({ ...demandForm, title: e.target.value })} style={{ width: "100%", height: 38, fontSize: 13 }} placeholder={t("demandTitleLabel")} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>{t("demandDescLabel")}</label>
              <textarea className="input-dark" value={demandForm.description} onChange={(e) => setDemandForm({ ...demandForm, description: e.target.value })} rows={3} style={{ width: "100%", fontSize: 13, resize: "vertical" }} placeholder={t("demandDescLabel")} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>{t("demandCategoryLabel")}</label>
                <select className="input-dark" value={demandForm.category} onChange={(e) => setDemandForm({ ...demandForm, category: e.target.value })} style={{ width: "100%", height: 38, fontSize: 12 }}>
                  <option>LLM Inference</option>
                  <option>Image Generation</option>
                  <option>Code & Audit</option>
                  <option>Audio & TTS</option>
                  <option>Data Analysis</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>{t("demandBudgetLabel")}</label>
                <input className="input-dark" type="number" value={demandForm.budget} onChange={(e) => setDemandForm({ ...demandForm, budget: e.target.value })} style={{ width: "100%", height: 38, fontSize: 13, fontFamily: "monospace" }} placeholder="e.g. 5000" />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>{t("demandDeadlineLabel")}</label>
              <input className="input-dark" type="date" value={demandForm.deadline} onChange={(e) => setDemandForm({ ...demandForm, deadline: e.target.value })} style={{ width: "100%", height: 38, fontSize: 13 }} />
            </div>

            <button className="btn-primary" style={{ width: "100%", height: 42 }} onClick={handlePublishDemand}>
              {t("submitDemand")}
            </button>
          </div>

          <div className="card-dark" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 16px" }}>{t("myDemands")}</h3>
            {myDemands.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>{t("noDemandsPosted")}</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {myDemands.map((d) => (
                  <div key={d.id} style={{ padding: 14, borderRadius: 8, border: "1px solid var(--hairline-on-dark)", background: d.status === "fulfilled" ? "rgba(14,203,129,0.03)" : "rgba(59,130,246,0.03)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{d.title}</span>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: d.status === "fulfilled" ? "rgba(14,203,129,0.15)" : "rgba(59,130,246,0.15)", color: d.status === "fulfilled" ? "var(--trading-up)" : "var(--primary)" }}>
                        {d.status === "fulfilled" ? t("fulfilledStatus") : t("openStatus")}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>{d.description}</div>
                    <div style={{ display: "flex", gap: 16, fontSize: 11, color: "var(--muted)", marginBottom: 10 }}>
                      <span>{d.category}</span>
                      <span style={{ fontFamily: "monospace" }}>{d.budget} USDT</span>
                      <span>{d.deadline}</span>
                    </div>
                    {d.status === "open" && (
                      <button className="btn-secondary" style={{ height: 28, fontSize: 11 }} onClick={() => handleFulfillDemand(d.id)}>
                        {t("fulfillDemand")}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
