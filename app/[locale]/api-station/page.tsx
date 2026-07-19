"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

interface LlmModel {
  id: string;
  name: string;
  description: string;
  basePrice: string;
  rpm: number;
  dailyQuota: number;
}

interface FuncProvider {
  id: string;
  name: string;
  category: string;
  description: string;
  basePrice: string;
  rpm: number;
  dailyQuota: number;
}

interface ApiKey {
  key_id: string;
  key_prefix: string;
  tier: string;
  created_at: number;
  usage_pct: number;
  quota_max: number;
  quota_used: number;
  enabled: boolean;
  label: string;
  provider?: string;
}

const LLM_MODELS: LlmModel[] = [
  { id: "deepseek-r1", name: "DeepSeek-R1", description: "Chain-of-thought reasoning model, 128K context", basePrice: "$0.014/1K", rpm: 60, dailyQuota: 1000 },
  { id: "deepseek-v3", name: "DeepSeek-V3", description: "General-purpose LLM, 128K context", basePrice: "$0.010/1K", rpm: 60, dailyQuota: 1000 },
  { id: "gpt-4o", name: "GPT-4o", description: "OpenAI multimodal model, 128K context", basePrice: "$0.025/1K", rpm: 120, dailyQuota: 2000 },
  { id: "claude-opus", name: "Claude 3 Opus", description: "Anthropic most capable model, 200K context", basePrice: "$0.030/1K", rpm: 60, dailyQuota: 1000 },
  { id: "gemini-pro", name: "Gemini 1.5 Pro", description: "Google multimodal model, 1M context", basePrice: "$0.017/1K", rpm: 120, dailyQuota: 2000 },
  { id: "llama-70b", name: "LLaMA 3.1 70B", description: "Meta open-source LLM via AIMS mesh", basePrice: "$0.006/1K", rpm: 300, dailyQuota: 10000 },
  { id: "mixtral", name: "Mixtral 8x7B", description: "Mistral MoE model, 32K context", basePrice: "$0.005/1K", rpm: 300, dailyQuota: 5000 },
];

const FUNC_CATEGORIES = [
  {
    key: "search",
    nameKey: "categorySearch" as const,
    providers: [
      { id: "google-search", name: "Google Search API", category: "search", description: "Web search with rich snippets and structured data", basePrice: "$0.005/req", rpm: 100, dailyQuota: 500 },
      { id: "serp-api", name: "SERP API", category: "search", description: "Real-time search engine results across Google, Bing, Yahoo", basePrice: "$0.003/req", rpm: 200, dailyQuota: 1000 },
    ],
  },
  {
    key: "email",
    nameKey: "categoryEmail" as const,
    providers: [
      { id: "hunter-io", name: "Hunter.io", category: "email", description: "Email finder & verifier for professional outreach", basePrice: "$0.010/req", rpm: 30, dailyQuota: 200 },
      { id: "sendgrid", name: "SendGrid", category: "email", description: "Transactional email delivery at scale", basePrice: "$0.001/email", rpm: 600, dailyQuota: 10000 },
      { id: "mailgun", name: "Mailgun", category: "email", description: "Email API for developers — send, receive, track", basePrice: "$0.001/email", rpm: 600, dailyQuota: 10000 },
    ],
  },
  {
    key: "social",
    nameKey: "categorySocial" as const,
    providers: [
      { id: "twitter-api", name: "X (Twitter) API", category: "social", description: "Read/write tweets, manage DMs, analytics", basePrice: "$0.008/req", rpm: 60, dailyQuota: 500 },
      { id: "instagram-api", name: "Instagram Graph API", category: "social", description: "Business account insights and publishing", basePrice: "$0.010/req", rpm: 30, dailyQuota: 200 },
    ],
  },
  {
    key: "dev",
    nameKey: "categoryDev" as const,
    providers: [
      { id: "github-api", name: "GitHub API", category: "dev", description: "Repository management, issues, PRs, actions", basePrice: "$0.002/req", rpm: 300, dailyQuota: 5000 },
      { id: "vercel-api", name: "Vercel API", category: "dev", description: "Deploy, configure domains, manage projects", basePrice: "$0.005/req", rpm: 60, dailyQuota: 500 },
    ],
  },
  {
    key: "finance",
    nameKey: "categoryFinance" as const,
    providers: [
      { id: "coingecko", name: "CoinGecko API", category: "finance", description: "Crypto prices, market data, historical charts", basePrice: "$0.003/req", rpm: 120, dailyQuota: 2000 },
      { id: "stripe-api", name: "Stripe API", category: "finance", description: "Payment processing, subscriptions, invoicing", basePrice: "$0.008/req", rpm: 60, dailyQuota: 500 },
    ],
  },
];

const RELAY_ENDPOINT = "https://aims-gateway.fly.dev/v1";

export default function ApiStationPage() {
  const t = useTranslations("ApiStationPage");
  const common = useTranslations("Common");
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const formatBalance = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const getStoredBalance = (): number => {
    if (typeof window === "undefined") return 1250.0;
    const raw = sessionStorage.getItem("aims_balance");
    return raw ? parseFloat(raw) : 1250.0;
  };

  const [balance, setBalance] = useState(() => {
    if (typeof window === "undefined") return "1,250.00";
    const raw = sessionStorage.getItem("aims_balance");
    return formatBalance(raw ? parseFloat(raw) : 1250.0);
  });
  const [keyCopied, setKeyCopied] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositing, setDepositing] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletConfirmStep, setWalletConfirmStep] = useState<"idle" | "confirming" | "done">("idle");
  const [revoking, setRevoking] = useState<string | null>(null);
  const [selectedFuncCategory, setSelectedFuncCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);

  // Per-model generated keys { modelId: fullKeyString }
  const [llmKeys, setLlmKeys] = useState<Record<string, string>>({});
  // Which model/provider is currently generating
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  // Which model to show config snippet for
  const [expandedConfig, setExpandedConfig] = useState<string | null>(null);
  // Which provider's key is being shown
  const [expandedFuncKey, setExpandedFuncKey] = useState<string | null>(null);
  const getAuthHeaders = () => {
    const token = sessionStorage.getItem("aims_token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchKeys = async () => {
    try {
      const res = await fetch(`/api/v2/developer/keys`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setApiKeys(data.items || []);
      }
    } catch {
      /* API not reachable */
    }
  };

  useEffect(() => {
    if (!sessionStorage.getItem("aims_wallet")) {
      router.push("/login");
      return;
    }
    setBalance(formatBalance(getStoredBalance()));
    setLoading(false);
    fetchKeys();
  }, [router]);

  const handleGenerateLlmKey = async (modelId: string, modelName: string) => {
    setGeneratingId(modelId);
    try {
      const res = await fetch(`/api/v2/developer/keys`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ provider: modelId, label: `AIMS LLM — ${modelName}` }),
      });
      if (res.ok) {
        const data = await res.json();
        setLlmKeys((prev) => ({ ...prev, [modelId]: data.api_key }));
        setExpandedConfig(modelId);
        fetchKeys();
      }
    } catch {
      /* API not reachable */
    }
    setGeneratingId(null);
  };

  const handleRevokeKey = async (keyId: string) => {
    setRevoking(keyId);
    try {
      const res = await fetch(`/api/v2/developer/keys/${keyId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setApiKeys((prev) => prev.filter((k) => k.key_id !== keyId));
      }
    } catch {
      /* API not reachable */
    }
    setRevoking(null);
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 3000);
  };

  const handleDeposit = () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) return;
    setShowWalletModal(true);
    setWalletConfirmStep("idle");
  };

  const confirmWalletDeposit = () => {
    setWalletConfirmStep("confirming");
    setTimeout(() => {
      const amt = parseFloat(depositAmount);
      const current = getStoredBalance();
      const newBalance = current + amt;
      sessionStorage.setItem("aims_balance", newBalance.toFixed(2));
      setBalance(formatBalance(newBalance));
      setDepositAmount("");
      setWalletConfirmStep("done");
      setTimeout(() => {
        setShowWalletModal(false);
        setWalletConfirmStep("idle");
      }, 1500);
    }, 2000);
  };

  const filteredFuncCategories = FUNC_CATEGORIES.map((cat) => ({
    ...cat,
    providers: cat.providers.filter(
      (p) =>
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((cat) => selectedFuncCategory === "all" || cat.key === selectedFuncCategory);

  if (loading)
    return (
      <div style={{ padding: 80, textAlign: "center", color: "var(--muted)" }}>
        {common("loading")}
      </div>
    );

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, margin: "0 0 8px" }}>{t("title")}</h1>
      <p style={{ color: "var(--muted)", fontSize: 14, margin: "0 0 36px" }}>{t("desc")}</p>

      {/* ── Balance & Deposit ── */}
      <div className="card-dark" style={{ marginBottom: 32 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 4px" }}>{t("depositPool")}</h3>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 32,
                fontWeight: 700,
                color: "var(--trading-up)",
              }}
            >
              ${balance}
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
            <div>
              <label
                style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}
              >
                {t("depositUSDT")}
              </label>
              <input
                className="input-dark"
                placeholder="100.00"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                style={{ width: 160 }}
              />
            </div>
            <button
              className="btn-primary"
              disabled={!depositAmount || depositing}
              onClick={handleDeposit}
              style={{ height: 42, whiteSpace: "nowrap" }}
            >
              {depositing ? "..." : t("topUp")}
            </button>
          </div>
        </div>
        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>{t("depositHint")}</div>
      </div>

      {/* ═══════════════════════════════════════════════
          BLOCK 1 — 大模型 / LLM (OpenAI-compatible)
          ═══════════════════════════════════════════════ */}
      <div className="card-dark" style={{ marginBottom: 32, padding: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>{t("llmBlock")}</h2>
        <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 16px", lineHeight: 1.5 }}>
          {t("llmBlockDesc")}
        </p>

        {/* Endpoint display */}
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            background: "rgba(14,203,129,0.06)",
            border: "1px solid rgba(14,203,129,0.15)",
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>
            {t("llmEndpoint")}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <code
              style={{
                fontFamily: "monospace",
                fontSize: 14,
                color: "var(--trading-up)",
                wordBreak: "break-all",
              }}
            >
              {RELAY_ENDPOINT}
            </code>
            <button
              className="btn-secondary"
              style={{ height: 28, fontSize: 11, flexShrink: 0 }}
              onClick={() => copyKey(RELAY_ENDPOINT)}
            >
              {keyCopied ? t("keyCopied") : common("copy")}
            </button>
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
            {t("llmEndpointHint")}
          </div>
        </div>

        {/* Compatible tools */}
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 20,
            fontSize: 11,
            color: "var(--muted-strong)",
          }}
        >
          <span style={{ fontWeight: 600 }}>{t("compatibleTools")}:</span>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: 4,
              background: "rgba(112,122,138,0.1)",
            }}
          >
            Cursor
          </span>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: 4,
              background: "rgba(112,122,138,0.1)",
            }}
          >
            OpenAI Codex CLI
          </span>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: 4,
              background: "rgba(112,122,138,0.1)",
            }}
          >
            Claude Desktop (MCP)
          </span>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: 4,
              background: "rgba(112,122,138,0.1)",
            }}
          >
            Continue.dev
          </span>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: 4,
              background: "rgba(112,122,138,0.1)",
            }}
          >
            OpenAI SDK
          </span>
        </div>

        {/* Model grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(320px, 100%), 1fr))",
            gap: 16,
          }}
        >
          {LLM_MODELS.map((model) => {
            const key = llmKeys[model.id];
            const isExpanded = expandedConfig === model.id;
            return (
              <div
                key={model.id}
                className="card-dark"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  border: key ? "1px solid rgba(14,203,129,0.2)" : undefined,
                }}
              >
                <h5 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>
                  {model.name}
                </h5>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--muted)",
                    margin: "0 0 12px",
                    lineHeight: 1.4,
                    flex: 1,
                  }}
                >
                  {model.description}
                </p>
                <div
                  style={{
                    padding: "6px 8px",
                    borderRadius: 6,
                    background: "rgba(112,122,138,0.06)",
                    marginBottom: 12,
                  }}
                >
                  <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 2 }}>
                    {t("basePrice")}
                  </div>
                  <div style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 600 }}>
                    {model.basePrice}
                    <span style={{ fontSize: 10, color: "var(--muted)", fontWeight: 400 }}>
                      {" "}
                      +10%
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    fontSize: 11,
                    color: "var(--muted)",
                    marginBottom: 14,
                  }}
                >
                  <span>
                    {t("requestsPerMin")}: {model.rpm}
                  </span>
                  <span>
                    {t("dailyQuota")}: {model.dailyQuota.toLocaleString()}
                  </span>
                </div>

                {key ? (
                  <>
                    <div
                      style={{
                        padding: 8,
                        borderRadius: 6,
                        background: "rgba(14,203,129,0.08)",
                        border: "1px solid rgba(14,203,129,0.15)",
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "monospace",
                          fontSize: 11,
                          wordBreak: "break-all",
                          color: "var(--muted)",
                          marginBottom: 6,
                        }}
                      >
                        {key}
                      </div>
                      <button
                        className="btn-secondary"
                        style={{ height: 24, fontSize: 10, padding: "0 10px" }}
                        onClick={() => copyKey(key)}
                      >
                        {keyCopied ? t("keyCopied") : t("copyKey")}
                      </button>
                    </div>
                    <button
                      className="btn-secondary"
                      style={{
                        height: 26,
                        fontSize: 11,
                        padding: "0 12px",
                        width: "100%",
                      }}
                      onClick={() =>
                        setExpandedConfig(isExpanded ? null : model.id)
                      }
                    >
                      {isExpanded ? t("hideConfig") : t("showConfig")}
                    </button>
                    {isExpanded && (
                      <ConfigSnippets
                        modelId={model.id}
                        t={t}
                        onCopy={copyKey}
                        keyCopied={keyCopied}
                      />
                    )}
                  </>
                ) : (
                  <button
                    className="btn-primary"
                    style={{ height: 34, fontSize: 13, padding: "0 20px", width: "100%" }}
                    onClick={() => handleGenerateLlmKey(model.id, model.name)}
                    disabled={generatingId === model.id}
                  >
                    {generatingId === model.id ? "..." : t("generateLlmKey")}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          BLOCK 2 — 功能型 API / Functional
          ═══════════════════════════════════════════════ */}
      <div className="card-dark" style={{ marginBottom: 32, padding: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>
          {t("functionalBlock")}
        </h2>
        <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 20px", lineHeight: 1.5 }}>
          {t("functionalBlockDesc")}
        </p>

        {/* Category tabs + Search */}
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flex: 1 }}>
            <button
              className={
                selectedFuncCategory === "all" ? "btn-primary" : "btn-secondary"
              }
              style={{ height: 32, padding: "0 16px", fontSize: 12 }}
              onClick={() => setSelectedFuncCategory("all")}
            >
              {common("viewAll")}
            </button>
            {FUNC_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                className={
                  selectedFuncCategory === cat.key ? "btn-primary" : "btn-secondary"
                }
                style={{ height: 32, padding: "0 16px", fontSize: 12 }}
                onClick={() => setSelectedFuncCategory(cat.key)}
              >
                {t(cat.nameKey)}
              </button>
            ))}
          </div>
          <input
            className="input-dark"
            placeholder={common("search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: 220, height: 36, fontSize: 13 }}
          />
        </div>

        {/* Provider cards by category */}
        {filteredFuncCategories.map((cat) => (
          <div key={cat.key} style={{ marginBottom: 24 }}>
            <h4
              style={{
                fontSize: 14,
                fontWeight: 600,
                margin: "0 0 12px",
                color: "var(--muted-strong)",
              }}
            >
              {t(cat.nameKey)}
            </h4>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(min(320px, 100%), 1fr))",
                gap: 16,
              }}
            >
              {cat.providers.map((provider) => {
                const isExpanded = expandedFuncKey === provider.id;
                return (
                  <div
                    key={provider.id}
                    className="card-dark"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <h5 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 8px" }}>
                      {provider.name}
                    </h5>
                    <p
                      style={{
                        fontSize: 12,
                        color: "var(--muted)",
                        margin: "0 0 14px",
                        lineHeight: 1.5,
                        flex: 1,
                      }}
                    >
                      {provider.description}
                    </p>
                    <div
                      style={{
                        padding: "6px 8px",
                        borderRadius: 6,
                        background: "rgba(112,122,138,0.06)",
                        marginBottom: 14,
                      }}
                    >
                      <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 2 }}>
                        {t("basePrice")}
                      </div>
                      <div style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 600 }}>
                        {provider.basePrice}
                        <span style={{ fontSize: 10, color: "var(--muted)", fontWeight: 400 }}>
                          {" "}
                          +10%
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 16,
                        fontSize: 11,
                        color: "var(--muted)",
                        marginBottom: 14,
                      }}
                    >
                      <span>
                        {t("requestsPerMin")}: {provider.rpm}
                      </span>
                      <span>
                        {t("dailyQuota")}: {provider.dailyQuota.toLocaleString()}
                      </span>
                    </div>

                    <button
                      className="btn-secondary"
                      style={{ height: 28, fontSize: 11, padding: "0 12px", marginTop: "auto" }}
                      onClick={() =>
                        setExpandedFuncKey(isExpanded ? null : provider.id)
                      }
                    >
                      {isExpanded ? t("hideConfig") : t("showConfig")}
                    </button>
                    {isExpanded && (
                      <div style={{ marginTop: 12, padding: 10, borderRadius: 6, background: "rgba(255,255,255,0.02)", fontSize: 11, fontFamily: "monospace", color: "var(--muted)" }}>
                        {t("useYourRelayKey")}
                      </div>
                    )}
                  </div>
                );
              })}
              {cat.providers.length === 0 && (
                <div
                  style={{
                    padding: 20,
                    textAlign: "center",
                    color: "var(--muted)",
                    fontSize: 13,
                    gridColumn: "1 / -1",
                  }}
                >
                  {common("noResults")}
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredFuncCategories.every((c) => c.providers.length === 0) && (
          <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
            {common("noResults")}
          </div>
        )}
      </div>

      {/* ── Your API Keys ── */}
      <div className="card-dark" style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px" }}>{t("keyList")}</h3>
        {apiKeys.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--muted)" }}>{t("noKeys")}</p>
        ) : (
          <div>
            {apiKeys.map((key) => (
              <div
                key={key.key_id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 0",
                  borderBottom: "1px solid var(--hairline-on-dark)",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "monospace", fontSize: 13 }}>
                    {key.key_prefix}…
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>
                    {key.label}
                    {key.provider ? ` · ${key.provider}` : ""} ·{" "}
                    {new Date(key.created_at * 1000).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ textAlign: "right", marginRight: 12 }}>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 2 }}>
                    {t("quotaUsed")} {key.usage_pct}%
                  </div>
                  <div
                    style={{
                      height: 4,
                      width: 80,
                      borderRadius: 2,
                      background: "rgba(255,255,255,0.06)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${key.usage_pct}%`,
                        background: key.enabled
                          ? "var(--primary)"
                          : "var(--trading-down)",
                        borderRadius: 2,
                      }}
                    />
                  </div>
                </div>
                <button
                  className="btn-secondary"
                  style={{
                    height: 24,
                    fontSize: 10,
                    padding: "0 8px",
                    color: "var(--trading-down)",
                  }}
                  onClick={() => handleRevokeKey(key.key_id)}
                  disabled={revoking === key.key_id}
                >
                  {revoking === key.key_id ? "..." : common("revoke")}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Wallet Confirmation Modal ── */}
      {showWalletModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
          }}
        >
          <div
            className="card-dark"
            style={{ maxWidth: 420, width: "100%", padding: 28, textAlign: "center" }}
          >
            {walletConfirmStep === "idle" && (
              <>
                <div style={{ fontSize: 40, marginBottom: 12 }}>💳</div>
                <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>
                  Confirm USDT Deposit
                </h3>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--muted)",
                    margin: "0 0 20px",
                    lineHeight: 1.5,
                  }}
                >
                  You are depositing{" "}
                  <strong style={{ color: "var(--trading-up)" }}>
                    {depositAmount} USDT
                  </strong>{" "}
                  to your AIMS balance via connected wallet.
                </p>
                <div
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    background: "var(--canvas-dark)",
                    marginBottom: 20,
                    fontSize: 12,
                    fontFamily: "monospace",
                    color: "var(--muted)",
                    wordBreak: "break-all",
                  }}
                >
                  {sessionStorage.getItem("aims_wallet") || "0x..."}
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    className="btn-secondary"
                    style={{ flex: 1, height: 40 }}
                    onClick={() => {
                      setShowWalletModal(false);
                      setWalletConfirmStep("idle");
                    }}
                  >
                    {common("cancel")}
                  </button>
                  <button
                    className="btn-primary"
                    style={{ flex: 1, height: 40 }}
                    onClick={confirmWalletDeposit}
                  >
                    Confirm & Pay
                  </button>
                </div>
              </>
            )}
            {walletConfirmStep === "confirming" && (
              <>
                <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
                <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>
                  Processing Deposit...
                </h3>
                <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
                  Waiting for on-chain confirmation. This usually takes a few seconds.
                </p>
              </>
            )}
            {walletConfirmStep === "done" && (
              <>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>
                  Deposit Successful!
                </h3>
                <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
                  {depositAmount} USDT has been added to your balance.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

/** Inline config snippet component — avoids a separate file for now */
function ConfigSnippets({
  modelId,
  t,
  onCopy,
  keyCopied,
}: {
  modelId: string;
  t: ReturnType<typeof useTranslations>;
  onCopy: (text: string) => void;
  keyCopied: boolean;
}) {
  const unifiedSnippet = `curl ${RELAY_ENDPOINT}/chat/completions \\
  -H "Authorization: Bearer <your-key>" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"${modelId}","messages":[{"role":"user","content":"Hello"}]}'`;

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          className="btn-primary"
          style={{ height: 26, fontSize: 10, padding: "0 12px" }}
          onClick={() => onCopy(unifiedSnippet)}
        >
          {keyCopied ? t("keyCopied") : t("copyConfig")}
        </button>
      </div>
      <pre
        style={{
          padding: 10,
          borderRadius: 6,
          background: "var(--canvas-dark)",
          fontSize: 11,
          fontFamily: "monospace",
          whiteSpace: "pre-wrap",
          color: "var(--muted)",
          lineHeight: 1.6,
          maxHeight: 160,
          overflow: "auto",
          margin: 0,
        }}
      >
        {unifiedSnippet}
      </pre>
    </div>
  );
}
