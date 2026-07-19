"use client";

import { Suspense, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";

interface Skill {
  skill_id: string;
  name: string;
  category_id: string;
  tags: string[];
  web3_pricing: number;
  call_count: number;
  developer_address: string;
  provider?: string;
  model_name?: string;
  transaction_model?: "mode1" | "mode2";
  pricing_model?: "per_call" | "buyout" | "subscription";
  buyout_price?: number;
  subscription_price?: number;
  alliance_token_price?: string;
  alliance_tested?: boolean;
  ip_vault_level?: string;
}

interface Category {
  category_id: string;
  name: string;
  slug: string;
}

type TradeMode = "all" | "buyout" | "subscription" | "alliance";

const TRADE_MODES: { key: TradeMode; labelKey: "all" | "buyoutTag" | "subscriptionTag" | "allianceBadge" }[] = [
  { key: "all", labelKey: "all" },
  { key: "buyout", labelKey: "buyoutTag" },
  { key: "subscription", labelKey: "subscriptionTag" },
  { key: "alliance", labelKey: "allianceBadge" },
] as const;

export default function MarketplacePage() {
  const t = useTranslations("MarketplacePage");

  return (
    <Suspense fallback={<div style={{ padding: 80, textAlign: "center", color: "var(--muted)" }}>{t("loadingMarketplace")}</div>}>
      <MarketplaceContent />
    </Suspense>
  );
}

function MarketplaceContent() {
  const t = useTranslations("MarketplacePage");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const activeCategory = searchParams.get("category_id") || "";
  const activeTags = searchParams.get("tags") || "";
  const activeTradeMode = (searchParams.get("trade_mode") || "all") as TradeMode;

  useEffect(() => {
    const raw = sessionStorage.getItem("aims_skill_library");
    if (raw) setSavedIds(new Set(JSON.parse(raw) as string[]));
  }, []);

  useEffect(() => {
    const qs = new URLSearchParams();
    if (activeCategory) qs.set("category_id", activeCategory);
    if (activeTags) qs.set("tags", activeTags);

    Promise.all([
      fetch(`/api/v2/marketplace/skills?${qs}`).then((r) =>
        r.json(),
      ),
      fetch(`/api/v2/marketplace/categories`).then((r) =>
        r.json(),
      ),
    ])
      .then(([sd, cd]) => {
        setSkills(Array.isArray(sd?.items) ? sd.items : []);
        setCategories(Array.isArray(cd) ? cd : []);
      })
      .catch(() => {
        setSkills([
          { skill_id: "1", name: "LLaMA 3.1 70B Inference", category_id: "llm", tags: ["PyTorch", "CUDA", "Streaming"], web3_pricing: 0.0042, call_count: 12300, developer_address: "0x3C44...93BC", provider: "Meta", model_name: "llama-3.1-70b", transaction_model: "mode1" as const, pricing_model: "per_call" as const },
          { skill_id: "2", name: "Stable Diffusion XL", category_id: "image", tags: ["GPU", "High-Res", "Batch"], web3_pricing: 0.0100, call_count: 8100, developer_address: "0x90F7...b906", provider: "Stability AI", model_name: "sdxl-1.0", transaction_model: "mode1" as const, pricing_model: "subscription" as const, subscription_price: 299 },
          { skill_id: "3", name: "Code Llama 34B Audit", category_id: "code", tags: ["Security", "Solidity"], web3_pricing: 0.0080, call_count: 45000, developer_address: "0x15d3...6A65", provider: "Meta", model_name: "codellama-34b", transaction_model: "mode1" as const, pricing_model: "buyout" as const, buyout_price: 15000 },
          { skill_id: "4", name: "Whisper Large v3 TTS", category_id: "audio", tags: ["STT", "Multilingual"], web3_pricing: 0.0008, call_count: 67000, developer_address: "0xf39F...2266", provider: "OpenAI", model_name: "whisper-large-v3", transaction_model: "mode2" as const, alliance_token_price: "0.0020" },
          { skill_id: "5", name: "Mixtral 8x7B MoE", category_id: "llm", tags: ["MoE", "API"], web3_pricing: 0.0035, call_count: 9100, developer_address: "0x7099...79C8", provider: "Mistral AI", model_name: "mixtral-8x7b", transaction_model: "mode2" as const, alliance_token_price: "0.0050" },
          { skill_id: "6", name: "DALL-E 3 Compatible", category_id: "image", tags: ["OpenAI Compat", "Fast"], web3_pricing: 0.0120, call_count: 3400, developer_address: "0x3C44...93BC", provider: "OpenAI", model_name: "dall-e-3", transaction_model: "mode1" as const, pricing_model: "buyout" as const, buyout_price: 8000 },
        ]);
        setCategories([
          { category_id: "llm", name: "LLM Inference", slug: "llm-inference" },
          { category_id: "image", name: "Image Generation", slug: "image-generation" },
          { category_id: "code", name: "Code & Audit", slug: "code-audit" },
          { category_id: "audio", name: "Audio & TTS", slug: "audio-tts" },
          { category_id: "data", name: "Data Processing", slug: "data-processing" },
          { category_id: "uncategorized", name: "Uncategorized", slug: "uncategorized" },
        ]);
      })
      .finally(() => setLoading(false));
  }, [activeCategory, activeTags]);

  function supportsTradeMode(s: Skill, mode: TradeMode): boolean {
    if (mode === "alliance") return !!(s.alliance_token_price);
    if (mode === "buyout") return !!(s.buyout_price);
    if (mode === "subscription") return !!(s.subscription_price);
    return false;
  }

  const filtered = skills.filter((s) => {
    const matchSearch = !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchTrade = activeTradeMode === "all" || supportsTradeMode(s, activeTradeMode);
    return matchSearch && matchTrade;
  });

  const tradeCounts = TRADE_MODES.reduce((acc, tm) => {
    acc[tm.key] = tm.key === "all" ? skills.length : skills.filter((s) => supportsTradeMode(s, tm.key)).length;
    return acc;
  }, {} as Record<string, number>);

  function setTradeMode(mode: TradeMode) {
    const p = new URLSearchParams(searchParams.toString());
    if (mode === "all") p.delete("trade_mode"); else p.set("trade_mode", mode);
    router.push(`/marketplace${p.toString() ? "?" + p.toString() : ""}`);
  }

  function toggleSkillLibrary(skill: Skill) {
    const raw = sessionStorage.getItem("aims_skill_library");
    const lib: string[] = raw ? JSON.parse(raw) : [];
    const idx = lib.indexOf(skill.skill_id);
    if (idx >= 0) lib.splice(idx, 1);
    else lib.push(skill.skill_id);
    sessionStorage.setItem("aims_skill_library", JSON.stringify(lib));
    setSavedIds(new Set(lib));
  }

  if (loading) return (
    <main style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 24px" }}>
      <div style={{ textAlign: "center", padding: 60, color: "var(--muted)" }}>{t("loadingMarketplace")}</div>
    </main>
  );

  const catName = (s: Skill) =>
    categories.find((c) => c.category_id === s.category_id)?.name ||
    s.category_id.replace(/^cat_/, "").replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <main style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 24px" }}>
      {/* Hero */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 700, margin: 0, lineHeight: 1.1 }}>{t("title")}</h1>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20, position: "relative", maxWidth: 480 }}>
        <input className="input-dark" placeholder={t("searchPlaceholder")} value={search}
          onChange={(e) => setSearch(e.target.value)} style={{ paddingRight: 44 }}
          onKeyDown={(e) => { if (e.key === "Enter") setSearch(e.currentTarget.value); }}
          data-testid="marketplace-search" />
        <button style={{ position: "absolute", right: 4, top: 4, width: 34, height: 34, borderRadius: 6, border: "none", background: "transparent", color: "var(--muted)", cursor: "pointer", fontSize: 16 }}
          onClick={() => setSearch(search)} aria-label="Search" data-testid="marketplace-search-btn">⌕</button>
      </div>

      {/* ── Filter Row 1: Skill Category ── */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{t("skillCategory")}</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className={!activeCategory ? "btn-primary" : "btn-secondary"} style={{ height: 34, padding: "0 18px", fontSize: 13 }}
            onClick={() => { const p = new URLSearchParams(searchParams.toString()); p.delete("category_id"); router.push("/marketplace" + (p.toString() ? "?" + p.toString() : "")); }}>
            {t("all")}
          </button>
          {categories.map((c) => (
            <button key={c.category_id}
              className={activeCategory === c.category_id ? "btn-primary" : "btn-secondary"}
              style={{ height: 34, padding: "0 18px", fontSize: 13 }}
              onClick={() => { const p = new URLSearchParams(searchParams.toString()); p.set("category_id", c.category_id); router.push(`/marketplace?${p}`); }}>
              {t(`categories.${c.category_id}` as any) || c.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Filter Row 2: Trading Method ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{t("tradeMethod")}</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {TRADE_MODES.map((tm) => (
            <button key={tm.key}
              className={activeTradeMode === tm.key ? "btn-primary" : "btn-secondary"}
              style={{ height: 34, padding: "0 18px", fontSize: 13 }}
              onClick={() => setTradeMode(tm.key)}>
              {t(tm.labelKey)} ({tradeCounts[tm.key] || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Skill grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--muted)" }}>{t("noSkillsMatch")}</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(360px, 100%), 1fr))", gap: 20, alignItems: "stretch" }}>
          {filtered.map((skill) => {
            const isSaved = savedIds.has(skill.skill_id);
            return (
              <div className="card-dark" key={skill.skill_id} style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                {/* Header row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 6 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, flex: 1, lineHeight: 1.3 }}>{skill.name}</h3>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {skill.ip_vault_level && (
                      <span className="badge badge-yellow" style={{ fontSize: 10, flexShrink: 0, background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>IP {skill.ip_vault_level}</span>
                    )}
                    {skill.alliance_tested && (
                      <span className="badge badge-blue" style={{ fontSize: 10, flexShrink: 0 }}>{t("allianceTested")}</span>
                    )}
                    <span className="badge badge-yellow" style={{ fontSize: 10, flexShrink: 0 }}>{catName(skill)}</span>
                  </div>
                </div>

                {/* Provider + Model */}
                {skill.provider && (
                  <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                    <span className="badge badge-muted" style={{ fontSize: 11 }}>{skill.provider}</span>
                    {skill.model_name && (
                      <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "monospace" }}>{skill.model_name}</span>
                    )}
                  </div>
                )}

                {/* Tags */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                  {skill.tags.map((tag) => (
                    <span key={tag} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "rgba(112,122,138,0.12)", color: "var(--muted-strong)" }}>{tag}</span>
                  ))}
                </div>

                {/* Pricing methods — all 3 options */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 12 }}>
                  {(["buyout", "subscription", "alliance"] as const).map((method) => {
                    const supported = method === "alliance"
                      ? !!(skill.alliance_token_price)
                      : method === "buyout"
                      ? !!(skill.buyout_price)
                      : !!(skill.subscription_price);
                    const label = method === "alliance" ? t("allianceBadge") : method === "buyout" ? t("buyoutTag") : t("subscriptionTag");
                    const price = method === "alliance"
                      ? `$${skill.alliance_token_price}/10K`
                      : method === "buyout"
                      ? `$${(skill.buyout_price || 0).toLocaleString()}`
                      : `$${skill.subscription_price}/mo`;
                    return (
                      <div key={method} style={{
                        padding: "6px 8px", borderRadius: 6, textAlign: "center", fontSize: 10,
                        background: supported ? "rgba(14,203,129,0.06)" : "rgba(112,122,138,0.06)",
                        border: supported ? "1px solid rgba(14,203,129,0.18)" : "1px solid rgba(112,122,138,0.1)",
                      }}>
                        <div style={{ fontWeight: 600, marginBottom: 2, color: supported ? "var(--trading-up)" : "var(--muted)" }}>{label}</div>
                        <div style={{ fontFamily: "monospace", color: supported ? "var(--primary)" : "var(--muted)", opacity: supported ? 1 : 0.6 }}>
                          {supported ? price : t("notSupported")}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Stats row */}
                <div style={{ display: "flex", gap: 24, marginBottom: 14, padding: "12px 0", borderTop: "1px solid var(--hairline-on-dark)", borderBottom: "1px solid var(--hairline-on-dark)" }}>
                  <div>
                    <div style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 600 }}>{(skill.call_count / 1000).toFixed(1)}k</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{t("calls")}</div>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>
                      {skill.developer_address}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{t("dev")}</div>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: 10, marginTop: "auto" }}>
                  <button className="btn-primary" style={{ flex: 1, height: 36, fontSize: 13 }}
                    onClick={() => router.push(`/marketplace/${skill.skill_id}`)}
                    data-testid={`skill-card-${skill.skill_id}`}>
                    {t("viewDetails")}
                  </button>
                  <button className={isSaved ? "btn-secondary" : "btn-subscribe"} style={{ flex: 1, height: 36, fontSize: 13 }}
                    onClick={() => toggleSkillLibrary(skill)}
                    data-testid={`skill-library-${skill.skill_id}`}>
                    {isSaved ? "✓ " + t("inLibrary") : "+ " + t("addToLibrary")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
