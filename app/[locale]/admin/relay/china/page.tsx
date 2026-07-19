"use client";

import { useEffect, useState, useCallback } from "react";
import { ADMIN_KEY } from "@/shared/admin-key";

interface ChinaStatus {
  configured: boolean;
  api_key_prefix: string;
  key_id: string;
  tier: string;
  created_at: number;
  provider_count: number;
  provider_names: string[];
}

const RELAY_ENDPOINT = "https://api.aimsgateway.com/china";

export default function AdminChinaChannelPage() {
  const [status, setStatus] = useState<ChinaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [rotating, setRotating] = useState(false);
  const [newKey, setNewKey] = useState("");

  const headers = { "x-admin-key": ADMIN_KEY, "Content-Type": "application/json" };

  const fetchStatus = useCallback(() => {
    fetch(`/api/v2/admin/relay/china`, { headers })
      .then((r) => r.json())
      .then(setStatus)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const rotateKey = async () => {
    setRotating(true);
    setNewKey("");
    const r = await fetch(`/api/v2/admin/relay/china/rotate`, { method: "POST", headers });
    const d = await r.json();
    if (d.success) {
      setNewKey(d.api_key);
      fetchStatus();
    }
    setRotating(false);
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300, color: "var(--muted)", fontSize: 14 }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>AIMS China</h2>
      <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 28px", lineHeight: 1.5 }}>
        Dedicated relay channel for aimschina. Uses collaborator-level pricing on all providers.
      </p>

      {/* Status Card */}
      <div className="card-dark" style={{ padding: "24px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 4px" }}>Channel Status</h3>
            <span style={{
              display: "inline-block",
              padding: "2px 10px",
              borderRadius: 9999,
              fontSize: 11,
              fontWeight: 600,
              background: status?.configured ? "rgba(14,203,129,0.1)" : "rgba(239,68,68,0.1)",
              color: status?.configured ? "var(--trading-up)" : "var(--trading-down)",
              border: `1px solid ${status?.configured ? "rgba(14,203,129,0.25)" : "rgba(239,68,68,0.25)"}`,
            }}>
              {status?.configured ? "Active" : "Not Configured"}
            </span>
          </div>
          <button
            className="btn-primary"
            style={{ height: 34, fontSize: 12, padding: "0 16px" }}
            onClick={rotateKey}
            disabled={rotating}
          >
            {rotating ? "Generating..." : status?.configured ? "Rotate Key" : "Generate Key"}
          </button>
        </div>

        {status?.configured && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 32px" }}>
            <div>
              <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 2 }}>Key Prefix</div>
              <code style={{ fontSize: 12, fontFamily: "monospace" }}>{status.api_key_prefix}...</code>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 2 }}>Tier</div>
              <span style={{ fontSize: 12 }}>{status.tier}</span>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 2 }}>Created</div>
              <span style={{ fontSize: 12 }}>{status.created_at ? new Date(status.created_at * 1000).toLocaleDateString() : "-"}</span>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 2 }}>Available Providers</div>
              <span style={{ fontSize: 12 }}>{status.provider_count}</span>
            </div>
          </div>
        )}

        {newKey && (
          <div style={{
            marginTop: 16,
            padding: "16px",
            borderRadius: 8,
            background: "rgba(14,203,129,0.06)",
            border: "1px solid rgba(14,203,129,0.2)",
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--trading-up)", marginBottom: 8 }}>
              New API Key — copy it now, it won't be shown again
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
              <code style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: 6,
                background: "rgba(0,0,0,0.3)",
                fontSize: 11,
                fontFamily: "monospace",
                wordBreak: "break-all",
                color: "var(--trading-up)",
              }}>
                {newKey}
              </code>
              <button
                className="btn-primary"
                style={{ height: 34, fontSize: 11, padding: "0 14px", whiteSpace: "nowrap" }}
                onClick={() => { copyKey(newKey); }}
              >
                Copy
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Endpoint Card */}
      <div className="card-dark" style={{ padding: "24px", marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 8px" }}>Relay Endpoint</h3>
        <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 12px", lineHeight: 1.5 }}>
          Use this endpoint with the AIMS China API key. All providers are accessible through this single URL.
        </p>
        <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
          <code style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 6,
            background: "rgba(0,0,0,0.3)",
            fontSize: 12,
            fontFamily: "monospace",
            color: "var(--trading-up)",
          }}>
            {RELAY_ENDPOINT}
          </code>
          <button
            className="btn-secondary"
            style={{ height: 34, fontSize: 11, padding: "0 14px", whiteSpace: "nowrap" }}
            onClick={() => { navigator.clipboard.writeText(RELAY_ENDPOINT); }}
          >
            Copy
          </button>
        </div>
        <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 6, background: "rgba(0,0,0,0.2)", fontSize: 11, fontFamily: "monospace", color: "var(--muted)", lineHeight: 1.6 }}>
          {`curl ${RELAY_ENDPOINT}/chat/completions \\`}<br />
          {`  -H "Authorization: Bearer <china-key>" \\`}<br />
          {`  -H "Content-Type: application/json" \\`}<br />
          {`  -d '{"model":"<model>","messages":[{"role":"user","content":"Hello"}]}'`}
        </div>
      </div>

      {/* Provider List */}
      <div className="card-dark" style={{ padding: "24px" }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 12px" }}>
          Available Providers ({status?.provider_count || 0})
        </h3>
        {status?.provider_names && status.provider_names.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {status.provider_names.map((name) => (
              <span key={name} style={{
                padding: "4px 12px",
                borderRadius: 9999,
                background: "rgba(252,213,53,0.08)",
                border: "1px solid rgba(252,213,53,0.15)",
                fontSize: 12,
                fontFamily: "monospace",
              }}>
                {name}
              </span>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
            No providers configured. Add providers in the relay admin panel first.
          </p>
        )}
      </div>
    </div>
  );
}
