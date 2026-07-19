"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

interface AllianceSkill {
  id: string;
  name: string;
  category: string;
  allianceBasePrice: string;
  developer: string;
  calls: number;
  rating: number;
  resellerOffers: ResellerOffer[];
}

interface ResellerOffer {
  resellerId: string;
  resellerName: string;
  sellPrice: string;
  markupPercent: string;
}

export default function MarketplaceAlliancePage() {
  const t = useTranslations("MarketplaceAlliancePage");
  const common = useTranslations("Common");
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState<AllianceSkill | null>(null);
  const [selectedReseller, setSelectedReseller] = useState<ResellerOffer | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, []);

  const allianceSkills: AllianceSkill[] = [
    {
      id: "4", name: "Whisper Large v3 TTS", category: "Audio & TTS", allianceBasePrice: "0.0020", developer: "0xf39F...2266", calls: 67000, rating: 4.9,
      resellerOffers: [
        { resellerId: "R-001", resellerName: "AI Dist Ltd.", sellPrice: "0.0030", markupPercent: "+50%" },
        { resellerId: "R-002", resellerName: "ModelHub", sellPrice: "0.0028", markupPercent: "+40%" },
        { resellerId: "R-004", resellerName: "ComputeX", sellPrice: "0.0025", markupPercent: "+25%" },
      ],
    },
    {
      id: "5", name: "Mixtral 8x7B MoE", category: "LLM Inference", allianceBasePrice: "0.0050", developer: "0x7099...79C8", calls: 9100, rating: 4.7,
      resellerOffers: [
        { resellerId: "R-001", resellerName: "AI Dist Ltd.", sellPrice: "0.0080", markupPercent: "+60%" },
        { resellerId: "R-004", resellerName: "ComputeX", sellPrice: "0.0065", markupPercent: "+30%" },
      ],
    },
    {
      id: "7", name: "DeepSeek-R1 Reasoning", category: "LLM Inference", allianceBasePrice: "0.0080", developer: "0xA1B2...C3D4", calls: 45000, rating: 4.8,
      resellerOffers: [
        { resellerId: "R-001", resellerName: "AI Dist Ltd.", sellPrice: "0.0120", markupPercent: "+50%" },
        { resellerId: "R-002", resellerName: "ModelHub", sellPrice: "0.0100", markupPercent: "+25%" },
        { resellerId: "R-004", resellerName: "ComputeX", sellPrice: "0.0095", markupPercent: "+19%" },
      ],
    },
    {
      id: "8", name: "Claude-3-Opus Compatible", category: "LLM Inference", allianceBasePrice: "0.0150", developer: "0xE5F6...G7H8", calls: 32000, rating: 4.9,
      resellerOffers: [
        { resellerId: "R-004", resellerName: "ComputeX", sellPrice: "0.0180", markupPercent: "+20%" },
        { resellerId: "R-001", resellerName: "AI Dist Ltd.", sellPrice: "0.0220", markupPercent: "+47%" },
      ],
    },
  ];

  const getLowestOffer = (skill: AllianceSkill): ResellerOffer | null => {
    if (skill.resellerOffers.length === 0) return null;
    return skill.resellerOffers.reduce((lowest, o) =>
      parseFloat(o.sellPrice) < parseFloat(lowest.sellPrice) ? o : lowest
    );
  };

  const handleBuy = () => {
    const w = sessionStorage.getItem("aims_wallet");
    if (!w) { router.push("/login"); return; }
    setPurchaseSuccess(true);
    setTimeout(() => {
      setPurchaseSuccess(false);
      setSelectedSkill(null);
      setSelectedReseller(null);
    }, 2500);
  };

  if (loading) return <div style={{ padding: 80, textAlign: "center", color: "var(--muted)" }}>{common("loading")}</div>;

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, margin: "0 0 8px" }}>{t("title")}</h1>
        <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>{t("subtitle")}</p>
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <input className="input-dark" placeholder={t("searchPlaceholder")} style={{ flex: 1, height: 38, fontSize: 13 }} />
        <select className="input-dark" style={{ height: 38, fontSize: 12, padding: "0 12px" }}>
          <option>{t("allCategories")}</option>
          <option>LLM Inference</option>
          <option>Image Generation</option>
          <option>Code & Audit</option>
          <option>Audio & TTS</option>
        </select>
      </div>

      {/* Skills Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
        {allianceSkills.map((skill) => {
          const lowest = getLowestOffer(skill);
          return (
            <div key={skill.id} style={{ padding: 20, borderRadius: 12, border: "1px solid var(--hairline-on-dark)", background: "rgba(59,130,246,0.02)", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 2px" }}>{skill.name}</h3>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>{skill.category}</span>
                </div>
                <span className="badge badge-green" style={{ fontSize: 10 }}>Alliance</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, padding: "10px 14px", borderRadius: 8, background: "rgba(59,130,246,0.05)" }}>
                <div>
                  <div style={{ fontSize: 10, color: "var(--muted)" }}>{t("allianceBasePrice")}</div>
                  <div style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 700, color: "var(--primary)" }}>${skill.allianceBasePrice}</div>
                  <div style={{ fontSize: 9, color: "var(--muted)" }}>{t("per10kTokens")}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, color: "var(--muted)" }}>{t("splitPreview")}</div>
                  <div style={{ display: "flex", height: 14, borderRadius: 2, overflow: "hidden", marginTop: 2, width: 160 }}>
                    <div style={{ width: "15%", background: "#3b82f6" }} />
                    <div style={{ width: "60%", background: "#0ecb81" }} />
                    <div style={{ width: "25%", background: "#fcd535" }} />
                  </div>
                </div>
              </div>

              {/* Reseller offers */}
              <div style={{ marginBottom: 12, flex: 1 }}>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8 }}>
                  {t("resellerOffers")} ({skill.resellerOffers.length} {t("resellers")})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {skill.resellerOffers.sort((a, b) => parseFloat(a.sellPrice) - parseFloat(b.sellPrice)).map((offer, i) => (
                    <div
                      key={offer.resellerId}
                      style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "8px 10px", borderRadius: 6, cursor: "pointer", fontSize: 12,
                        border: selectedSkill?.id === skill.id && selectedReseller?.resellerId === offer.resellerId ? "1px solid var(--primary)" : "1px solid transparent",
                        background: i === 0 ? "rgba(14,203,129,0.04)" : "transparent",
                      }}
                      onClick={() => { setSelectedSkill(skill); setSelectedReseller(offer); }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {i === 0 && <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 3, background: "rgba(14,203,129,0.15)", color: "var(--trading-up)", fontWeight: 600 }}>{t("lowestPrice")}</span>}
                        <span>{offer.resellerName}</span>
                        <span style={{ color: "var(--muted)", fontSize: 11 }}>{offer.markupPercent}</span>
                      </div>
                      <span style={{ fontFamily: "monospace", fontWeight: 600 }}>${offer.sellPrice}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Direct buy button */}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn-secondary"
                  style={{ flex: 1, height: 36, fontSize: 12 }}
                  onClick={() => { setSelectedSkill(skill); setSelectedReseller(null); }}
                >
                  {t("buyDirect")}
                </button>
                <button
                  className="btn-primary"
                  style={{ flex: 1, height: 36, fontSize: 12 }}
                  disabled={!selectedSkill || selectedSkill.id !== skill.id}
                  onClick={handleBuy}
                >
                  {selectedSkill?.id === skill.id && selectedReseller
                    ? `${t("buyViaReseller")} — $${selectedReseller.sellPrice}`
                    : selectedSkill?.id === skill.id && !selectedReseller
                    ? `${t("buyDirect")} — $${skill.allianceBasePrice}`
                    : t("selectReseller")}
                </button>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 11, color: "var(--muted)" }}>
                <span>{skill.developer}</span>
                <span>★ {skill.rating} · {(skill.calls / 1000).toFixed(1)}K calls</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Purchase Success Toast */}
      {purchaseSuccess && (
        <div style={{ position: "fixed", top: 24, right: 24, zIndex: 200, padding: "16px 24px", borderRadius: 10, background: "rgba(14,203,129,0.95)", color: "#000", fontWeight: 600, fontSize: 14, boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
          ✓ {t("purchaseSuccess")} — {selectedSkill?.name}
          <div style={{ fontSize: 11, fontWeight: 400, marginTop: 2 }}>{t("purchaseSuccessDesc")}</div>
        </div>
      )}
    </main>
  );
}
