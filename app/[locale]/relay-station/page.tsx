"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

// ── Types ────────────────────────────────────────────────────────────────────

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

interface RelayStats {
  active_keys: number;
  total_requests_24h: number;
  total_tokens_24h: number;
  avg_latency_ms: number;
  error_rate_pct: number;
}

interface LlmProvider {
  id: string;
  name: string;
  description: string;
  model: string;
  price: string;
  rpm: number;
  dailyQuota: number;
  enabled: boolean;
  weight: number;
}

interface FuncProvider {
  id: string;
  name: string;
  category: string;
  description: string;
  price: string;
  rpm: number;
  dailyQuota: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const RELAY_ENDPOINT = "https://aims-gateway.fly.dev/v1";

const LLM_PROVIDERS: LlmProvider[] = [
  { id: "deepseek-v4-flash", name: "DeepSeek V4 Flash", model: "deepseek-v4-flash", description: "Fast inference, cost-efficient, 128K context", price: "¥1.5/1M tokens", rpm: 120, dailyQuota: 5000, enabled: true, weight: 100 },
  { id: "deepseek-v4-pro", name: "DeepSeek V4 Pro", model: "deepseek-v4-pro", description: "Deep reasoning, complex tasks, 128K context", price: "¥4.5/1M tokens", rpm: 60, dailyQuota: 2000, enabled: true, weight: 80 },
  { id: "gpt-4o", name: "GPT-4o", model: "gpt-4o", description: "OpenAI multimodal, 128K context, text + image + audio", price: "$0.025/1K tokens", rpm: 120, dailyQuota: 2000, enabled: true, weight: 80 },
  { id: "claude-opus", name: "Claude 3 Opus", model: "claude-3-opus", description: "Anthropic most capable, 200K context, deep reasoning", price: "$0.030/1K tokens", rpm: 60, dailyQuota: 1000, enabled: true, weight: 70 },
  { id: "gemini-pro", name: "Gemini 1.5 Pro", model: "gemini-1.5-pro", description: "Google multimodal, 1M context, largest window", price: "$0.017/1K tokens", rpm: 120, dailyQuota: 2000, enabled: true, weight: 90 },
  { id: "llama-70b", name: "LLaMA 3.1 70B", model: "llama-3.1-70b", description: "Meta open-source via AIMS mesh, best value", price: "$0.006/1K tokens", rpm: 300, dailyQuota: 10000, enabled: true, weight: 150 },
  { id: "mixtral", name: "Mixtral 8x7B", model: "mixtral-8x7b", description: "Mistral MoE, 32K context, fast inference", price: "$0.005/1K tokens", rpm: 300, dailyQuota: 5000, enabled: true, weight: 130 },
];

const FUNC_PROVIDERS: FuncProvider[] = [
  { id: "google-search", name: "Google Search API", category: "search", description: "Web search with rich snippets and structured data", price: "$0.005/req", rpm: 100, dailyQuota: 500 },
  { id: "serp-api", name: "SERP API", category: "search", description: "Real-time search across Google, Bing, Yahoo", price: "$0.003/req", rpm: 200, dailyQuota: 1000 },
  { id: "hunter-io", name: "Hunter.io", category: "email", description: "Email finder and verifier for professional outreach", price: "$0.010/req", rpm: 30, dailyQuota: 200 },
  { id: "sendgrid", name: "SendGrid", category: "email", description: "Transactional email delivery at scale", price: "$0.001/email", rpm: 600, dailyQuota: 10000 },
  { id: "mailgun", name: "Mailgun", category: "email", description: "Email API — send, receive, and track", price: "$0.001/email", rpm: 600, dailyQuota: 10000 },
  { id: "twitter-api", name: "X (Twitter) API", category: "social", description: "Read and write tweets, manage DMs, analytics", price: "$0.008/req", rpm: 60, dailyQuota: 500 },
  { id: "instagram-api", name: "Instagram Graph API", category: "social", description: "Business account insights and content publishing", price: "$0.010/req", rpm: 30, dailyQuota: 200 },
  { id: "github-api", name: "GitHub API", category: "dev", description: "Repository management, issues, PRs, actions", price: "$0.002/req", rpm: 300, dailyQuota: 5000 },
  { id: "vercel-api", name: "Vercel API", category: "dev", description: "Deploy, configure domains, manage projects", price: "$0.005/req", rpm: 60, dailyQuota: 500 },
  { id: "coingecko", name: "CoinGecko API", category: "finance", description: "Crypto prices, market data, historical charts", price: "$0.003/req", rpm: 120, dailyQuota: 2000 },
  { id: "stripe-api", name: "Stripe API", category: "finance", description: "Payment processing, subscriptions, invoicing", price: "$0.008/req", rpm: 60, dailyQuota: 500 },
];

const FUNC_CATEGORIES = ["search", "email", "social", "dev", "finance"] as const;
type FuncCategory = (typeof FUNC_CATEGORIES)[number];

const CATEGORY_LABELS: Record<FuncCategory, string> = {
  search: "Search & Data",
  email: "Email & Outreach",
  social: "Social & Media",
  dev: "Developer Tools",
  finance: "Finance & Crypto",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ value, label, unit }: { value: string; label: string; unit?: string }) {
  return (
    <div style={{ textAlign: "center", flex: 1, minWidth: 100 }}>
      <div style={{ fontFamily: "monospace", fontSize: 22, fontWeight: 700, color: "var(--on-dark)" }}>
        {value}
        {unit && <span style={{ fontSize: 11, fontWeight: 400, color: "var(--muted)", marginLeft: 2 }}>{unit}</span>}
      </div>
      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{label}</div>
    </div>
  );
}

function EndpointBar({ onCopy }: { onCopy: (t: string) => void }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { onCopy(RELAY_ENDPOINT); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div style={{ padding: "14px 20px", borderRadius: 10, background: "rgba(14,203,129,0.04)", border: "1px solid rgba(14,203,129,0.12)" }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
        Relay Endpoint (OpenAI-compatible)
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <code style={{ flex: 1, fontFamily: "ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, monospace", fontSize: 14, color: "var(--trading-up)", wordBreak: "break-all", minWidth: 0 }}>
          {RELAY_ENDPOINT}
        </code>
        <button className="btn-primary" style={{ height: 32, fontSize: 12, padding: "0 16px", flexShrink: 0 }} onClick={handleCopy}>
          {copied ? "Copied!" : "Copy URL"}
        </button>
      </div>
      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
        Works with Cursor, OpenAI SDK, Claude Desktop (MCP), Continue.dev, and any OpenAI-compatible client.
      </div>
    </div>
  );
}

function LlmCard({
  provider, generatedKey, generating, onGenerate, onCopy,
}: {
  provider: LlmProvider;
  generatedKey?: string;
  generating: boolean;
  onGenerate: () => void;
  onCopy: (k: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const key = generatedKey;

  const copyWithFeedback = (text: string) => { onCopy(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="card-dark" style={{ border: key ? "1px solid rgba(14,203,129,0.18)" : undefined }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: provider.enabled ? "var(--trading-up)" : "var(--muted)", flexShrink: 0 }} />
        <h5 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{provider.name}</h5>
        <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3, background: "rgba(112,122,138,0.1)", color: "var(--muted)", marginLeft: "auto" }}>{provider.rpm} RPM</span>
      </div>
      <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 12px", lineHeight: 1.45 }}>{provider.description}</p>

      <div style={{ padding: "8px 10px", borderRadius: 6, background: "rgba(112,122,138,0.05)", marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontSize: 10, color: "var(--muted)" }}>Price</span>
          <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 600 }}>{provider.price}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 4 }}>
          <span style={{ fontSize: 10, color: "var(--muted)" }}>Daily quota</span>
          <span style={{ fontFamily: "monospace", fontSize: 12 }}>{provider.dailyQuota.toLocaleString()} req</span>
        </div>
      </div>

      {key ? (
        <>
          <div style={{ padding: "8px 10px", borderRadius: 6, background: "rgba(14,203,129,0.06)", border: "1px solid rgba(14,203,129,0.12)", marginBottom: 8 }}>
            <div style={{ fontFamily: "monospace", fontSize: 11, wordBreak: "break-all", color: "var(--muted)", marginBottom: 6 }}>{key}</div>
            <button className="btn-secondary" style={{ height: 24, fontSize: 10, padding: "0 10px" }} onClick={() => copyWithFeedback(key)}>
              {copied ? "Copied!" : "Copy Key"}
            </button>
          </div>
          <button className="btn-secondary" style={{ height: 28, fontSize: 11, width: "100%" }} onClick={() => setExpanded(!expanded)}>
            {expanded ? "Hide snippets" : "Show usage snippets"}
          </button>
          {expanded && <UsageSnippets modelId={provider.id} model={provider.model} onCopy={copyWithFeedback} />}
        </>
      ) : (
        <button className="btn-primary" style={{ height: 34, fontSize: 13, width: "100%" }} onClick={onGenerate} disabled={generating}>
          {generating ? "Generating..." : "Generate API Key"}
        </button>
      )}
    </div>
  );
}

function FuncCard({
  provider, generatedKey, generating, onGenerate, onCopy,
}: {
  provider: FuncProvider;
  generatedKey?: string;
  generating: boolean;
  onGenerate: () => void;
  onCopy: (k: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const key = generatedKey;
  const copyWithFeedback = (text: string) => { onCopy(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="card-dark" style={{ border: key ? "1px solid rgba(14,203,129,0.18)" : undefined }}>
      <h5 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>{provider.name}</h5>
      <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 12px", lineHeight: 1.45 }}>{provider.description}</p>

      <div style={{ padding: "8px 10px", borderRadius: 6, background: "rgba(112,122,138,0.05)", marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontSize: 10, color: "var(--muted)" }}>Price</span>
          <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 600 }}>{provider.price}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 4 }}>
          <span style={{ fontSize: 10, color: "var(--muted)" }}>Rate / Day</span>
          <span style={{ fontFamily: "monospace", fontSize: 12 }}>{provider.rpm} RPM / {provider.dailyQuota.toLocaleString()} req</span>
        </div>
      </div>

      {key ? (
        <div style={{ padding: "8px 10px", borderRadius: 6, background: "rgba(14,203,129,0.06)", border: "1px solid rgba(14,203,129,0.12)" }}>
          <div style={{ fontFamily: "monospace", fontSize: 11, wordBreak: "break-all", color: "var(--muted)", marginBottom: 6 }}>{key}</div>
          <button className="btn-secondary" style={{ height: 24, fontSize: 10, padding: "0 10px" }} onClick={() => copyWithFeedback(key)}>
            {copied ? "Copied!" : "Copy Key"}
          </button>
        </div>
      ) : (
        <button className="btn-primary" style={{ height: 34, fontSize: 13, width: "100%" }} onClick={onGenerate} disabled={generating}>
          {generating ? "Generating..." : "Generate API Key"}
        </button>
      )}
    </div>
  );
}

function UsageSnippets({ modelId, model, onCopy }: { modelId: string; model: string; onCopy: (t: string) => void }) {
  const unifiedSnippet = `curl ${RELAY_ENDPOINT}/chat/completions \\
  -H "Authorization: Bearer <your-key>" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"${model}","messages":[{"role":"user","content":"Hello"}]}'`;

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        <button className="btn-primary" style={{ height: 26, fontSize: 10, padding: "0 12px" }} onClick={() => onCopy(unifiedSnippet)}>
          Copy Config
        </button>
      </div>
      <pre style={{ padding: 10, borderRadius: 6, background: "var(--canvas-dark)", fontSize: 11, fontFamily: "monospace", whiteSpace: "pre-wrap", color: "var(--muted)", lineHeight: 1.6, maxHeight: 160, overflow: "auto", margin: 0 }}>
        {unifiedSnippet}
      </pre>
    </div>
  );
}

function KeyRow({ apiKey, onRevoke, revoking }: { apiKey: ApiKey; onRevoke: (id: string) => void; revoking: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--hairline-on-dark)", gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "monospace", fontSize: 13, lineHeight: 1.4 }}>{apiKey.key_prefix}…</div>
        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
          {apiKey.label || apiKey.provider || "API Key"} · <span style={{ textTransform: "uppercase" }}>{apiKey.tier}</span> · {new Date(apiKey.created_at * 1000).toLocaleDateString()}
        </div>
      </div>
      <div style={{ textAlign: "right", minWidth: 80 }}>
        <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 3 }}>{apiKey.quota_used} / {apiKey.quota_max}</div>
        <div style={{ height: 4, width: 80, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.min(apiKey.usage_pct, 100)}%`, background: apiKey.enabled ? "var(--primary)" : "var(--trading-down)", borderRadius: 2 }} />
        </div>
      </div>
      <button className="btn-secondary" style={{ height: 26, fontSize: 10, padding: "0 10px", color: "var(--trading-down)", flexShrink: 0 }} onClick={() => onRevoke(apiKey.key_id)} disabled={revoking}>
        {revoking ? "..." : "Revoke"}
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RelayStationPage() {
  const common = useTranslations("Common");
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [llmKeys, setLlmKeys] = useState<Record<string, string>>({});
  const [funcKeys, setFuncKeys] = useState<Record<string, string>>({});
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [globalCopied, setGlobalCopied] = useState(false);
  const [funcCategory, setFuncCategory] = useState<string>("all");
  const [search, setSearch] = useState("");

  const getAuthHeaders = useCallback(() => {
    const token = sessionStorage.getItem("aims_token");
    return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  }, []);

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch("/api/v2/developer/keys", { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setApiKeys(data.items || []);
      }
    } catch { /* noop */ }
  }, [getAuthHeaders]);

  useEffect(() => {
    if (!sessionStorage.getItem("aims_wallet")) { router.push("/login"); return; }
    setLoading(false);
    fetchKeys();
  }, [router, fetchKeys]);

  const handleGenerateKey = async (providerId: string, label: string) => {
    setGeneratingId(providerId);
    try {
      const res = await fetch("/api/v2/developer/keys", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ provider: providerId, label }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.api_key as string;
      }
    } catch { /* noop */ }
    setGeneratingId(null);
    return null;
  };

  const generateLlmKey = async (p: LlmProvider) => {
    const key = await handleGenerateKey(p.id, `LLM — ${p.name}`);
    if (key) { setLlmKeys((prev) => ({ ...prev, [p.id]: key })); fetchKeys(); }
    setGeneratingId(null);
  };

  const generateFuncKey = async (p: FuncProvider) => {
    const key = await handleGenerateKey(p.id, `Func — ${p.name}`);
    if (key) { setFuncKeys((prev) => ({ ...prev, [p.id]: key })); fetchKeys(); }
    setGeneratingId(null);
  };

  const revokeKey = async (keyId: string) => {
    setRevokingId(keyId);
    try {
      const res = await fetch(`/api/v2/developer/keys/${keyId}`, { method: "DELETE", headers: getAuthHeaders() });
      if (res.ok) setApiKeys((prev) => prev.filter((k) => k.key_id !== keyId));
    } catch { /* noop */ }
    setRevokingId(null);
  };

  const copyText = (text: string) => { navigator.clipboard.writeText(text); setGlobalCopied(true); setTimeout(() => setGlobalCopied(false), 2000); };

  const filteredFuncs = FUNC_PROVIDERS.filter((p) => {
    if (funcCategory !== "all" && p.category !== funcCategory) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) return <div style={{ padding: 80, textAlign: "center", color: "var(--muted)" }}>{common("loading")}</div>;

  return (
    <main style={{ maxWidth: 1120, margin: "0 auto", padding: "40px 24px 80px" }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 30, fontWeight: 700, margin: "0 0 6px", display: "flex", alignItems: "center", gap: 10 }}>
          AIMS Relay Station
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 14, margin: "0 0 20px", lineHeight: 1.5 }}>
          One endpoint. All models. 10% auto-markup. Plug into any OpenAI-compatible tool.
        </p>
        <EndpointBar onCopy={copyText} />
      </div>

      {/* ── Quick Stats ── */}
      <div className="card-dark" style={{ marginBottom: 32, padding: "20px 24px" }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <StatCard value={apiKeys.length.toString()} label="Active Keys" />
          <StatCard value="24" label="Requests (24h)" />
          <StatCard value="7" label="Providers Online" />
          <StatCard value="~120" label="Avg Latency" unit="ms" />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          BLOCK 1 — LLM Models
          ═══════════════════════════════════════════════ */}
      <div className="card-dark" style={{ marginBottom: 32, padding: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>LLM Models</h2>
        <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 12px", lineHeight: 1.5 }}>
          OpenAI-compatible chat completions. Use with Cursor, Codex, Claude Desktop, or any OpenAI SDK.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20, fontSize: 11 }}>
          <span style={{ fontWeight: 600, color: "var(--muted)" }}>Compatible with:</span>
          {["Cursor", "OpenAI SDK", "Claude Desktop (MCP)", "Continue.dev", "Codex CLI"].map((t) => (
            <span key={t} style={{ padding: "2px 8px", borderRadius: 4, background: "rgba(112,122,138,0.08)", color: "var(--muted)" }}>{t}</span>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(310px, 100%), 1fr))", gap: 16 }}>
          {LLM_PROVIDERS.map((p) => (
            <LlmCard key={p.id} provider={p} generatedKey={llmKeys[p.id]} generating={generatingId === p.id} onGenerate={() => generateLlmKey(p)} onCopy={copyText} />
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          BLOCK 2 — Functional APIs
          ═══════════════════════════════════════════════ */}
      <div className="card-dark" style={{ marginBottom: 32, padding: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>Functional APIs</h2>
        <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 16px", lineHeight: 1.5 }}>
          Specialized third-party APIs — search, email, social, dev tools, and finance.
        </p>

        {/* Category + Search */}
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flex: 1 }}>
            <button className={funcCategory === "all" ? "btn-primary" : "btn-secondary"} style={{ height: 30, padding: "0 14px", fontSize: 11 }} onClick={() => setFuncCategory("all")}>All</button>
            {FUNC_CATEGORIES.map((cat) => (
              <button key={cat} className={funcCategory === cat ? "btn-primary" : "btn-secondary"} style={{ height: 30, padding: "0 14px", fontSize: 11 }} onClick={() => setFuncCategory(cat)}>
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
          <input className="input-dark" placeholder="Search APIs..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 200, height: 34, fontSize: 12 }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(310px, 100%), 1fr))", gap: 16 }}>
          {filteredFuncs.map((p) => (
            <FuncCard key={p.id} provider={p} generatedKey={funcKeys[p.id]} generating={generatingId === p.id} onGenerate={() => generateFuncKey(p)} onCopy={copyText} />
          ))}
          {filteredFuncs.length === 0 && <div style={{ padding: 40, textAlign: "center", color: "var(--muted)", fontSize: 13, gridColumn: "1 / -1" }}>No results found.</div>}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          BLOCK 3 — Your API Keys
          ═══════════════════════════════════════════════ */}
      <div className="card-dark" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>Your API Keys</h2>
        <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 16px" }}>
          Manage your generated API keys. Revoked keys stop working immediately.
        </p>
        {apiKeys.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
            No API keys yet. Generate one from the sections above.
          </div>
        ) : (
          <div>
            {apiKeys.map((key) => (
              <KeyRow key={key.key_id} apiKey={key} onRevoke={revokeKey} revoking={revokingId === key.key_id} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
