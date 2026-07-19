"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

/* ── shared types ── */
interface SkillData {
  id: string;
  name: string;
  provider: string;
  model: string;
  price: number;
  desc: string;
  seats?: number;
}

interface CartItem {
  skillId: string;
  name: string;
  mode: "buyout" | "subscription" | "alliance";
  price: number;
  quantity: number;
}

/* ── mock skills by trading mode ── */
const BUYOUT_SKILLS: SkillData[] = [
  { id: "3",  name: "Code Llama 34B Audit",       provider: "Meta",          model: "codellama-34b",    price: 15000, desc: "Smart contract vulnerability scanner fine-tuned on Solidity/Rust/Move." },
  { id: "6",  name: "DALL-E 3 Compatible",          provider: "OpenAI",        model: "dall-e-3",         price: 8000,  desc: "Photorealistic image generation compatible with OpenAI DALL-E 3 API." },
  { id: "b3", name: "Claude 3.5 Sonnet Enterprise", provider: "Anthropic",     model: "claude-3.5-sonnet",price: 25000, desc: "Full enterprise license for Claude 3.5 Sonnet — on-prem deployment included." },
  { id: "b4", name: "Gemini 1.5 Pro Buyout",        provider: "Google",        model: "gemini-1.5-pro",   price: 18000, desc: "One-time purchase of Gemini 1.5 Pro with 1-year updates." },
];

const SUBSCRIPTION_SKILLS: SkillData[] = [
  { id: "2",  name: "Stable Diffusion XL",      provider: "Stability AI", model: "sdxl-1.0",       price: 299,  seats: 5,  desc: "1024×1024 image generation under 3s. Batch processing included." },
  { id: "s2", name: "GPT-4o Team Plan",          provider: "OpenAI",       model: "gpt-4o",          price: 499,  seats: 10, desc: "Full GPT-4o access with 10 team seats and priority queue." },
  { id: "s3", name: "Claude 3 Opus Pro",         provider: "Anthropic",    model: "claude-3-opus",   price: 399,  seats: 5,  desc: "Anthropic Claude 3 Opus — 200k context, 5 seats, SOC 2 compliant." },
  { id: "s4", name: "Gemini 1.5 Flash Startup",  provider: "Google",       model: "gemini-1.5-flash", price: 149,  seats: 3,  desc: "Fast, affordable Gemini 1.5 Flash for startups. 3 seats included." },
];

const ALLIANCE_SKILLS: SkillData[] = [
  { id: "1",  name: "LLaMA 3.1 70B Inference", provider: "Meta",       model: "llama-3.1-70b",  price: 0.0042, desc: "70B parameter LLM with streaming responses, CUDA optimization, and function calling." },
  { id: "4",  name: "Whisper Large v3 TTS",     provider: "OpenAI",    model: "whisper-large-v3", price: 0.0020, desc: "Speech-to-text supporting 100+ languages. Token-based billing." },
  { id: "5",  name: "Mixtral 8x7B MoE",         provider: "Mistral AI", model: "mixtral-8x7b",     price: 0.0050, desc: "Mixture of Experts — 8 experts gated, 32k context, MoE routing." },
  { id: "a3", name: "DeepSeek-R1 Reasoning",    provider: "DeepSeek",   model: "deepseek-r1",      price: 0.0035, desc: "Chain-of-thought reasoning model. AIMS 10% / Dev 40% / Promoter 50%." },
  { id: "a4", name: "LLaMA 3.1 70B Mesh",       provider: "Meta",       model: "llama-3.1-70b",    price: 0.0018, desc: "Community-hosted LLaMA 3.1 via AIMS mesh. Revenue split on every call." },
];

const ALL_SKILLS = [...BUYOUT_SKILLS, ...SUBSCRIPTION_SKILLS, ...ALLIANCE_SKILLS];

type TradingMode = "buyout" | "subscription" | "alliance";

/* ── sessionStorage helpers ── */
function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  const raw = sessionStorage.getItem("aims_cart");
  return raw ? JSON.parse(raw) : [];
}

function saveCart(items: CartItem[]) {
  sessionStorage.setItem("aims_cart", JSON.stringify(items));
}

function loadOwnedSkills(): CartItem[] {
  if (typeof window === "undefined") return [];
  const raw = sessionStorage.getItem("aims_owned_skills");
  return raw ? JSON.parse(raw) : [];
}

function saveOwnedSkills(items: CartItem[]) {
  sessionStorage.setItem("aims_owned_skills", JSON.stringify(items));
}

function loadSavedIds(): string[] {
  if (typeof window === "undefined") return [];
  const raw = sessionStorage.getItem("aims_skill_library");
  return raw ? JSON.parse(raw) : [];
}

function resolveSkill(id: string): SkillData | undefined {
  return ALL_SKILLS.find((s) => s.id === id);
}

function getSkillMode(id: string): TradingMode {
  if (BUYOUT_SKILLS.some((s) => s.id === id)) return "buyout";
  if (SUBSCRIPTION_SKILLS.some((s) => s.id === id)) return "subscription";
  return "alliance";
}

export default function RoutePage() {
  const common = useTranslations("Common");
  return (
    <Suspense fallback={<div style={{ padding: 80, textAlign: "center", color: "var(--muted)" }}>{common("loading")}</div>}>
      <SkillLibraryContent />
    </Suspense>
  );
}

function SkillLibraryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("TradingPage");
  const preselectedId = searchParams.get("skill_id") || "";

  const [activeMode, setActiveMode] = useState<TradingMode>("buyout");
  const [activeTab, setActiveTab] = useState<"saved" | "owned">("saved");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [ownedSkills, setOwnedSkills] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"idle" | "confirming" | "done">("idle");

  /* load state */
  useEffect(() => {
    const items = loadCart();
    setCart(items);
    setSavedIds(loadSavedIds());
    setOwnedSkills(loadOwnedSkills());

    if (preselectedId && !items.find((i) => i.skillId === preselectedId)) {
      const s = ALL_SKILLS.find((x) => x.id === preselectedId);
      if (s) {
        const mode: TradingMode = getSkillMode(preselectedId);
        const updated: CartItem[] = [...items, { skillId: preselectedId, name: s.name, mode, price: s.price, quantity: 1 }];
        saveCart(updated);
        setCart(updated);
      }
    }
  }, [preselectedId]);

  /* saved skills resolved from IDs — filter by active mode sub-tab */
  const savedSkills = savedIds
    .map((id) => ({ skill: resolveSkill(id), mode: getSkillMode(id) }))
    .filter((x): x is { skill: SkillData; mode: TradingMode } => !!x.skill)
    .filter((x) => x.mode === activeMode);

  /* owned skills filtered by active mode sub-tab */
  const filteredOwned = ownedSkills.filter((item) => item.mode === activeMode);

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const persist = (items: CartItem[]) => { saveCart(items); setCart(items); };

  const addToCart = (s: SkillData) => {
    if (cart.find((i) => i.skillId === s.id)) return;
    const updated = [...cart, { skillId: s.id, name: s.name, mode: activeMode, price: s.price, quantity: 1 }];
    persist(updated);
  };

  const removeFromCart = (skillId: string) => {
    persist(cart.filter((i) => i.skillId !== skillId));
  };

  const updateQty = (skillId: string, d: number) => {
    const updated = cart.map((i) => {
      if (i.skillId !== skillId) return i;
      const q = Math.max(1, i.quantity + d);
      return { ...i, quantity: q };
    });
    persist(updated);
  };

  const handleCheckout = () => {
    setCheckoutStep("confirming");
    setTimeout(() => {
      setCheckoutStep("done");
      /* move cart items to owned skills */
      const existing = loadOwnedSkills();
      saveOwnedSkills([...existing, ...cart]);
      setOwnedSkills([...existing, ...cart]);
      saveCart([]);
    }, 1500);
  };

  const isInCart = (id: string) => cart.some((i) => i.skillId === id);

  const modeLabel = (m: TradingMode) =>
    m === "buyout" ? t("buyout") : m === "subscription" ? t("subscription") : t("alliance");

  const formatPrice = (m: TradingMode, price: number, seats?: number) => {
    if (m === "buyout") return `$${price.toLocaleString()} ${t("oneTime")}`;
    if (m === "subscription") return `$${price}${t("perMonth")}` + (seats ? ` · ${t("seats", { count: seats })}` : "");
    return `$${price.toFixed(4)}${t("per10kTokens")}`;
  };

  /* ── Skill card (shared) ── */
  const SkillCard = ({ s, mode, action }: { s: SkillData; mode: TradingMode; action: React.ReactNode }) => (
    <div className="card-dark" key={s.id} style={{ padding: 16, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{s.name}</span>
        <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3, background: "rgba(252,213,53,0.12)", color: "var(--primary)", whiteSpace: "nowrap" }}>
          {modeLabel(mode)}
        </span>
      </div>
      <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8 }}>
        {s.provider} · <span style={{ fontFamily: "monospace" }}>{s.model}</span>
      </div>
      <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 12px", lineHeight: 1.5, flex: 1 }}>{s.desc}</p>
      <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", marginBottom: 12, color: "var(--primary)" }}>
        {formatPrice(mode, s.price, s.seats)}
      </div>
      {action}
    </div>
  );

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px", display: "flex", gap: 24 }}>
      {/* ── Left: Main content ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 4px" }}>{t("title")}</h1>
        <p style={{ color: "var(--muted)", fontSize: 14, margin: "0 0 24px" }}>{t("subtitle")}</p>

        {/* ── Saved / Owned top-level tabs ── */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          {(["saved", "owned"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "12px 28px", fontSize: 15, fontWeight: 700, borderRadius: 10,
                background: activeTab === tab ? "var(--primary)" : "var(--surface-card-dark)",
                border: activeTab === tab ? "none" : "1px solid var(--hairline-on-dark)",
                color: activeTab === tab ? "#000" : "var(--body)",
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              {tab === "saved" ? t("savedTab") : t("ownedTab")}
            </button>
          ))}
        </div>

        {/* ── Mode sub-tabs ── */}
        <div style={{ display: "flex", gap: 24, marginBottom: 24, borderBottom: "1px solid var(--hairline-on-dark)" }}>
          {(["buyout", "subscription", "alliance"] as TradingMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setActiveMode(m)}
              style={{
                fontSize: 14, fontWeight: 600, padding: "8px 0",
                background: "none", border: "none",
                borderBottom: activeMode === m ? "2px solid var(--primary)" : "2px solid transparent",
                color: activeMode === m ? "var(--primary)" : "var(--muted)",
                cursor: "pointer",
              }}
            >
              {modeLabel(m)}
            </button>
          ))}
        </div>

        {/* ── Saved Skills ── */}
        {activeTab === "saved" && (
          <div>
            {savedSkills.length === 0 ? (
              <div style={{ textAlign: "center", padding: 48, color: "var(--muted)" }}>
                <p style={{ fontSize: 14, margin: "0 0 16px" }}>{t("libraryEmpty")}</p>
                <button className="btn-primary" style={{ height: 36, fontSize: 13, padding: "0 24px" }}
                  onClick={() => router.push("/marketplace")}>
                  {t("goToMarketplace")}
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {savedSkills.map(({ skill, mode }) => (
                  <SkillCard key={skill.id} s={skill} mode={mode}
                    action={
                      <button
                        className={isInCart(skill.id) ? "btn-secondary" : "btn-primary"}
                        style={{ width: "100%", height: 36, fontSize: 13 }}
                        disabled={isInCart(skill.id)}
                        onClick={() => addToCart(skill)}
                      >
                        {isInCart(skill.id) ? "✓ " + t("inCart") : t("addToCart")}
                      </button>
                    }
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Owned Skills ── */}
        {activeTab === "owned" && (
          <div>
            {filteredOwned.length === 0 ? (
              <div style={{ textAlign: "center", padding: 48, color: "var(--muted)" }}>
                <p style={{ fontSize: 14, margin: "0 0 16px" }}>{t("mySkillsEmpty")}</p>
                <button className="btn-primary" style={{ height: 36, fontSize: 13, padding: "0 24px" }}
                  onClick={() => setActiveTab("saved")}>
                  {t("savedTab")}
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {filteredOwned.map((item) => {
                  const s = resolveSkill(item.skillId);
                  if (!s) return null;
                  return (
                    <SkillCard key={item.skillId} s={s} mode={item.mode}
                      action={
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span style={{ fontSize: 11, color: "var(--trading-up)", fontWeight: 600 }}>✓ {t("checkoutDone")}</span>
                          <span style={{ fontSize: 11, color: "var(--muted)" }}>
                            {t("quantity")}: {item.quantity}
                          </span>
                        </div>
                      }
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Right: Cart sidebar ── */}
      <div style={{ width: 320, flexShrink: 0 }}>
        <div className="card-dark" style={{ padding: 20, position: "sticky", top: 80 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 4px" }}>{t("cart")}</h3>
          {cartCount > 0 && (
            <span style={{ fontSize: 12, color: "var(--muted)" }}>{t("cartItems", { count: cartCount })}</span>
          )}

          {cart.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--muted)", margin: "16px 0", textAlign: "center" }}>
              {t("cartEmpty")}
            </p>
          ) : (
            <div style={{ marginTop: 12 }}>
              {cart.map((item) => (
                <div key={item.skillId} style={{ padding: "10px 0", borderBottom: "1px solid var(--hairline-on-dark)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>
                        {modeLabel(item.mode)}
                        {" · "}
                        <span style={{ fontFamily: "monospace" }}>${item.price.toLocaleString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.skillId)}
                      style={{ background: "none", border: "none", color: "var(--trading-down)", cursor: "pointer", fontSize: 16, padding: "0 0 0 8px", lineHeight: 1 }}
                      title={t("removeFromCart")}
                    >×</button>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>{t("quantity")}:</span>
                    <button
                      onClick={() => updateQty(item.skillId, -1)}
                      style={{ width: 22, height: 22, borderRadius: 4, border: "1px solid var(--hairline-on-dark)", background: "var(--canvas-dark)", color: "var(--body)", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}
                    >−</button>
                    <span style={{ fontSize: 13, fontFamily: "monospace", minWidth: 16, textAlign: "center" }}>{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.skillId, 1)}
                      style={{ width: 22, height: 22, borderRadius: 4, border: "1px solid var(--hairline-on-dark)", background: "var(--canvas-dark)", color: "var(--body)", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}
                    >+</button>
                  </div>
                </div>
              ))}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--hairline-on-dark)" }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{t("cartTotal")}</span>
                <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "monospace", color: "var(--primary)" }}>
                  ${cartTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {!showCheckout ? (
                <button className="btn-primary" style={{ width: "100%", marginTop: 16, height: 40, fontSize: 14 }}
                  onClick={() => setShowCheckout(true)}>
                  {t("checkout")}
                </button>
              ) : (
                <div style={{ marginTop: 16, padding: 16, borderRadius: 8, background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)", textAlign: "center" }}>
                  {checkoutStep === "confirming" && (
                    <div>
                      <div style={{ fontSize: 14, marginBottom: 8 }}>⏳</div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{t("confirmingPayment")}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{t("confirmWallet")}</div>
                    </div>
                  )}
                  {checkoutStep === "done" && (
                    <div>
                      <div style={{ fontSize: 20, marginBottom: 4, color: "var(--trading-up)" }}>✓</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--trading-up)" }}>{t("checkoutDone")}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{t("checkoutDoneDesc")}</div>
                      <button className="btn-secondary" style={{ marginTop: 10, height: 30, fontSize: 12 }}
                        onClick={() => { setShowCheckout(false); setCheckoutStep("idle"); setCart([]); }}>
                        {t("continueShopping")}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
