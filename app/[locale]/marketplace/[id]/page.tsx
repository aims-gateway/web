"use client";

import { useTranslations, useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useEffect, useState } from "react";

interface SkillData {
  skill_id: string;
  name: string;
  category_id: string;
  tags: string[];
  web3_pricing: number;
  developer_address: string;
  call_count: number;
  provider: string;
  model_name: string;
  description: string;
  capabilities: string[];
  context_window: string;
  hosting: string;
  transaction_model: string;
  pricing_model: string;
  buyout_price: number;
  subscription_price: number;
  subscription_seats: number;
  alliance_token_price: string;
  alliance_tested: boolean;
  ip_vault_level: string;
  created_at: number;
}

export default function SkillDetailPage() {
  const t = useTranslations("SkillDetailPage");
  const mp = useTranslations("MarketplacePage");
  const common = useTranslations("Common");
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [skill, setSkill] = useState<SkillData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isInLibrary, setIsInLibrary] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("aims_skill_library");
    if (raw && id) {
      const lib = JSON.parse(raw) as string[];
      setIsInLibrary(lib.includes(id));
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError("");
    fetch(`/api/v2/marketplace/skills/${encodeURIComponent(id)}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 404 ? "not_found" : "fetch_error");
        return res.json();
      })
      .then((data: SkillData) => {
        setSkill(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message === "not_found" ? "not_found" : "fetch_error");
        setLoading(false);
      });
  }, [id]);

  const toggleLibrary = () => {
    const raw = sessionStorage.getItem("aims_skill_library");
    const lib: string[] = raw ? JSON.parse(raw) : [];
    const idx = lib.indexOf(id);
    if (idx >= 0) lib.splice(idx, 1);
    else lib.push(id);
    sessionStorage.setItem("aims_skill_library", JSON.stringify(lib));
    setIsInLibrary(idx < 0);
  };

  if (loading) {
    return (
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px", textAlign: "center" }}>
        <div style={{ padding: 80, color: "var(--muted)" }}>{common("loading")}</div>
      </main>
    );
  }

  if (error || !skill) {
    return (
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
        <button className="text-link" onClick={() => router.push("/marketplace")} style={{ marginBottom: 24, display: "inline-block" }}>
          {t("backToMarketplace")}
        </button>
        <div style={{ padding: 80, textAlign: "center", color: "var(--muted)" }}>
          {error === "not_found" ? t("skillNotFound") : t("fetchError")}
        </div>
      </main>
    );
  }

  const categoryName = mp(`categories.${skill.category_id}` as any) || skill.category_id;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: skill.name,
    description: skill.description,
    category: categoryName,
    offers: {
      "@type": "Offer",
      price: skill.web3_pricing.toFixed(4),
      priceCurrency: "USDT",
      availability: "https://schema.org/InStock",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      bestRating: "5",
      ratingCount: skill.call_count,
    },
    provider: {
      "@type": "Person",
      identifier: skill.developer_address,
    },
    url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/${locale}/marketplace/${id}`,
  };

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <button className="text-link" onClick={() => router.push("/marketplace")} style={{ marginBottom: 24, display: "inline-block" }}>
        {t("backToMarketplace")}
      </button>

      <div className="card-dark" style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 700, margin: "0 0 8px" }}>{skill.name}</h1>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <span className="badge badge-yellow">{categoryName}</span>
              {skill.ip_vault_level && (
                <span className="badge" style={{ fontSize: 10, flexShrink: 0, background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>IP {skill.ip_vault_level}</span>
              )}
              {skill.alliance_tested && (
                <span className="badge badge-blue" style={{ fontSize: 10 }}>{t("allianceTested")}</span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {skill.tags.map((tag) => (
            <span key={tag} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "rgba(112,122,138,0.12)", color: "var(--muted-strong)" }}>{tag}</span>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, padding: "16px 0", borderTop: "1px solid var(--hairline-on-dark)", borderBottom: "1px solid var(--hairline-on-dark)", marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 700, color: "var(--primary)" }}>{(skill.call_count / 1000).toFixed(1)}k</div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>{t("totalCalls")}</div>
          </div>
          <div>
            <div style={{ fontSize: 14, fontFamily: "monospace", color: "var(--muted)" }}>{skill.developer_address.slice(0, 10)}...</div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>{t("developer")}</div>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: "var(--trading-up)" }}>4.8 / 5</div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>{t("rating")}</div>
          </div>
        </div>

        <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--muted)", margin: "0 0 24px" }}>
          {skill.description}
        </p>

        {/* ── User Reviews ── */}
        <div style={{ marginBottom: 28, padding: "20px 0", borderTop: "1px solid var(--hairline-on-dark)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{t("reviews")}</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", gap: 2 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} style={{ color: star <= 4 ? "#fcd535" : "var(--hairline-on-dark)", fontSize: 16 }}>★</span>
                ))}
              </div>
              <span style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 700, color: "var(--trading-up)" }}>4.8</span>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>(128 {t("reviews")})</span>
            </div>
          </div>

          {/* Rating distribution */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 20 }}>
            {[5, 4, 3, 2, 1].map((stars) => {
              const pct = stars === 5 ? 72 : stars === 4 ? 18 : stars === 3 ? 6 : stars === 2 ? 3 : 1;
              return (
                <div key={stars} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                  <span style={{ width: 20, textAlign: "right", color: "var(--muted)" }}>{stars}</span>
                  <span style={{ color: "var(--muted)", width: 14 }}>★</span>
                  <div style={{ flex: 1, height: 6, borderRadius: 3, background: "rgba(112,122,138,0.12)", overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: "#fcd535" }} />
                  </div>
                  <span style={{ width: 32, color: "var(--muted)", fontFamily: "monospace" }}>{pct}%</span>
                </div>
              );
            })}
          </div>

          {/* Review cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { user: "0x3C44...93BC", rating: 5, date: "2026-07-10", comment: "Exceptional performance on fine-tuned Llama inference. Consistently low latency under 200ms for 70B parameter model. Production-ready." },
              { user: "0x90F7...b906", rating: 5, date: "2026-07-08", comment: "Best image generation API on the market. Batch processing handles 100+ images without dropping. Highly recommend." },
              { user: "0x7099...79C8", rating: 4, date: "2026-07-05", comment: "Solid smart contract audit tool. Caught 3 critical vulnerabilities our manual review missed. Only drawback: 32k context limit." },
            ].map((review, i) => (
              <div key={i} style={{ padding: 14, borderRadius: 8, background: "rgba(112,122,138,0.04)", border: "1px solid var(--hairline-on-dark)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--muted)" }}>{review.user}</span>
                    <div style={{ display: "flex", gap: 1 }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span key={s} style={{ color: s <= review.rating ? "#fcd535" : "var(--hairline-on-dark)", fontSize: 11 }}>★</span>
                      ))}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>{review.date}</span>
                </div>
                <p style={{ fontSize: 12, color: "var(--muted-strong)", margin: 0, lineHeight: 1.6 }}>{review.comment}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Alliance Test Results ── */}
        <div style={{ marginBottom: 24, paddingTop: 20, borderTop: "1px solid var(--hairline-on-dark)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 14px" }}>{t("allianceTestResults")}</h3>
          {skill.alliance_tested ? (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span className="badge badge-blue" style={{ fontSize: 11 }}>{t("allianceTested")}</span>
                <span style={{ fontSize: 13, color: "var(--trading-up)", fontWeight: 600 }}>{t("allianceTestPassed")}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                {[
                  { label: t("testLatency"), value: "187ms", icon: "⚡" },
                  { label: t("testThroughput"), value: "342 req/s", icon: "📊" },
                  { label: t("testReliability"), value: "99.97%", icon: "🛡" },
                  { label: t("testSecurityScore"), value: "A+", icon: "🔒" },
                ].map((metric) => (
                  <div key={metric.label} style={{ padding: 12, borderRadius: 8, background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.12)", textAlign: "center" }}>
                    <div style={{ fontSize: 16, marginBottom: 4 }}>{metric.icon}</div>
                    <div style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 700, color: "var(--primary)" }}>{metric.value}</div>
                    <div style={{ fontSize: 10, color: "var(--muted)" }}>{metric.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ padding: 20, borderRadius: 8, background: "rgba(112,122,138,0.04)", border: "1px solid var(--hairline-on-dark)", textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🔬</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--muted)", marginBottom: 4 }}>{t("allianceNotTested")}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>{t("allianceNotTestedDesc")}</div>
            </div>
          )}
        </div>

        {/* ── Add to Library Button ── */}
        <button
          className={isInLibrary ? "btn-secondary" : "btn-subscribe"}
          style={{ width: "100%", height: 44, fontSize: 14, fontWeight: 600 }}
          onClick={toggleLibrary}
        >
          {isInLibrary ? "✓ " + t("inLibrary") : "+ " + t("addToLibraryBtn")}
        </button>
      </div>
    </main>
  );
}
