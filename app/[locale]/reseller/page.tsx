"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

interface CommissionEntry {
  id: string;
  skillName: string;
  tokensConsumed: number;
  tokenPrice: string;
  commission: string;
  time: string;
}

interface AllianceSkill {
  skillId: string;
  name: string;
  tokenPrice: string;
  category: string;
  developer: string;
  monthlyTokens: string;
}

export default function ResellerPage() {
  const t = useTranslations("ResellerPage");
  const common = useTranslations("Common");
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState("");
  const [markupSkill, setMarkupSkill] = useState<AllianceSkill | null>(null);
  const [sellPrice, setSellPrice] = useState("");
  const [showCalculator, setShowCalculator] = useState(false);

  const allianceSkills: AllianceSkill[] = [
    { skillId: "4", name: "Whisper Large v3 TTS", tokenPrice: "0.0020", category: "Audio & TTS", developer: "0xf39F...2266", monthlyTokens: "2.4M" },
    { skillId: "5", name: "Mixtral 8x7B MoE", tokenPrice: "0.0050", category: "LLM Inference", developer: "0x7099...79C8", monthlyTokens: "18M" },
    { skillId: "7", name: "DeepSeek-R1 Reasoning", tokenPrice: "0.0080", category: "LLM Inference", developer: "0xA1B2...C3D4", monthlyTokens: "45M" },
    { skillId: "8", name: "Claude-3-Opus Compatible", tokenPrice: "0.0150", category: "LLM Inference", developer: "0xE5F6...G7H8", monthlyTokens: "32M" },
  ];

  const [commissionHistory] = useState<CommissionEntry[]>([
    { id: "C-001", skillName: "Mixtral 8x7B MoE", tokensConsumed: 1250000, tokenPrice: "0.0050", commission: "1.5625", time: "2 hours ago" },
    { id: "C-002", skillName: "Whisper Large v3 TTS", tokensConsumed: 340000, tokenPrice: "0.0020", commission: "0.1700", time: "5 hours ago" },
    { id: "C-003", skillName: "DeepSeek-R1 Reasoning", tokensConsumed: 890000, tokenPrice: "0.0080", commission: "1.7800", time: "8 hours ago" },
    { id: "C-004", skillName: "Mixtral 8x7B MoE", tokensConsumed: 2100000, tokenPrice: "0.0050", commission: "2.6250", time: "1 day ago" },
    { id: "C-005", skillName: "Claude-3-Opus Compatible", tokensConsumed: 560000, tokenPrice: "0.0150", commission: "2.1000", time: "1 day ago" },
  ]);

  const totalCommissions = commissionHistory.reduce((sum, c) => sum + parseFloat(c.commission), 0);

  useEffect(() => {
    if (!sessionStorage.getItem("aims_wallet")) { router.push("/login"); return; }
    setLoading(false);
  }, [router]);

  const calcEstEarnings = (tokenPrice: string): string => {
    return (parseFloat(tokenPrice) * 1_000_000 / 10_000 * 0.25).toFixed(2);
  };

  const calcMarkupEarnings = (): { markupAmount: string; markupPct: string; baseCommission: string; total: string } => {
    if (!markupSkill || !sellPrice) return { markupAmount: "0", markupPct: "0", baseCommission: "0", total: "0" };
    const base = parseFloat(markupSkill.tokenPrice);
    const sell = parseFloat(sellPrice);
    const commission = base * 0.25;
    const markup = sell - base;
    return {
      markupAmount: markup.toFixed(4),
      markupPct: ((sell - base) / base * 100).toFixed(0),
      baseCommission: commission.toFixed(4),
      total: (commission + markup).toFixed(4),
    };
  };

  const generateReferralLink = (skill: AllianceSkill): string => {
    const ref = sessionStorage.getItem("aims_wallet")?.slice(0, 10) || "unknown";
    return `${window.location.origin}/en/marketplace/${skill.skillId}?ref=${ref}`;
  };

  const copyLink = (link: string, id: string) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(""), 2000);
  };

  if (loading) return <div style={{ padding: 80, textAlign: "center", color: "var(--muted)" }}>{common("loading")}</div>;

  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "40px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, margin: "0 0 8px" }}>{t("title")}</h1>
          <p style={{ color: "var(--muted)", fontSize: 14, margin: 0, maxWidth: 560, lineHeight: 1.6 }}>{t("desc")}</p>
        </div>
        <div style={{ textAlign: "right", padding: "16px 20px", borderRadius: 10, background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}>
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>{t("totalCommissions")}</div>
          <div style={{ fontFamily: "monospace", fontSize: 28, fontWeight: 700, color: "var(--trading-up)" }}>${totalCommissions.toFixed(4)}</div>
          <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4 }}>{t("earningsNote")}</div>
        </div>
      </div>

      {/* Commission rate info */}
      <div style={{ padding: 16, borderRadius: 10, background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)", marginBottom: 28, display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ padding: "10px 18px", borderRadius: 8, background: "rgba(59,130,246,0.12)", textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#3b82f6" }}>25%</div>
          <div style={{ fontSize: 10, color: "var(--muted)" }}>{t("commissionRate")}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{t("passiveIncome")}</div>
          <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>{t("commissionRateDesc")}</div>
        </div>
      </div>

      {/* Price & Markup Calculator */}
      <div className="card-dark" style={{ marginBottom: 28, padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 4px" }}>{t("priceCalculator")}</h2>
            <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>{t("calculatorDesc")}</p>
          </div>
          <button className="btn-secondary" style={{ height: 36, fontSize: 12 }} onClick={() => setShowCalculator(!showCalculator)}>
            {showCalculator ? common("close") : t("adjustMarkup")}
          </button>
        </div>

        {showCalculator && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>{t("selectSkill")}</label>
              <select className="input-dark" style={{ width: "100%", height: 40, fontSize: 13 }} value={markupSkill?.skillId || ""} onChange={(e) => {
                const s = allianceSkills.find((sk) => sk.skillId === e.target.value);
                if (s) { setMarkupSkill(s); setSellPrice((parseFloat(s.tokenPrice) * 1.5).toFixed(4)); }
              }}>
                <option value="">{t("selectSkillPlaceholder")}</option>
                {allianceSkills.map((s) => <option key={s.skillId} value={s.skillId}>{s.name} — ${s.tokenPrice}/10K</option>)}
              </select>

              {markupSkill && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ padding: 12, borderRadius: 8, background: "rgba(59,130,246,0.05)", marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>{t("allianceBasePriceLabel")}</span>
                      <span style={{ fontFamily: "monospace", fontWeight: 600 }}>${markupSkill.tokenPrice}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>{t("baseCommissionLabel")}</span>
                      <span style={{ fontFamily: "monospace", color: "var(--trading-up)" }}>+${(parseFloat(markupSkill.tokenPrice) * 0.25).toFixed(4)}</span>
                    </div>
                  </div>

                  <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>{t("yourSellPriceLabel")} (USDT/10K tokens)</label>
                  <input className="input-dark" type="number" step="0.0001" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} style={{ width: "100%", height: 40, fontSize: 16, fontFamily: "monospace" }} />
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    {[10, 25, 50, 100].map((pct) => (
                      <button key={pct} className="btn-secondary" style={{ flex: 1, height: 26, fontSize: 10 }} onClick={() => setSellPrice((parseFloat(markupSkill.tokenPrice) * (1 + pct / 100)).toFixed(4))}>+{pct}%</button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              {markupSkill ? (() => {
                const m = calcMarkupEarnings();
                return (
                  <div>
                    <div style={{ padding: 14, borderRadius: 8, background: "rgba(14,203,129,0.05)", border: "1px solid rgba(14,203,129,0.15)", marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: "var(--muted)" }}>{t("markupAmountLabel")}</span>
                        <span style={{ fontFamily: "monospace", fontWeight: 600, color: "var(--primary)" }}>+${m.markupAmount}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: "var(--muted)" }}>{t("markupPercentLabel")}</span>
                        <span style={{ fontFamily: "monospace", fontWeight: 600, color: "var(--primary)" }}>{m.markupPct}%</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: "var(--muted)" }}>{t("baseCommissionLabel")}</span>
                        <span style={{ fontFamily: "monospace", color: "var(--trading-up)" }}>+${m.baseCommission}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid var(--hairline-on-dark)" }}>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{t("yourEarningsPerCall")}</span>
                        <span style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 700, color: "var(--trading-up)" }}>${m.total}</span>
                      </div>
                    </div>

                    <div style={{ padding: 10, borderRadius: 6, background: "rgba(59,130,246,0.06)", textAlign: "center" }}>
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>{t("estimatedEarnings")}: </span>
                      <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--trading-up)" }}>${(parseFloat(m.total) * 100000).toFixed(2)}</span>
                      <span style={{ fontSize: 10, color: "var(--muted)" }}> /month (est. 100K calls)</span>
                    </div>
                  </div>
                );
              })() : (
                <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: 13 }}>
                  {t("previewEarnings")}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Alliance skills grid */}
      <div className="card-dark" style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 20px" }}>{t("allianceSkills")}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
          {allianceSkills.map((skill) => (
            <div key={skill.skillId} style={{ padding: 16, borderRadius: 10, border: "1px solid var(--hairline-on-dark)", background: "rgba(59,130,246,0.03)" }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{skill.name}</div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 12 }}>{skill.category} · {skill.developer}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                <div style={{ padding: "8px 10px", borderRadius: 6, background: "rgba(59,130,246,0.06)" }}>
                  <div style={{ fontSize: 9, color: "var(--muted)" }}>{t("aimsTokenPrice")}</div>
                  <div style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700 }}>${skill.tokenPrice}</div>
                  <div style={{ fontSize: 9, color: "var(--muted)" }}>{t("perMillionTokens")}</div>
                </div>
                <div style={{ padding: "8px 10px", borderRadius: 6, background: "rgba(14,203,129,0.06)" }}>
                  <div style={{ fontSize: 9, color: "var(--muted)" }}>{t("estimatedEarnings")}</div>
                  <div style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, color: "var(--trading-up)" }}>${calcEstEarnings(skill.tokenPrice)}</div>
                  <div style={{ fontSize: 9, color: "var(--muted)" }}>{t("perMillionTokens")}</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <button
                  className="btn-primary"
                  style={{ width: "100%", height: 34, fontSize: 12 }}
                  onClick={() => copyLink(generateReferralLink(skill), skill.skillId)}
                >
                  {copiedId === skill.skillId ? t("referralCopied") : t("copyReferralLink")}
                </button>
                <button
                  className="btn-secondary"
                  style={{ width: "100%", height: 30, fontSize: 11 }}
                  onClick={() => { setMarkupSkill(skill); setSellPrice((parseFloat(skill.tokenPrice) * 1.5).toFixed(4)); setShowCalculator(true); }}
                >
                  {t("adjustMarkup")}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Commission history */}
      <div className="card-dark">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>{t("commissionHistory")}</h2>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>{commissionHistory.length} {t("quotesGenerated")}</span>
        </div>

        {commissionHistory.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>{t("noCommissions")}</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, color: "var(--muted)", borderBottom: "1px solid var(--hairline-on-dark)" }}>{t("skillName")}</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", fontSize: 11, color: "var(--muted)", borderBottom: "1px solid var(--hairline-on-dark)" }}>Tokens Consumed</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", fontSize: 11, color: "var(--muted)", borderBottom: "1px solid var(--hairline-on-dark)" }}>Token Price</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", fontSize: 11, color: "var(--muted)", borderBottom: "1px solid var(--hairline-on-dark)" }}>Commission (25%)</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", fontSize: 11, color: "var(--muted)", borderBottom: "1px solid var(--hairline-on-dark)" }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {commissionHistory.map((c) => (
                  <tr key={c.id}>
                    <td style={{ padding: "10px 12px", fontSize: 13, borderBottom: "1px solid var(--hairline-on-dark)" }}>{c.skillName}</td>
                    <td style={{ padding: "10px 12px", fontSize: 13, fontFamily: "monospace", textAlign: "right", borderBottom: "1px solid var(--hairline-on-dark)" }}>{(c.tokensConsumed / 1000).toFixed(0)}K</td>
                    <td style={{ padding: "10px 12px", fontSize: 13, fontFamily: "monospace", textAlign: "right", borderBottom: "1px solid var(--hairline-on-dark)" }}>${c.tokenPrice}</td>
                    <td style={{ padding: "10px 12px", fontSize: 13, fontFamily: "monospace", textAlign: "right", color: "var(--trading-up)", fontWeight: 600, borderBottom: "1px solid var(--hairline-on-dark)" }}>${c.commission}</td>
                    <td style={{ padding: "10px 12px", fontSize: 12, color: "var(--muted)", textAlign: "right", borderBottom: "1px solid var(--hairline-on-dark)" }}>{c.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
