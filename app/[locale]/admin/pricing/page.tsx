"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface PriceRule {
  id: string;
  modelName: string;
  provider: string;
  basePrice: number;
  markupPct: number;
  finalPrice: number;
  unit: "per_call" | "per_10k_tokens";
  enabled: boolean;
  updatedAt: string;
}

function loadPriceRules(): PriceRule[] {
  if (typeof window === "undefined") return [];
  const raw = sessionStorage.getItem("aims_admin_pricing");
  if (raw) return JSON.parse(raw);
  const defaults: PriceRule[] = [
    { id: "rp1", modelName: "gpt-4o", provider: "OpenAI", basePrice: 0.0100, markupPct: 15, finalPrice: 0.0115, unit: "per_10k_tokens", enabled: true, updatedAt: "2026-07-10" },
    { id: "rp2", modelName: "claude-3-opus", provider: "Anthropic", basePrice: 0.0150, markupPct: 12, finalPrice: 0.0168, unit: "per_10k_tokens", enabled: true, updatedAt: "2026-07-09" },
    { id: "rp3", modelName: "deepseek-r1", provider: "DeepSeek", basePrice: 0.0025, markupPct: 20, finalPrice: 0.0030, unit: "per_10k_tokens", enabled: true, updatedAt: "2026-07-08" },
    { id: "rp4", modelName: "gemini-1.5-pro", provider: "Google", basePrice: 0.0035, markupPct: 18, finalPrice: 0.0041, unit: "per_10k_tokens", enabled: true, updatedAt: "2026-07-07" },
    { id: "rp5", modelName: "llama-3.1-70b", provider: "Meta", basePrice: 0.0042, markupPct: 10, finalPrice: 0.0046, unit: "per_call", enabled: true, updatedAt: "2026-07-06" },
    { id: "rp6", modelName: "sdxl-1.0", provider: "Stability AI", basePrice: 0.0100, markupPct: 5, finalPrice: 0.0105, unit: "per_call", enabled: true, updatedAt: "2026-07-05" },
    { id: "rp7", modelName: "whisper-large-v3", provider: "OpenAI", basePrice: 0.0008, markupPct: 25, finalPrice: 0.0010, unit: "per_call", enabled: true, updatedAt: "2026-07-04" },
    { id: "rp8", modelName: "mixtral-8x7b", provider: "Mistral AI", basePrice: 0.0035, markupPct: 15, finalPrice: 0.0040, unit: "per_10k_tokens", enabled: false, updatedAt: "2026-07-03" },
  ];
  sessionStorage.setItem("aims_admin_pricing", JSON.stringify(defaults));
  return defaults;
}

export default function PricingPage() {
  const t = useTranslations("AdminPage");
  const [rules, setRules] = useState<PriceRule[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMarkup, setEditMarkup] = useState(15);

  useEffect(() => { setRules(loadPriceRules()); }, []);

  const persist = (r: PriceRule[]) => { sessionStorage.setItem("aims_admin_pricing", JSON.stringify(r)); setRules(r); };

  const startEdit = (rule: PriceRule) => {
    setEditingId(rule.id);
    setEditMarkup(rule.markupPct);
  };

  const saveEdit = () => {
    if (!editingId) return;
    persist(rules.map((r) => {
      if (r.id !== editingId) return r;
      const finalPrice = r.basePrice * (1 + editMarkup / 100);
      return { ...r, markupPct: editMarkup, finalPrice: Math.round(finalPrice * 10000) / 10000, updatedAt: new Date().toISOString().slice(0, 10) };
    }));
    setEditingId(null);
  };

  const toggleRule = (id: string) => {
    persist(rules.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const bulkAdjustAll = (pct: number) => {
    persist(rules.map((r) => {
      const newMarkup = Math.max(0, r.markupPct + pct);
      return { ...r, markupPct: newMarkup, finalPrice: Math.round(r.basePrice * (1 + newMarkup / 100) * 10000) / 10000, updatedAt: new Date().toISOString().slice(0, 10) };
    }));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 4px" }}>{t("pricing")}</h1>
          <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>{t("pricingDesc")}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-secondary" style={{ height: 36, fontSize: 12 }} onClick={() => bulkAdjustAll(5)}>
            +5% {t("allMarkup")}
          </button>
          <button className="btn-secondary" style={{ height: 36, fontSize: 12 }} onClick={() => bulkAdjustAll(-5)}>
            -5% {t("allMarkup")}
          </button>
          <button className="btn-secondary" style={{ height: 36, fontSize: 12 }} onClick={() => bulkAdjustAll(-100)}>
            {t("resetAllMarkup")}
          </button>
        </div>
      </div>

      {/* Revenue summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: t("avgMarkup"), value: (rules.reduce((s, r) => s + r.markupPct, 0) / (rules.length || 1)).toFixed(1) + "%" },
          { label: t("highestMarkup"), value: Math.max(...rules.map(r => r.markupPct)) + "%" },
          { label: t("lowestMarkup"), value: Math.min(...rules.map(r => r.markupPct)) + "%" },
          { label: t("activeRules"), value: rules.filter(r => r.enabled).length + "/" + rules.length },
        ].map((c) => (
          <div key={c.label} className="card-dark" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "monospace" }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Price rules table */}
      <div className="card-dark" style={{ overflow: "auto" }}>
        <table className="table-dark">
          <thead>
            <tr>
              <th>{t("model")}</th>
              <th>{t("provider")}</th>
              <th>{t("basePrice")}</th>
              <th>{t("markup")}</th>
              <th>{t("finalPrice")}</th>
              <th>{t("unit")}</th>
              <th>{t("status")}</th>
              <th>{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.id} style={{ opacity: r.enabled ? 1 : 0.5 }}>
                <td style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 600 }}>{r.modelName}</td>
                <td>{r.provider}</td>
                <td style={{ fontFamily: "monospace", fontSize: 13 }}>${r.basePrice.toFixed(4)}</td>
                <td>
                  {editingId === r.id ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <input className="input-dark" type="number" value={editMarkup}
                        onChange={(e) => setEditMarkup(parseInt(e.target.value) || 0)}
                        style={{ width: 60, height: 28, fontSize: 12, textAlign: "center" }} />
                      <span style={{ fontSize: 12 }}>%</span>
                      <button className="btn-primary" style={{ height: 26, fontSize: 10, padding: "0 6px" }} onClick={saveEdit}>✓</button>
                      <button className="btn-secondary" style={{ height: 26, fontSize: 10, padding: "0 6px" }} onClick={() => setEditingId(null)}>✕</button>
                    </div>
                  ) : (
                    <span style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 600, color: "var(--primary)", cursor: "pointer" }}
                      onClick={() => startEdit(r)}>
                      {r.markupPct}% <span style={{ fontSize: 10, color: "var(--muted)" }}>({t("clickToEdit")})</span>
                    </span>
                  )}
                </td>
                <td style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, color: "var(--trading-up)" }}>
                  ${r.finalPrice.toFixed(4)}
                </td>
                <td><span style={{ fontSize: 11, color: "var(--muted)" }}>{r.unit === "per_call" ? t("perCallUnit") : t("per10kTokens")}</span></td>
                <td>
                  <button className="btn-secondary" style={{ height: 26, fontSize: 11, padding: "0 8px" }}
                    onClick={() => toggleRule(r.id)}>
                    {r.enabled ? t("enabled") : t("disabled")}
                  </button>
                </td>
                <td style={{ fontSize: 11, color: "var(--muted)" }}>{r.updatedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
