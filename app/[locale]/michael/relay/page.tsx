"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";

import { ADMIN_KEY } from "@/shared/admin-key";


interface Stats { total_requests_24h: number; total_tokens_24h: number; active_keys: number; total_keys: number; avg_latency_ms: number; error_rate_pct: number; providers_online: number; providers_total: number; }
interface ProviderKey { key_id: string; provider_name: string; key_masked: string; usage_limit: number; usage_used: number; usage_pct: number; enabled: boolean; created_at: number; label: string; }
interface Provider { provider: string; base_url: string; default_model: string; enabled: boolean; weight: number; created_at: number; provider_type: string; docs_url: string; fetched_docs: string; api_category: string; base_cost_per_1k: number; internal_price_per_1k: number; public_price_per_1k: number; model_pricing: Record<string, {input_cost_per_1m: number; output_cost_per_1m: number}>; keys: ProviderKey[]; }
interface KeyInfo { key_id: string; key_prefix: string; user_address: string; tier: string; quota_max: number; quota_used: number; usage_pct: number; enabled: boolean; created_at: number; last_used_at: number | null; label: string; }
interface LogEntry { log_id: string; key_id: string; user_address: string; provider: string; model: string; endpoint: string; request_tokens: number; response_tokens: number; latency_ms: number; status_code: number; created_at: number; }

export default function RelayAdminPage() {
  const t = useTranslations("Common");

  const [tab, setTab] = useState<"dashboard" | "keys" | "providers" | "logs">("dashboard");
  const [stats, setStats] = useState<Stats | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
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

  const [newProvider, setNewProvider] = useState({ provider: "deepseek", base_url: "", api_key: "", default_model: "", base_cost_per_1k: 0 });
  const [newKey, setNewKey] = useState({ user_address: "", tier: "basic", label: "" });
  const [issueResult, setIssueResult] = useState<{ success?: boolean; key_id?: string; key_prefix?: string; tier?: string; quota_max?: number; warning?: string } | null>(null);
  const [showAddKey, setShowAddKey] = useState<string | null>(null); // provider name to show key modal for
  const [newProviderKey, setNewProviderKey] = useState({ key_value: "", usage_limit: 0, label: "" });
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);

  const addProvider = async () => {
    await fetch(`/api/v2/admin/relay/providers/add`, { method: "POST", headers, body: JSON.stringify({ ...newProvider, enabled: true, weight: 100, timeout_seconds: 120, max_retries: 3, provider_type: "llm" }) });
    setNewProvider({ provider: "deepseek", base_url: "", api_key: "", default_model: "", base_cost_per_1k: 0 });
    fetchProviders();
  };

  const addProviderKey = async (providerName: string) => {
    await fetch(`/api/v2/admin/relay/providers/keys/add?provider=${providerName}`, { method: "POST", headers, body: JSON.stringify(newProviderKey) });
    setNewProviderKey({ key_value: "", usage_limit: 0, label: "" });
    setShowAddKey(null);
    fetchProviders();
  };

  const removeProviderKey = async (keyId: string) => {
    await fetch(`/api/v2/admin/relay/providers/keys/remove?key_id=${keyId}`, { method: "POST", headers });
    fetchProviders();
  };

  const issueKey = async () => {
    const r = await fetch(`/api/v2/admin/relay/keys/issue`, { method: "POST", headers, body: JSON.stringify(newKey) });
    const d = await r.json();
    setIssueResult(d);
    setNewKey({ user_address: "", tier: "basic", label: "" });
    fetchKeys();
  };

  const revokeKey = async (keyId: string) => {
    await fetch(`/api/v2/admin/relay/keys/revoke`, { method: "POST", headers, body: JSON.stringify({ key_id: keyId }) });
    fetchKeys();
  };

  const toggleProvider = async (p: Provider) => {
    await fetch(`/api/v2/admin/relay/providers/add`, { method: "POST", headers, body: JSON.stringify({ provider: p.provider, base_url: p.base_url, api_key: "placeholder", default_model: p.default_model, enabled: !p.enabled, weight: p.weight, timeout_seconds: 120, max_retries: 3 }) });
    fetchProviders();
  };

  const removeProvider = async (provider: string) => {
    await fetch(`/api/v2/admin/relay/providers/remove?provider=${provider}`, { method: "POST", headers });
    fetchProviders();
  };

  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "keys", label: `API Keys (${keys.length})` },
    { id: "providers", label: `Providers (${providers.length})` },
    { id: "logs", label: `Logs (${logTotal})` },
  ] as const;

  return (
    <main style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 4px" }}>AIMS Relay Station</h1>
      <p style={{ color: "var(--muted)", fontSize: 13, margin: "0 0 24px" }}>API Transit Hub — Admin Panel</p>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 28, borderBottom: "1px solid var(--hairline-on-dark)", paddingBottom: 0 }}>
        {tabs.map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)} style={{
            padding: "10px 20px", fontSize: 13, fontWeight: 600, border: "none", background: "none",
            color: tab === tb.id ? "var(--primary)" : "var(--muted)",
            borderBottom: tab === tb.id ? "2px solid var(--primary)" : "2px solid transparent",
            cursor: "pointer", marginBottom: -1,
          }}>{tb.label}</button>
        ))}
      </div>

      {/* ── Dashboard ── */}
      {tab === "dashboard" && stats && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
            {[
              { label: "24h Requests", value: stats.total_requests_24h.toLocaleString() },
              { label: "24h Tokens", value: stats.total_tokens_24h.toLocaleString() },
              { label: "Avg Latency", value: `${stats.avg_latency_ms}ms` },
              { label: "Error Rate", value: `${stats.error_rate_pct}%` },
              { label: "Active Keys", value: `${stats.active_keys}/${stats.total_keys}` },
              { label: "Providers Online", value: `${stats.providers_online}/${stats.providers_total}` },
              { label: "Uptime", value: "running" },
              { label: "Status", value: "healthy" },
            ].map(m => (
              <div key={m.label} className="card-dark" style={{ padding: "16px 20px" }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: m.value === "healthy" ? "var(--trading-up)" : m.value.includes("%") && parseFloat(m.value) > 5 ? "var(--trading-down)" : "var(--body)" }}>
                  {m.value}
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{m.label}</div>
              </div>
            ))}
          </div>

          {/* Quick provider status */}
          <div className="card-dark" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 14px" }}>Provider Status</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {providers.map(p => (
                <div key={p.provider} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 6, background: p.enabled ? "rgba(14,203,129,0.06)" : "rgba(255,255,255,0.03)" }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 14, textTransform: "capitalize" }}>{p.provider}</span>
                    <span style={{ color: "var(--muted)", fontSize: 12, marginLeft: 10 }}>{p.default_model}</span>
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

      {/* ── API Keys ── */}
      {tab === "keys" && (
        <div>
          <div className="card-dark" style={{ padding: 20, marginBottom: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 14px" }}>Issue New API Key</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 10, alignItems: "end" }}>
              <div>
                <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>Wallet Address (0x)</label>
                <input className="input-dark" placeholder="0x..." value={newKey.user_address} onChange={e => setNewKey({ ...newKey, user_address: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>Tier</label>
                <select className="input-dark" value={newKey.tier} onChange={e => setNewKey({ ...newKey, tier: e.target.value })}>
                  <option value="basic">Basic — 1K/day, 60 rpm</option>
                  <option value="pro">Pro — 10K/day, 600 rpm</option>
                  <option value="enterprise">Enterprise — 1M/day, 6000 rpm</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>Label</label>
                <input className="input-dark" placeholder="optional" value={newKey.label} onChange={e => setNewKey({ ...newKey, label: e.target.value })} />
              </div>
              <button className="btn-primary" onClick={issueKey} style={{ height: 40, whiteSpace: "nowrap" }}>Issue Key</button>
            </div>
            {issueResult?.success && (
              <div style={{ marginTop: 14, padding: 12, borderRadius: 6, background: "rgba(14,203,129,0.08)", border: "1px solid rgba(14,203,129,0.2)" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--trading-up)" }}>Key Issued: {issueResult.key_prefix}***</div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>ID: {issueResult.key_id} · Tier: {issueResult.tier} · Quota: {issueResult.quota_max?.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: "var(--primary)", marginTop: 4 }}>{issueResult.warning}</div>
              </div>
            )}
          </div>

          <div className="card-dark" style={{ overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--hairline-on-dark)", textAlign: "left" }}>
                  <th style={{ padding: "10px 12px", color: "var(--muted)", fontWeight: 500 }}>Label</th>
                  <th style={{ padding: "10px 12px", color: "var(--muted)", fontWeight: 500 }}>Key Prefix</th>
                  <th style={{ padding: "10px 12px", color: "var(--muted)", fontWeight: 500 }}>User</th>
                  <th style={{ padding: "10px 12px", color: "var(--muted)", fontWeight: 500 }}>Tier</th>
                  <th style={{ padding: "10px 12px", color: "var(--muted)", fontWeight: 500 }}>Usage</th>
                  <th style={{ padding: "10px 12px", color: "var(--muted)", fontWeight: 500 }}>Status</th>
                  <th style={{ padding: "10px 12px", color: "var(--muted)", fontWeight: 500 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {keys.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>No API keys issued yet</td></tr>
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
                      <span style={{ color: k.enabled ? "var(--trading-up)" : "var(--trading-down)", fontSize: 11 }}>{k.enabled ? "Active" : "Revoked"}</span>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {k.enabled && <button className="btn-secondary" style={{ height: 28, fontSize: 11, padding: "0 12px" }} onClick={() => revokeKey(k.key_id)}>Revoke</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Providers ── */}
      {tab === "providers" && (
        <div>
          <div className="card-dark" style={{ padding: 20, marginBottom: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 14px" }}>Add Provider</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr 1fr 80px auto", gap: 10, alignItems: "end" }}>
              <div>
                <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>Provider</label>
                <select className="input-dark" value={newProvider.provider} onChange={e => setNewProvider({ ...newProvider, provider: e.target.value })}>
                  <option value="deepseek">DeepSeek</option>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="google">Google</option>
                  <option value="meta">Meta</option>
                  <option value="mistral">Mistral AI</option>
                  <option value="stability">Stability AI</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>Base URL</label>
                <input className="input-dark" placeholder="https://api.openai.com" value={newProvider.base_url} onChange={e => setNewProvider({ ...newProvider, base_url: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>Default Model</label>
                <input className="input-dark" placeholder="gpt-4o" value={newProvider.default_model} onChange={e => setNewProvider({ ...newProvider, default_model: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>API Key</label>
                <input className="input-dark" type="password" placeholder="sk-..." value={newProvider.api_key} onChange={e => setNewProvider({ ...newProvider, api_key: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>Cost/1M</label>
                <input className="input-dark" type="number" placeholder="0" value={newProvider.base_cost_per_1k || ""} onChange={e => setNewProvider({ ...newProvider, base_cost_per_1k: parseInt(e.target.value) || 0 })} />
              </div>
              <button className="btn-primary" onClick={addProvider} style={{ height: 40, whiteSpace: "nowrap" }}>Add</button>
            </div>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            {providers.map(p => {
              const isExpanded = expandedProvider === p.provider;
              return (
              <div key={p.provider} className="card-dark" style={{ padding: "16px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.enabled ? "var(--trading-up)" : "var(--muted)", flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, textTransform: "capitalize", cursor: "pointer" }} onClick={() => setExpandedProvider(isExpanded ? null : p.provider)}>
                        {p.provider} {isExpanded ? "▾" : "▸"}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "monospace", marginTop: 2 }}>{p.base_url}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>Model: <strong>{p.default_model}</strong></span>
                    {p.base_cost_per_1k > 0 && <span style={{ fontSize: 11, color: "var(--primary)" }}>Cost: {p.base_cost_per_1k} per 1K</span>}
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>{p.keys.length} key{p.keys.length !== 1 ? "s" : ""}</span>
                    <button className="btn-secondary" style={{ height: 28, fontSize: 11 }} onClick={() => toggleProvider(p)}>{p.enabled ? "Disable" : "Enable"}</button>
                    <button className="btn-secondary" style={{ height: 28, fontSize: 11, color: "var(--trading-down)" }} onClick={() => removeProvider(p.provider)}>Remove</button>
                  </div>
                </div>

                {/* Expanded: keys + model pricing */}
                {isExpanded && (
                  <div style={{ marginTop: 16, borderTop: "1px solid var(--hairline-on-dark)", paddingTop: 14 }}>
                    {/* Model pricing */}
                    {Object.keys(p.model_pricing || {}).length > 0 && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: "var(--muted)" }}>Model Pricing (yuan per 1M tokens)</div>
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                          {Object.entries(p.model_pricing).map(([model, price]) => (
                            <div key={model} style={{ padding: "6px 10px", borderRadius: 4, background: "rgba(255,255,255,0.03)", border: "1px solid var(--hairline-on-dark)", fontSize: 11 }}>
                              <span style={{ fontWeight: 600 }}>{model}</span>
                              <span style={{ color: "var(--muted)", marginLeft: 8 }}>in: {(price as {input_cost_per_1m: number}).input_cost_per_1m} out: {(price as {output_cost_per_1m: number}).output_cost_per_1m}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Keys */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>API Keys ({p.keys.length})</div>
                      <button className="btn-primary" style={{ height: 24, fontSize: 10, padding: "0 12px" }} onClick={() => { setShowAddKey(p.provider); setNewProviderKey({ key_value: "", usage_limit: 0, label: "" }); }}>+ Add Key</button>
                    </div>
                    {p.keys.length === 0 ? (
                      <div style={{ fontSize: 12, color: "var(--muted)", padding: "8px 0" }}>No keys configured — using legacy single key fallback.</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {p.keys.map(pk => (
                          <div key={pk.key_id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 4, background: "rgba(255,255,255,0.02)", border: "1px solid var(--hairline-on-dark)" }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: pk.enabled ? "var(--trading-up)" : "var(--muted)", flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: 12, fontWeight: 500 }}>{pk.label || "Unnamed"}</span>
                                <code style={{ fontSize: 10, color: "var(--muted)" }}>{pk.key_masked}</code>
                              </div>
                              {pk.usage_limit > 0 && (
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                                  <div style={{ flex: 1, maxWidth: 120, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                                    <div style={{ width: `${Math.min(pk.usage_pct, 100)}%`, height: "100%", background: pk.usage_pct > 80 ? "var(--trading-down)" : "var(--trading-up)" }} />
                                  </div>
                                  <span style={{ fontSize: 10, color: "var(--muted)" }}>{pk.usage_used.toLocaleString()} / {pk.usage_limit.toLocaleString()}</span>
                                </div>
                              )}
                              {pk.usage_limit === 0 && <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>Unlimited</div>}
                            </div>
                            <button className="btn-secondary" style={{ height: 22, fontSize: 10, padding: "0 8px", color: "var(--trading-down)", flexShrink: 0 }} onClick={() => removeProviderKey(pk.key_id)}>Remove</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )})}
          </div>

          {/* Add Key Modal */}
          {showAddKey && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300 }}>
              <div className="card-dark" style={{ padding: 24, width: 420, maxWidth: "90vw" }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px" }}>Add API Key — {showAddKey}</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>API Key Value</label>
                    <input className="input-dark" type="password" placeholder="sk-..." value={newProviderKey.key_value} onChange={e => setNewProviderKey({ ...newProviderKey, key_value: e.target.value })} style={{ width: "100%" }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>Usage Limit (0=unlimited)</label>
                      <input className="input-dark" type="number" placeholder="0" value={newProviderKey.usage_limit || ""} onChange={e => setNewProviderKey({ ...newProviderKey, usage_limit: parseInt(e.target.value) || 0 })} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>Label</label>
                      <input className="input-dark" placeholder="e.g. Key #2" value={newProviderKey.label} onChange={e => setNewProviderKey({ ...newProviderKey, label: e.target.value })} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
                    <button className="btn-secondary" onClick={() => setShowAddKey(null)} style={{ height: 34, fontSize: 13 }}>Cancel</button>
                    <button className="btn-primary" onClick={() => addProviderKey(showAddKey)} disabled={!newProviderKey.key_value} style={{ height: 34, fontSize: 13 }}>Add Key</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Logs ── */}
      {tab === "logs" && (
        <div>
          <div className="card-dark" style={{ overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--hairline-on-dark)", textAlign: "left" }}>
                  <th style={{ padding: "10px 12px", color: "var(--muted)", fontWeight: 500 }}>Time</th>
                  <th style={{ padding: "10px 12px", color: "var(--muted)", fontWeight: 500 }}>Provider</th>
                  <th style={{ padding: "10px 12px", color: "var(--muted)", fontWeight: 500 }}>Model</th>
                  <th style={{ padding: "10px 12px", color: "var(--muted)", fontWeight: 500 }}>Endpoint</th>
                  <th style={{ padding: "10px 12px", color: "var(--muted)", fontWeight: 500 }}>Tokens</th>
                  <th style={{ padding: "10px 12px", color: "var(--muted)", fontWeight: 500 }}>Latency</th>
                  <th style={{ padding: "10px 12px", color: "var(--muted)", fontWeight: 500 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>No requests yet — make some relay calls to see logs</td></tr>
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
              <button className="btn-secondary" disabled={logPage <= 1} onClick={() => { const p = logPage - 1; setLogPage(p); fetchLogs(p); }}>Previous</button>
              <span style={{ padding: "6px 12px", fontSize: 12, color: "var(--muted)" }}>Page {logPage} / {Math.ceil(logTotal / 30)}</span>
              <button className="btn-secondary" disabled={logPage >= Math.ceil(logTotal / 30)} onClick={() => { const p = logPage + 1; setLogPage(p); fetchLogs(p); }}>Next</button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
