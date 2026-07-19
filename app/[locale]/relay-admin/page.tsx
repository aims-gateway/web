"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";

import { ADMIN_KEY } from "@/shared/admin-key";

interface Stats { total_requests_24h: number; total_tokens_24h: number; active_keys: number; total_keys: number; avg_latency_ms: number; error_rate_pct: number; providers_online: number; providers_total: number; }
interface ProviderItem { provider: string; base_url: string; default_model: string; enabled: boolean; weight: number; created_at: number; provider_type: string; docs_url: string; fetched_docs: string; }
interface KeyInfo { key_id: string; key_prefix: string; user_address: string; tier: string; quota_max: number; quota_used: number; usage_pct: number; enabled: boolean; created_at: number; last_used_at: number | null; label: string; }
interface LogEntry { log_id: string; key_id: string; user_address: string; provider: string; model: string; endpoint: string; request_tokens: number; response_tokens: number; latency_ms: number; status_code: number; created_at: number; }

const LLM_PROVIDERS = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "google", label: "Google" },
  { value: "meta", label: "Meta" },
  { value: "mistral", label: "Mistral AI" },
  { value: "stability", label: "Stability AI" },
  { value: "deepseek", label: "DeepSeek" },
];

export default function RelayAdminStandalonePage() {
  const t = useTranslations("RelayAdmin");

  const [tab, setTab] = useState<"dashboard" | "keys" | "providers" | "logs">("dashboard");
  const [stats, setStats] = useState<Stats | null>(null);
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [keys, setKeys] = useState<KeyInfo[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logTotal, setLogTotal] = useState(0);
  const [logPage, setLogPage] = useState(1);

  const headers = { "x-admin-key": ADMIN_KEY, "Content-Type": "application/json" };

  const fetchStats = useCallback(() => { fetch(`/api/v2/admin/relay/stats`, { headers }).then(r => r.json()).then(setStats); }, []);
  const fetchProviders = useCallback(() => { fetch(`/api/v2/admin/relay/providers`, { headers }).then(r => r.json()).then(d => setProviders(d.items || [])); }, []);
  const fetchKeys = useCallback(() => { fetch(`/api/v2/admin/relay/keys`, { headers }).then(r => r.json()).then(d => setKeys(d.items || [])); }, []);
  const fetchLogs = useCallback((page: number) => { fetch(`/api/v2/admin/relay/logs?page=${page}&page_size=30`, { headers }).then(r => r.json()).then(d => { setLogs(d.items || []); setLogTotal(d.total || 0); }); }, []);

  useEffect(() => { fetchStats(); fetchProviders(); fetchKeys(); fetchLogs(1); }, [fetchStats, fetchProviders, fetchKeys, fetchLogs]);

  useEffect(() => {
    const iv = setInterval(() => { fetchStats(); }, 10000);
    return () => clearInterval(iv);
  }, [fetchStats]);

  // ── Provider form state ──
  const [providerType, setProviderType] = useState<"llm" | "functional">("llm");
  const [newProvider, setNewProvider] = useState({
    provider: "openai",
    providerName: "",
    base_url: "",
    api_key: "",
    default_model: "",
    docs_url: "",
  });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  // Functional provider MD upload + analysis state
  const [mdContent, setMdContent] = useState("");
  const [apiCategory, setApiCategory] = useState("search");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<Record<string, unknown> | null>(null);
  const [analyzeError, setAnalyzeError] = useState("");

  const resetProviderForm = () => {
    setNewProvider({ provider: "openai", providerName: "", base_url: "", api_key: "", default_model: "", docs_url: "" });
    setMdContent("");
    setAnalysisResult(null);
    setAnalyzeError("");
    setAddError("");
  };

  const addProvider = async () => {
    setAddError("");
    setAdding(true);
    try {
      const body: Record<string, unknown> = {
        provider: providerType === "llm" ? newProvider.provider : (newProvider.providerName || newProvider.provider),
        base_url: newProvider.base_url,
        api_key: newProvider.api_key,
        default_model: providerType === "llm" ? newProvider.default_model : "",
        enabled: true,
        weight: 100,
        timeout_seconds: 120,
        max_retries: 3,
        provider_type: providerType,
        docs_url: newProvider.docs_url,
        api_category: providerType === "functional" ? apiCategory : "",
        md_content: providerType === "functional" ? mdContent : "",
      };
      const r = await fetch(`/api/v2/admin/relay/providers/add`, { method: "POST", headers, body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok || d.success === false) {
        setAddError(d.detail || d.error || `HTTP ${r.status}`);
        return;
      }
      resetProviderForm();
      fetchProviders();
    } catch (e: unknown) {
      setAddError(e instanceof Error ? e.message : "Network error");
    } finally {
      setAdding(false);
    }
  };

  const analyzeDocs = async () => {
    if (!mdContent.trim()) return;
    setAnalyzeError("");
    setAnalyzing(true);
    try {
      const r = await fetch(`/api/v2/admin/relay/providers/analyze-docs`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          provider: newProvider.providerName || newProvider.provider,
          base_url: newProvider.base_url || "https://placeholder.local",
          api_key: newProvider.api_key || "placeholder",
          provider_type: "functional",
          api_category: apiCategory,
          md_content: mdContent,
        }),
      });
      const d = await r.json();
      if (d.success) {
        setAnalysisResult(d.analysis);
      } else {
        setAnalyzeError(d.error || "Analysis failed");
      }
    } catch (e: unknown) {
      setAnalyzeError(e instanceof Error ? e.message : "Network error");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleMdFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 64 * 1024) {
      setAnalyzeError("File too large (max 64KB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setMdContent(reader.result as string);
      setAnalyzeError("");
    };
    reader.onerror = () => setAnalyzeError("Failed to read file");
    reader.readAsText(file);
  };

  const revokeKey = async (keyId: string) => {
    await fetch(`/api/v2/admin/relay/keys/revoke`, { method: "POST", headers, body: JSON.stringify({ key_id: keyId }) });
    fetchKeys();
  };

  const toggleProvider = async (p: ProviderItem) => {
    await fetch(`/api/v2/admin/relay/providers/add`, {
      method: "POST", headers,
      body: JSON.stringify({
        provider: p.provider, base_url: p.base_url, api_key: "placeholder",
        default_model: p.default_model, enabled: !p.enabled, weight: p.weight,
        timeout_seconds: 120, max_retries: 3,
        provider_type: p.provider_type || "llm",
        docs_url: p.docs_url || "",
      }),
    });
    fetchProviders();
  };

  const removeProvider = async (provider: string) => {
    await fetch(`/api/v2/admin/relay/providers/remove?provider=${provider}`, { method: "POST", headers });
    fetchProviders();
  };

  const tabLabels: Record<string, string> = {
    dashboard: t("dashboard"),
    keys: `${t("apiKeys")} (${keys.length})`,
    providers: `${t("providers")} (${providers.length})`,
    logs: `${t("logs")} (${logTotal})`,
  };
  const tabs = ["dashboard", "keys", "providers", "logs"] as const;

  return (
    <main style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>{t("title")}</h1>
        <span style={{ fontSize: 11, color: "var(--primary)", background: "rgba(252,213,53,0.1)", padding: "4px 10px", borderRadius: 4, fontWeight: 600 }}>{t("standaloneBadge")}</span>
      </div>
      <p style={{ color: "var(--muted)", fontSize: 13, margin: "0 0 24px" }}>{t("subtitle")}</p>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 28, borderBottom: "1px solid var(--hairline-on-dark)", paddingBottom: 0 }}>
        {tabs.map(tb => (
          <button key={tb} onClick={() => setTab(tb)} style={{
            padding: "10px 20px", fontSize: 13, fontWeight: 600, border: "none", background: "none",
            color: tab === tb ? "var(--primary)" : "var(--muted)",
            borderBottom: tab === tb ? "2px solid var(--primary)" : "2px solid transparent",
            cursor: "pointer", marginBottom: -1,
          }}>{tabLabels[tb]}</button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          Dashboard
         ══════════════════════════════════════════════════════════════════════ */}
      {tab === "dashboard" && stats && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
            {[
              { label: t("requests24h"), value: stats.total_requests_24h.toLocaleString() },
              { label: t("tokens24h"), value: stats.total_tokens_24h.toLocaleString() },
              { label: t("avgLatency"), value: `${stats.avg_latency_ms}ms` },
              { label: t("errorRate"), value: `${stats.error_rate_pct}%` },
              { label: t("activeKeys"), value: `${stats.active_keys}/${stats.total_keys}` },
              { label: t("providersOnline"), value: `${stats.providers_online}/${stats.providers_total}` },
              { label: t("uptime"), value: t("running") },
              { label: t("status"), value: t("healthy") },
            ].map(m => (
              <div key={m.label} className="card-dark" style={{ padding: "16px 20px" }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: m.value === t("healthy") ? "var(--trading-up)" : m.value.includes("%") && parseFloat(m.value) > 5 ? "var(--trading-down)" : "var(--body)" }}>
                  {m.value}
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{m.label}</div>
              </div>
            ))}
          </div>

          <div className="card-dark" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 14px" }}>{t("providerStatus")}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {providers.map(p => (
                <div key={p.provider} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 6, background: p.enabled ? "rgba(14,203,129,0.06)" : "rgba(255,255,255,0.03)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontWeight: 600, fontSize: 14, textTransform: "capitalize" }}>{p.provider}</span>
                    <TypeBadge type={p.provider_type} llmLabel={t("providerTypeLlm")} funcLabel={t("providerTypeFunctional")} />
                    <span style={{ color: "var(--muted)", fontSize: 12 }}>{p.default_model}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 12, color: "var(--muted)", fontFamily: "monospace" }}>{p.base_url}</span>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.enabled ? "var(--trading-up)" : "var(--muted)" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          API Keys (auto-generated, admin view only)
         ══════════════════════════════════════════════════════════════════════ */}
      {tab === "keys" && (
        <div>
          <div className="card-dark" style={{ padding: 16, marginBottom: 24, border: "1px solid rgba(252,213,53,0.15)", background: "rgba(252,213,53,0.04)" }}>
            <div style={{ fontSize: 13, color: "var(--primary)" }}>{t("autoKeyNote")}</div>
          </div>

          <div className="card-dark" style={{ overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--hairline-on-dark)", textAlign: "left" }}>
                  <th style={{ padding: "10px 12px", color: "var(--muted)", fontWeight: 500 }}>{t("label")}</th>
                  <th style={{ padding: "10px 12px", color: "var(--muted)", fontWeight: 500 }}>{t("keyPrefix")}</th>
                  <th style={{ padding: "10px 12px", color: "var(--muted)", fontWeight: 500 }}>{t("user")}</th>
                  <th style={{ padding: "10px 12px", color: "var(--muted)", fontWeight: 500 }}>{t("tier")}</th>
                  <th style={{ padding: "10px 12px", color: "var(--muted)", fontWeight: 500 }}>{t("usage")}</th>
                  <th style={{ padding: "10px 12px", color: "var(--muted)", fontWeight: 500 }}>{t("status")}</th>
                  <th style={{ padding: "10px 12px", color: "var(--muted)", fontWeight: 500 }}>{t("action")}</th>
                </tr>
              </thead>
              <tbody>
                {keys.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>{t("noKeys")}</td></tr>
                )}
                {keys.map(k => (
                  <tr key={k.key_id} style={{ borderBottom: "1px solid var(--hairline-on-dark)" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 500 }}>{k.label || "—"}</td>
                    <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 11 }}>{k.key_prefix}***</td>
                    <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 11 }}>{k.user_address.slice(0, 8)}...</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ padding: "2px 8px", borderRadius: 3, fontSize: 10, fontWeight: 600, background: k.tier === "enterprise" ? "rgba(252,213,53,0.15)" : k.tier === "pro" ? "rgba(59,130,246,0.15)" : "rgba(112,122,138,0.12)", color: k.tier === "enterprise" ? "var(--primary)" : k.tier === "pro" ? "#3b82f6" : "var(--muted)" }}>{k.tier.toUpperCase()}</span>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 80, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                          <div style={{ width: `${Math.min(k.usage_pct, 100)}%`, height: "100%", background: k.usage_pct > 80 ? "var(--trading-down)" : "var(--trading-up)", transition: "width 0.3s" }} />
                        </div>
                        <span style={{ fontSize: 10, color: "var(--muted)" }}>{k.usage_pct.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ color: k.enabled ? "var(--trading-up)" : "var(--trading-down)", fontSize: 11 }}>{k.enabled ? t("active") : t("revoked")}</span>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {k.enabled && <button className="btn-secondary" style={{ height: 28, fontSize: 11, padding: "0 12px" }} onClick={() => revokeKey(k.key_id)}>{t("revoke")}</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          Providers
         ══════════════════════════════════════════════════════════════════════ */}
      {tab === "providers" && (
        <div>
          {/* ── Add Provider card ── */}
          <div className="card-dark" style={{ padding: 20, marginBottom: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 14px" }}>{t("addProvider")}</h3>

            {/* Type selector */}
            <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
              <label
                onClick={() => { setProviderType("llm"); resetProviderForm(); }}
                style={{
                  flex: 1, padding: "14px 16px", borderRadius: 8, cursor: "pointer",
                  border: providerType === "llm" ? "2px solid var(--primary)" : "2px solid var(--hairline-on-dark)",
                  background: providerType === "llm" ? "rgba(252,213,53,0.05)" : "transparent",
                  transition: "border-color 0.2s",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{t("providerTypeLlm")}</div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>{t("providerTypeLlmDesc")}</div>
              </label>
              <label
                onClick={() => { setProviderType("functional"); resetProviderForm(); }}
                style={{
                  flex: 1, padding: "14px 16px", borderRadius: 8, cursor: "pointer",
                  border: providerType === "functional" ? "2px solid var(--primary)" : "2px solid var(--hairline-on-dark)",
                  background: providerType === "functional" ? "rgba(59,130,246,0.05)" : "transparent",
                  transition: "border-color 0.2s",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{t("providerTypeFunctional")}</div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>{t("providerTypeFunctionalDesc")}</div>
              </label>
            </div>

            {/* LLM form */}
            {providerType === "llm" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr 1fr auto", gap: 10, alignItems: "end" }}>
                  <div>
                    <label className="field-label">{t("provider")}</label>
                    <select className="input-dark" value={newProvider.provider} onChange={e => setNewProvider({ ...newProvider, provider: e.target.value })}>
                      {LLM_PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="field-label">{t("baseUrl")}</label>
                    <input className="input-dark" placeholder="https://api.openai.com" value={newProvider.base_url} onChange={e => setNewProvider({ ...newProvider, base_url: e.target.value })} />
                  </div>
                  <div>
                    <label className="field-label">{t("defaultModel")}</label>
                    <input className="input-dark" placeholder="gpt-4o" value={newProvider.default_model} onChange={e => setNewProvider({ ...newProvider, default_model: e.target.value })} />
                  </div>
                  <div>
                    <label className="field-label">{t("apiKey")}</label>
                    <input className="input-dark" type="password" placeholder="sk-..." value={newProvider.api_key} onChange={e => setNewProvider({ ...newProvider, api_key: e.target.value })} />
                  </div>
                  <button className="btn-primary" onClick={addProvider} disabled={adding} style={{ height: 40, whiteSpace: "nowrap" }}>{adding ? t("adding") : t("add")}</button>
                </div>
                {addError && <div style={{ marginTop: 8, fontSize: 12, color: "var(--trading-down)" }}>{addError}</div>}
              </>
            )}

            {/* Functional form */}
            {providerType === "functional" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, alignItems: "end", marginBottom: 12 }}>
                  <div>
                    <label className="field-label">{t("providerName")}</label>
                    <input className="input-dark" placeholder={t("providerNamePlaceholder")} value={newProvider.providerName} onChange={e => setNewProvider({ ...newProvider, providerName: e.target.value })} />
                  </div>
                  <div>
                    <label className="field-label">{t("baseUrl")}</label>
                    <input className="input-dark" placeholder="https://api.service.com/v1" value={newProvider.base_url} onChange={e => setNewProvider({ ...newProvider, base_url: e.target.value })} />
                  </div>
                  <div>
                    <label className="field-label">{t("apiKey")}</label>
                    <input className="input-dark" type="password" placeholder="api-key-..." value={newProvider.api_key} onChange={e => setNewProvider({ ...newProvider, api_key: e.target.value })} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "end", marginBottom: 12 }}>
                  <div>
                    <label className="field-label">{t("apiCategory")}</label>
                    <select className="input-dark" value={apiCategory} onChange={e => setApiCategory(e.target.value)}>
                      <option value="search">{t("categorySearch")}</option>
                      <option value="email">{t("categoryEmail")}</option>
                      <option value="social">{t("categorySocial")}</option>
                      <option value="dev">{t("categoryDev")}</option>
                      <option value="finance">{t("categoryFinance")}</option>
                      <option value="storage">{t("categoryStorage")}</option>
                      <option value="messaging">{t("categoryMessaging")}</option>
                      <option value="ai">{t("categoryAi")}</option>
                      <option value="weather">{t("categoryWeather")}</option>
                      <option value="ecommerce">{t("categoryEcommerce")}</option>
                      <option value="other">{t("categoryOther")}</option>
                    </select>
                  </div>
                  <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span className="field-label">{t("uploadMdFile")}</span>
                    <input type="file" accept=".md,.txt,.markdown" onChange={handleMdFileUpload} style={{ fontSize: 12, color: "var(--body)", maxWidth: 180 }} />
                  </label>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label className="field-label">{t("mdContent")}</label>
                  <textarea
                    className="input-dark"
                    rows={8}
                    placeholder={t("mdContentPlaceholder")}
                    value={mdContent}
                    onChange={e => { setMdContent(e.target.value); setAnalyzeError(""); }}
                    style={{ width: "100%", resize: "vertical", fontFamily: "monospace", fontSize: 12, lineHeight: 1.5 }}
                  />
                  <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4 }}>{t("mdContentHint")}</div>
                </div>

                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                  <button
                    className="btn-secondary"
                    onClick={analyzeDocs}
                    disabled={analyzing || !mdContent.trim()}
                    style={{ height: 40 }}
                  >
                    {analyzing ? t("analyzing") : t("analyzeDocs")}
                  </button>
                  <button className="btn-primary" onClick={addProvider} disabled={adding} style={{ height: 40 }}>
                    {adding ? t("adding") : t("addProviderBtn")}
                  </button>
                  {addError && <span style={{ fontSize: 12, color: "var(--trading-down)" }}>{addError}</span>}
                </div>

                {analyzeError && (
                  <div style={{ padding: 10, borderRadius: 6, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", marginBottom: 8, fontSize: 12, color: "var(--trading-down)" }}>{analyzeError}</div>
                )}

                {analysisResult && !("error" in analysisResult) && (
                  <div style={{ marginTop: 8, padding: 14, borderRadius: 6, background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.15)", maxHeight: 320, overflow: "auto" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#3b82f6", marginBottom: 10 }}>{t("analysisResult")}</div>
                    {typeof analysisResult.service_name === "string" && (
                      <div style={{ marginBottom: 8 }}>
                        <strong style={{ fontSize: 13 }}>{analysisResult.service_name}</strong>
                        {typeof analysisResult.category === "string" && <span style={{ marginLeft: 8, fontSize: 11, color: "var(--muted)" }}>{analysisResult.category.toUpperCase()}</span>}
                      </div>
                    )}
                    {typeof analysisResult.summary === "string" && <p style={{ fontSize: 11, color: "var(--body)", margin: "0 0 8px", lineHeight: 1.5 }}>{analysisResult.summary}</p>}
                    {Boolean(analysisResult.pricing) && typeof analysisResult.pricing === "object" && (
                      <div style={{ fontSize: 11, marginBottom: 8 }}>
                        <span style={{ fontWeight: 600 }}>Pricing: </span>
                        {String((analysisResult.pricing as Record<string, unknown>).model || "")}
                        {typeof analysisResult.recommended_price_usdt === "string" ? ` → Recommended: ${analysisResult.recommended_price_usdt} USDT/1K calls` : ""}
                      </div>
                    )}
                    {Array.isArray(analysisResult.endpoints) && (analysisResult.endpoints as Array<Record<string, unknown>>).length > 0 && (
                      <div style={{ fontSize: 11 }}>
                        <span style={{ fontWeight: 600 }}>Endpoints: </span>
                        {(analysisResult.endpoints as Array<Record<string, unknown>>).map((ep: Record<string, unknown>, i: number) => (
                          <span key={i} style={{ display: "inline-block", marginRight: 8, padding: "1px 6px", borderRadius: 3, background: "rgba(255,255,255,0.04)", fontFamily: "monospace", marginBottom: 4 }}>{String(ep.method || "")} {String(ep.path || "")}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {analysisResult && "error" in analysisResult && (
                  <div style={{ marginTop: 8, padding: 10, borderRadius: 6, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 12, color: "var(--trading-down)" }}>
                    {String(analysisResult.error)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Provider list ── */}
          <div style={{ display: "grid", gap: 12 }}>
            {providers.map(p => (
              <div key={p.provider} className="card-dark" style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.enabled ? "var(--trading-up)" : "var(--muted)", flexShrink: 0 }} />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 15, textTransform: "capitalize" }}>{p.provider}</span>
                      <TypeBadge type={p.provider_type} llmLabel={t("providerTypeLlm")} funcLabel={t("providerTypeFunctional")} />
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "monospace", marginTop: 2 }}>{p.base_url}</div>
                    {p.provider_type === "functional" && p.docs_url && (
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>Docs: {p.docs_url}</div>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  {p.provider_type === "llm" && p.default_model && (
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>{t("defaultModel")}: <strong>{p.default_model}</strong></span>
                  )}
                  {p.provider_type === "functional" && p.fetched_docs && (
                    <span style={{ fontSize: 11, color: "#3b82f6" }}>{t("docsAnalyzed")}</span>
                  )}
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>{t("weight")}: {p.weight}</span>
                  <button className="btn-secondary" style={{ height: 28, fontSize: 11 }} onClick={() => toggleProvider(p)}>{p.enabled ? t("disable") : t("enable")}</button>
                  <button className="btn-secondary" style={{ height: 28, fontSize: 11, color: "var(--trading-down)" }} onClick={() => removeProvider(p.provider)}>{t("remove")}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          Logs
         ══════════════════════════════════════════════════════════════════════ */}
      {tab === "logs" && (
        <div>
          <div className="card-dark" style={{ overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--hairline-on-dark)", textAlign: "left" }}>
                  <th style={{ padding: "10px 12px", color: "var(--muted)", fontWeight: 500 }}>{t("time")}</th>
                  <th style={{ padding: "10px 12px", color: "var(--muted)", fontWeight: 500 }}>{t("provider")}</th>
                  <th style={{ padding: "10px 12px", color: "var(--muted)", fontWeight: 500 }}>{t("model")}</th>
                  <th style={{ padding: "10px 12px", color: "var(--muted)", fontWeight: 500 }}>{t("endpoint")}</th>
                  <th style={{ padding: "10px 12px", color: "var(--muted)", fontWeight: 500 }}>{t("tokens")}</th>
                  <th style={{ padding: "10px 12px", color: "var(--muted)", fontWeight: 500 }}>{t("latency")}</th>
                  <th style={{ padding: "10px 12px", color: "var(--muted)", fontWeight: 500 }}>{t("status")}</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>{t("noLogs")}</td></tr>
                )}
                {logs.map(l => (
                  <tr key={l.log_id} style={{ borderBottom: "1px solid var(--hairline-on-dark)" }}>
                    <td style={{ padding: "10px 12px", fontSize: 11, color: "var(--muted)" }}>{new Date(l.created_at * 1000).toISOString().slice(0, 19).replace("T", " ")}</td>
                    <td style={{ padding: "10px 12px", textTransform: "capitalize" }}>{l.provider}</td>
                    <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 11 }}>{l.model}</td>
                    <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 11 }}>{l.endpoint}</td>
                    <td style={{ padding: "10px 12px" }}>{l.request_tokens + l.response_tokens}</td>
                    <td style={{ padding: "10px 12px" }}>{l.latency_ms}ms</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ color: l.status_code < 400 ? "var(--trading-up)" : "var(--trading-down)" }}>{l.status_code}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {logTotal > 30 && (
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16 }}>
              <button className="btn-secondary" disabled={logPage <= 1} onClick={() => { const p = logPage - 1; setLogPage(p); fetchLogs(p); }}>{t("previous")}</button>
              <span style={{ padding: "6px 12px", fontSize: 12, color: "var(--muted)" }}>{t("page")} {logPage} / {Math.ceil(logTotal / 30)}</span>
              <button className="btn-secondary" disabled={logPage >= Math.ceil(logTotal / 30)} onClick={() => { const p = logPage + 1; setLogPage(p); fetchLogs(p); }}>{t("next")}</button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

// ── Reusable type badge ──
function TypeBadge({ type, llmLabel, funcLabel }: { type: string; llmLabel: string; funcLabel: string }) {
  const isFunctional = type === "functional";
  return (
    <span style={{
      padding: "1px 6px", borderRadius: 3, fontSize: 9, fontWeight: 700,
      background: isFunctional ? "rgba(59,130,246,0.15)" : "rgba(252,213,53,0.12)",
      color: isFunctional ? "#3b82f6" : "var(--primary)",
      textTransform: "uppercase", letterSpacing: "0.5px",
    }}>
      {isFunctional ? funcLabel : llmLabel}
    </span>
  );
}
