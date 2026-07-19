"use client";

import { useEffect, useState, Suspense } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";

interface TrialState {
  trialKey: string;
  endpoint: string;
  quotaRemaining: number;
  expiresAt: string;
}

interface DeliveryState {
  downloadUrl: string;
  detail: string;
  models: { provider: string; model: string; purpose: string }[];
  apis: { name: string; provider: string; endpoint: string; purpose: string; key_env_var: string }[];
  workflow: string;
  txHash: string;
}

interface SellLinkInfo {
  linkId: string;
  skillId: string;
  skillName: string;
  buyoutPrice: number;
  trialQuota: number;
  trialTTL: number;
  sellerWallet: string;
}

export default function BuyPage() {
  const t = useTranslations("BuyPage");
  const common = useTranslations("Common");

  return (
    <Suspense fallback={<div style={{ padding: 80, textAlign: "center", color: "var(--muted)" }}>{common("loading")}</div>}>
      <BuyContent t={t} common={common} />
    </Suspense>
  );
}

function BuyContent({ t, common }: { t: ReturnType<typeof useTranslations<"BuyPage">>; common: ReturnType<typeof useTranslations<"Common">> }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const linkId = searchParams.get("link") || "";
  const paramSkill = searchParams.get("skill") || "";
  const paramName = searchParams.get("name") || "";
  const paramPrice = parseFloat(searchParams.get("price") || "0");
  const paramQuota = parseInt(searchParams.get("quota") || "50");
  const paramTTL = parseInt(searchParams.get("ttl") || "72");

  const [linkInfo, setLinkInfo] = useState<SellLinkInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [trial, setTrial] = useState<TrialState | null>(null);
  const [trialLoading, setTrialLoading] = useState(false);
  const [trialKeyCopied, setTrialKeyCopied] = useState(false);

  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerWallet, setBuyerWallet] = useState("");
  const [txHash, setTxHash] = useState("");
  const [purchasing, setPurchasing] = useState(false);

  const [delivery, setDelivery] = useState<DeliveryState | null>(null);

  useEffect(() => {
    // Scenario A: Backend sell link (?link=buyout_xxx)
    if (linkId) {
      fetch(`/api/v2/buyout/info/${linkId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data && data.link_id) {
            setLinkInfo({
              linkId: data.link_id,
              skillId: data.skill_id,
              skillName: data.skill_name || data.skill_id,
              buyoutPrice: data.buyout_price || 0,
              trialQuota: data.trial_quota || 50,
              trialTTL: data.trial_ttl_hours || 72,
              sellerWallet: data.seller_wallet || "",
            });
          } else {
            setError(t("invalidLink"));
          }
        })
        .catch(() => setError(t("invalidLink")))
        .finally(() => setLoading(false));
      return;
    }

    // Scenario B: Query-param link from alliance page generator
    if (paramSkill) {
      setLinkInfo({
        linkId: "",
        skillId: paramSkill,
        skillName: paramName || paramSkill,
        buyoutPrice: paramPrice,
        trialQuota: paramQuota,
        trialTTL: paramTTL,
        sellerWallet: "",
      });
      setLoading(false);
      return;
    }

    setError(t("noLinkId"));
    setLoading(false);
  }, [linkId, paramSkill, paramName, paramPrice, paramQuota, paramTTL, t]);

  const handleRequestTrial = async () => {
    setTrialLoading(true);
    try {
      const wallet = buyerWallet || "0x" + "0".repeat(40);
      const resp = await fetch("/api/v2/buyout/trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sell_link_id: linkInfo?.linkId || "query-param",
          buyer_wallet: wallet,
        }),
      });
      const data = await resp.json();
      if (data && data.trial_key) {
        setTrial({
          trialKey: data.trial_key,
          endpoint: data.endpoint || "https://api.aimsgateway.com/api/v2/relay/invoke",
          quotaRemaining: data.quota_remaining || linkInfo?.trialQuota || 50,
          expiresAt: data.expires_at || "",
        });
      }
    } catch {
      // Demo fallback
      setTrial({
        trialKey: "aims_trial_" + Math.random().toString(36).slice(2, 18),
        endpoint: "https://api.aimsgateway.com/api/v2/relay/invoke",
        quotaRemaining: linkInfo?.trialQuota || 50,
        expiresAt: new Date(Date.now() + (linkInfo?.trialTTL || 72) * 3600000).toISOString(),
      });
    } finally {
      setTrialLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!buyerEmail || !buyerWallet || !txHash) return;
    setPurchasing(true);

    try {
      const resp = await fetch("/api/v2/buyout/deliver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sell_link_id: linkInfo?.linkId || "query-param",
          buyer_wallet: buyerWallet,
          buyer_email: buyerEmail,
          tx_hash: txHash,
        }),
      });
      const data = await resp.json();
      if (data && data.success) {
        const detail = data.detail ? JSON.parse(data.detail) : null;
        setDelivery({
          downloadUrl: data.download_url || "",
          detail: data.detail || "",
          models: detail?.dependencies?.models || [],
          apis: detail?.dependencies?.apis || [],
          workflow: detail?.dependencies?.workflow || "",
          txHash: txHash,
        });
      }
    } catch {
      // Demo fallback
      setDelivery({
        downloadUrl: "/api/v2/buyout/download/" + (linkInfo?.linkId || "demo"),
        detail: "",
        models: [
          { provider: "anthropic", model: "claude-4.5", purpose: "Comprehensive analysis and report generation" },
        ],
        apis: [
          { name: "Google Custom Search", provider: "google", endpoint: "https://www.googleapis.com/customsearch/v1", purpose: "Public information retrieval", key_env_var: "GOOGLE_API_KEY" },
          { name: "Hunter.io", provider: "hunter", endpoint: "", purpose: "Corporate email verification", key_env_var: "HUNTER_API_KEY" },
        ],
        workflow: "Step 1: Google Search → Step 2: Hunter verification → Step 3: Claude 4.5 report synthesis",
        txHash: txHash,
      });
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 80, textAlign: "center", color: "var(--muted)" }}>{common("loading")}</div>;
  }

  if (error) {
    return (
      <main style={{ maxWidth: 600, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 8px" }}>{t("errorTitle")}</h1>
        <p style={{ color: "var(--muted)", fontSize: 14, margin: "0 0 24px" }}>{error}</p>
        <button className="btn-primary" onClick={() => router.push("/marketplace")}>{t("browseMarketplace")}</button>
      </main>
    );
  }

  // ── Delivery success view ────────────────────────────────────────────
  if (delivery) {
    return (
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 8px", color: "var(--trading-up)" }}>{t("purchaseSuccess")}</h1>
          <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>{t("purchaseSuccessDesc", { skill: linkInfo?.skillName || "" })}</p>
        </div>

        <div className="card-dark" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px" }}>{t("deliveryDetails")}</h2>

          {delivery.models.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--primary)", marginBottom: 8 }}>{t("modelsUsed")}</div>
              {delivery.models.map((m, i) => (
                <div key={i} style={{ padding: "8px 12px", borderRadius: 6, background: "var(--canvas-dark)", marginBottom: 6, fontSize: 13 }}>
                  <span style={{ fontWeight: 600 }}>{m.provider}</span> / {m.model}
                  {m.purpose && <span style={{ color: "var(--muted)", marginLeft: 8 }}>— {m.purpose}</span>}
                </div>
              ))}
            </div>
          )}

          {delivery.apis.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--primary)", marginBottom: 8 }}>{t("apisUsed")}</div>
              {delivery.apis.map((a, i) => (
                <div key={i} style={{ padding: "8px 12px", borderRadius: 6, background: "var(--canvas-dark)", marginBottom: 6, fontSize: 13 }}>
                  <span style={{ fontWeight: 600 }}>{a.name}</span> ({a.provider})
                  {a.purpose && <span style={{ color: "var(--muted)", marginLeft: 8 }}>— {a.purpose}</span>}
                  {a.key_env_var && <code style={{ display: "block", marginTop: 4, fontSize: 11 }}>export {a.key_env_var}=&lt;your_key&gt;</code>}
                  {a.endpoint && <code style={{ display: "block", marginTop: 2, fontSize: 11 }}>{a.endpoint}</code>}
                </div>
              ))}
            </div>
          )}

          {delivery.workflow && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--primary)", marginBottom: 8 }}>{t("workflow")}</div>
              <pre style={{ padding: 12, borderRadius: 6, background: "var(--canvas-dark)", fontSize: 12, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {delivery.workflow}
              </pre>
            </div>
          )}

          <div style={{ padding: 10, borderRadius: 6, background: "rgba(0,229,153,0.06)", border: "1px solid rgba(0,229,153,0.12)", marginBottom: 16 }}>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>TX: </span>
            <code style={{ fontSize: 11, fontFamily: "monospace", wordBreak: "break-all" }}>{delivery.txHash}</code>
          </div>

          {delivery.downloadUrl && (
            <a href={delivery.downloadUrl} className="btn-primary" style={{ display: "block", textAlign: "center", textDecoration: "none", height: 44, lineHeight: "44px", fontSize: 14 }}>
              {t("downloadManifest")}
            </a>
          )}
        </div>
      </main>
    );
  }

  // ── Main buyout view ─────────────────────────────────────────────────
  return (
    <main style={{ maxWidth: 680, margin: "0 auto", padding: "40px 24px" }}>
      <button className="text-link" onClick={() => router.push("/marketplace")} style={{ marginBottom: 24, display: "inline-block" }}>
        ← {t("backToMarketplace")}
      </button>

      <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 4px" }}>{t("title")}</h1>
      <p style={{ color: "var(--muted)", fontSize: 14, margin: "0 0 32px" }}>
        {linkInfo?.sellerWallet ? t("subtitle", { seller: linkInfo.sellerWallet.slice(0, 10) + "..." }) : ""}
      </p>

      {/* Skill info card */}
      <div className="card-dark" style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("skill")}</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{linkInfo?.skillName}</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div style={{ padding: 12, borderRadius: 8, background: "var(--canvas-dark)", textAlign: "center" }}>
            <div style={{ fontFamily: "monospace", fontSize: 24, fontWeight: 700, color: "var(--primary)" }}>
              {linkInfo?.buyoutPrice || 0} USDT
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{t("buyoutPrice")}</div>
          </div>
          <div style={{ padding: 12, borderRadius: 8, background: "var(--canvas-dark)", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{linkInfo?.trialQuota || 50}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{t("trialQuota")}</div>
          </div>
          <div style={{ padding: 12, borderRadius: 8, background: "var(--canvas-dark)", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{linkInfo?.trialTTL || 72}h</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{t("trialTTL")}</div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 8, textAlign: "center" }}>
          {t("oneTimePayment")}
        </div>
      </div>

      {/* Trial section */}
      <div className="card-dark" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 4px" }}>{t("trialSection")}</h2>
        <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 16px", lineHeight: 1.5 }}>{t("trialDesc")}</p>

        {!trial ? (
          <button
            className="btn-primary"
            style={{ width: "100%", height: 44, fontSize: 14 }}
            disabled={trialLoading}
            onClick={handleRequestTrial}
          >
            {trialLoading ? common("loading") : t("requestTrialKey")}
          </button>
        ) : (
          <div>
            <div style={{ padding: 12, borderRadius: 8, background: "rgba(0,229,153,0.06)", border: "1px solid rgba(0,229,153,0.15)", marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>{t("trialEndpoint")}</div>
              <code style={{ fontSize: 12, fontFamily: "monospace", color: "var(--trading-up)", wordBreak: "break-all" }}>
                {trial.endpoint}
              </code>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>{t("trialEndpointDesc")}</div>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1, padding: "8px 12px", borderRadius: 6, background: "var(--canvas-dark)" }}>
                <code style={{ fontSize: 10, fontFamily: "monospace", wordBreak: "break-all", color: "var(--primary)" }}>
                  {trial.trialKey}
                </code>
              </div>
              <button
                className="btn-secondary"
                style={{ fontSize: 12, whiteSpace: "nowrap" }}
                onClick={() => { navigator.clipboard.writeText(trial.trialKey); setTrialKeyCopied(true); setTimeout(() => setTrialKeyCopied(false), 2000); }}
              >
                {trialKeyCopied ? t("trialKeyCopied") : t("copyTrialKey")}
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--muted)" }}>
              <span>{trial.quotaRemaining} {t("quotaRemaining")}</span>
              <span>{t("expiresAt")}: {trial.expiresAt ? new Date(trial.expiresAt).toLocaleString() : "--"}</span>
            </div>
          </div>
        )}
      </div>

      {/* Purchase section */}
      <div className="card-dark">
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 4px" }}>{t("purchaseSection")}</h2>
        <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 16px", lineHeight: 1.5 }}>{t("purchaseDesc")}</p>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>{t("buyerEmailLabel")}</label>
          <input
            className="input-dark"
            type="email"
            placeholder={t("buyerEmailHint")}
            value={buyerEmail}
            onChange={(e) => setBuyerEmail(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>{t("walletLabel")}</label>
          <input
            className="input-dark"
            type="text"
            placeholder="0x..."
            value={buyerWallet}
            onChange={(e) => setBuyerWallet(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box", fontFamily: "monospace" }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>{t("txHashLabel")}</label>
          <input
            className="input-dark"
            type="text"
            placeholder={t("txHashHint")}
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box", fontFamily: "monospace" }}
          />
        </div>

        <button
          className="btn-primary"
          style={{ width: "100%", height: 48, fontSize: 15 }}
          disabled={purchasing || !buyerEmail || !buyerWallet || !txHash}
          onClick={handlePurchase}
        >
          {purchasing ? t("purchasing") : t("confirmPurchase", { price: linkInfo?.buyoutPrice || 0 })}
        </button>
      </div>
    </main>
  );
}
