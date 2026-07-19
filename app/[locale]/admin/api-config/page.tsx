"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface ApiProvider {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  provider: string;
  enabled: boolean;
  weight: number;
  createdAt: string;
  status: "online" | "offline" | "error";
}

function loadProviders(): ApiProvider[] {
  if (typeof window === "undefined") return [];
  const raw = sessionStorage.getItem("aims_admin_providers");
  if (raw) return JSON.parse(raw);
  const defaults: ApiProvider[] = [
    { id: "p1", name: "OpenAI GPT-4o", baseUrl: "https://api.openai.com/v1", apiKey: "sk-***", model: "gpt-4o", provider: "OpenAI", enabled: true, weight: 10, createdAt: "2026-07-01", status: "online" },
    { id: "p2", name: "Anthropic Claude 3", baseUrl: "https://api.anthropic.com/v1", apiKey: "sk-ant-***", model: "claude-3-opus", provider: "Anthropic", enabled: true, weight: 8, createdAt: "2026-07-02", status: "online" },
    { id: "p3", name: "DeepSeek R1", baseUrl: "https://api.deepseek.com/v1", apiKey: "sk-ds-***", model: "deepseek-r1", provider: "DeepSeek", enabled: true, weight: 7, createdAt: "2026-07-03", status: "online" },
    { id: "p4", name: "Google Gemini", baseUrl: "https://generativelanguage.googleapis.com/v1", apiKey: "AIza***", model: "gemini-1.5-pro", provider: "Google", enabled: false, weight: 5, createdAt: "2026-07-05", status: "offline" },
  ];
  sessionStorage.setItem("aims_admin_providers", JSON.stringify(defaults));
  return defaults;
}

function saveProviders(p: ApiProvider[]) {
  sessionStorage.setItem("aims_admin_providers", JSON.stringify(p));
}

export default function ApiConfigPage() {
  const t = useTranslations("AdminPage");
  const [providers, setProviders] = useState<ApiProvider[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", baseUrl: "", apiKey: "", model: "", provider: "", weight: 5 });

  useEffect(() => { setProviders(loadProviders()); }, []);

  const persist = (p: ApiProvider[]) => { saveProviders(p); setProviders(p); };

  const toggleProvider = (id: string) => {
    persist(providers.map((p) => p.id === id ? { ...p, enabled: !p.enabled, status: p.enabled ? ("offline" as const) : ("online" as const) } : p));
  };

  const deleteProvider = (id: string) => {
    persist(providers.filter((p) => p.id !== id));
  };

  const handleSave = () => {
    if (!form.name || !form.baseUrl) return;
    if (editingId) {
      persist(providers.map((p) => p.id === editingId ? { ...p, ...form } : p));
    } else {
      const newP: ApiProvider = {
        id: "p" + Date.now(),
        ...form,
        enabled: true,
        createdAt: new Date().toISOString().slice(0, 10),
        status: "online",
      };
      persist([...providers, newP]);
    }
    setShowAdd(false);
    setEditingId(null);
    setForm({ name: "", baseUrl: "", apiKey: "", model: "", provider: "", weight: 5 });
  };

  const editProvider = (p: ApiProvider) => {
    setEditingId(p.id);
    setForm({ name: p.name, baseUrl: p.baseUrl, apiKey: p.apiKey, model: p.model, provider: p.provider, weight: p.weight });
    setShowAdd(true);
  };

  const statusDot = (s: string) => {
    const color = s === "online" ? "var(--trading-up)" : s === "error" ? "var(--trading-down)" : "var(--muted)";
    return <span style={{ width: 8, height: 8, borderRadius: 4, background: color, display: "inline-block", marginRight: 6 }}></span>;
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 4px" }}>{t("apiConfig")}</h1>
          <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>{t("apiConfigDesc")}</p>
        </div>
        <button className="btn-primary" style={{ height: 40, padding: "0 20px" }}
          onClick={() => { setEditingId(null); setForm({ name: "", baseUrl: "", apiKey: "", model: "", provider: "", weight: 5 }); setShowAdd(true); }}>
          + {t("addProvider")}
        </button>
      </div>

      {/* Add/Edit modal */}
      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
          <div className="card-dark" style={{ width: 480, padding: 28 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 20px" }}>{editingId ? t("editProvider") : t("addProvider")}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {(["name", "provider", "baseUrl", "apiKey", "model"] as const).map((f) => (
                <div key={f}>
                  <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>{t(f)}</label>
                  <input className="input-dark" value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                    placeholder={f === "apiKey" ? "sk-..." : f === "baseUrl" ? "https://api.example.com/v1" : ""} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>{t("weight")}</label>
                <input className="input-dark" type="number" min={1} max={100} value={form.weight}
                  onChange={(e) => setForm({ ...form, weight: parseInt(e.target.value) || 1 })} />
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{t("weightHint")}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 20, justifyContent: "flex-end" }}>
              <button className="btn-secondary" onClick={() => { setShowAdd(false); setEditingId(null); }}>{t("cancel")}</button>
              <button className="btn-primary" onClick={handleSave}>{editingId ? t("save") : t("addProvider")}</button>
            </div>
          </div>
        </div>
      )}

      {/* Provider table */}
      <div className="card-dark">
        <table className="table-dark">
          <thead>
            <tr>
              <th>{t("status")}</th>
              <th>{t("name")}</th>
              <th>{t("provider")}</th>
              <th>{t("model")}</th>
              <th>{t("baseUrl")}</th>
              <th>{t("weight")}</th>
              <th>{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {providers.map((p) => (
              <tr key={p.id}>
                <td>
                  <span style={{ fontSize: 12, display: "flex", alignItems: "center" }}>
                    {statusDot(p.status)} {p.status === "online" ? t("online") : t("offline")}
                  </span>
                </td>
                <td style={{ fontWeight: 600 }}>{p.name}</td>
                <td>{p.provider}</td>
                <td style={{ fontFamily: "monospace", fontSize: 12 }}>{p.model}</td>
                <td style={{ fontFamily: "monospace", fontSize: 11, color: "var(--muted)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.baseUrl}</td>
                <td style={{ fontFamily: "monospace", fontSize: 13 }}>{p.weight}</td>
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn-secondary" style={{ height: 28, fontSize: 11, padding: "0 8px" }}
                      onClick={() => toggleProvider(p.id)}>
                      {p.enabled ? t("disable") : t("enable")}
                    </button>
                    <button className="btn-secondary" style={{ height: 28, fontSize: 11, padding: "0 8px" }}
                      onClick={() => editProvider(p)}>{t("edit")}</button>
                    <button className="btn-secondary" style={{ height: 28, fontSize: 11, padding: "0 8px", color: "var(--trading-down)" }}
                      onClick={() => deleteProvider(p.id)}>{t("delete")}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
