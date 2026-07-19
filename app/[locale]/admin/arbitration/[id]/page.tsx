"use client";

import { useRouter } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";

import { ADMIN_KEY } from "@/shared/admin-key";


interface JudgeResult {
  analysis_id: string; similarity_score: number; technical_overlap: number;
  risk_level: string; license_issues: string[]; matched_elements: string[];
  summary: string; recommendation: string; model_used: string; latency_ms: number;
}

export default function ArbitrationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const t = useTranslations('ArbitrationDetailPage');
  const tc = useTranslations('Common');
  const caseId = params?.id as string;
  const [showConfirmSlash, setShowConfirmSlash] = useState(false);
  const [slashed, setSlashed] = useState(false);
  const [judging, setJudging] = useState(false);
  const [judgeResult, setJudgeResult] = useState<JudgeResult | null>(null);
  const [judgeError, setJudgeError] = useState("");

  // Counter-appeal states
  const [appealSubmitted, setAppealSubmitted] = useState(false);
  const [appealEvidence, setAppealEvidence] = useState("");
  const [appealDeadline] = useState(() => Date.now() + 48 * 3600_000); // 48h from page load
  const [appealHoursLeft, setAppealHoursLeft] = useState(48);

  const runJudge = async () => {
    setJudging(true);
    setJudgeError("");
    try {
      const resp = await fetch(`/api/v2/judge/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": ADMIN_KEY },
        body: JSON.stringify({
          skill_a_name: "Original Model: LLaMA 3.1 70B Inference",
          skill_a_desc: "High-performance LLaMA 3.1 70B parameter model for text generation and chat. Supports streaming, function calling, and JSON mode. Hosted on 8×A100 GPUs with PyTorch and CUDA acceleration.",
          skill_b_name: "Contested Skill (Case " + caseId + ")",
          skill_b_desc: "AI model service offering text generation and chat capabilities with similar API surface. Claims to use optimized transformer architecture with GPU acceleration.",
          skill_a_repo: "github.com/meta-llama/llama-models",
          skill_b_repo: "github.com/unknown-dev/similar-model",
        }),
      });
      const data = await resp.json();
      if (resp.ok) setJudgeResult(data);
      else setJudgeError(data.detail || "Judge analysis failed");
    } catch {
      setJudgeError("Cannot reach judge service");
    } finally {
      setJudging(false);
    }
  };

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 24px" }}>
      <button className="text-link" onClick={() => router.push("/admin/arbitration")} style={{ marginBottom: 24, display: "inline-block" }}>
        {t('backToBoard')}
      </button>

      {/* Case header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, margin: "0 0 4px" }}>{t('caseTitle', { id: caseId })}</h1>
          <p style={{ fontFamily: "monospace", fontSize: 14, color: "var(--muted)", margin: 0 }}>Order: 0xabcd...ef01</p>
        </div>
        <span className={slashed ? "badge badge-green" : "badge badge-red"} style={{ fontSize: 14, padding: "4px 16px" }}>
          {slashed ? "ARBITRATED" : "FROZEN"}
        </span>
      </div>

      {/* Party cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        <div className="card-dark">
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 12px" }}>{t('plaintiff')}</h3>
          <div style={{ fontFamily: "monospace", fontSize: 14, marginBottom: 8 }}>0x90F79bf6EB2c4f870365E785982E1f101E93b906</div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>Complaint Fee: 5 USDT paid</div>
        </div>
        <div className="card-dark" style={{ border: appealSubmitted ? "1px solid rgba(59,130,246,0.3)" : undefined }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 12px", color: "var(--trading-down)" }}>{t('defendant')}</h3>
          <div style={{ fontFamily: "monospace", fontSize: 14, marginBottom: 8, color: "var(--trading-down)" }}>0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC</div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>Status: FROZEN · Blacklisted: {slashed ? "Yes" : "No"}</div>
          {appealSubmitted && (
            <div style={{ fontSize: 11, padding: "4px 10px", borderRadius: 4, background: "rgba(59,130,246,0.12)", color: "#3b82f6", fontWeight: 600, display: "inline-block" }}>
              {t('appealPending')} · {appealHoursLeft}h remaining
            </div>
          )}
        </div>
      </div>

      {/* On-chain data */}
      <div className="card-dark" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 16px" }}>{t('onChainData')}</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { label: t('escrowAmount'), value: "100 USDT" },
            { label: t('treasuryFee'), value: "1 USDT" },
            { label: t('frozenAtBlock'), value: "12,456,789" },
            { label: t('contractAddress'), value: "0x..." },
          ].map((d) => (
            <div key={d.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--hairline-on-dark)" }}>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>{d.label}</span>
              <span style={{ fontSize: 14, fontFamily: "monospace" }}>{d.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* DeepSeek AI Judge */}
      <div className="card-dark" style={{ marginBottom: 24, border: "1px solid rgba(59,130,246,0.3)" }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 12px", color: "#3b82f6" }}>{t('auditTitle')} — DeepSeek AI Judge</h3>

        {!judgeResult && !judging && !judgeError && (
          <div style={{ textAlign: "center", padding: 20 }}>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 14px" }}>
              Start the AI infringement analysis to compare the contested skill against the original.
            </p>
            <button className="btn-primary" onClick={runJudge} style={{ padding: "10px 28px" }}>
              Run AI Analysis
            </button>
          </div>
        )}

        {judging && (
          <div style={{ textAlign: "center", padding: 24 }}>
            <div style={{ fontSize: 14, color: "var(--muted)", marginBottom: 8 }}>Analyzing with DeepSeek...</div>
            <div style={{ width: "100%", height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <div style={{ width: "100%", height: "100%", background: "var(--primary)", animation: "pulse 1.5s infinite" }} />
            </div>
          </div>
        )}

        {judgeError && (
          <div style={{ padding: 16, textAlign: "center", background: "rgba(246,70,93,0.06)", borderRadius: 8 }}>
            <div style={{ color: "var(--trading-down)", fontSize: 13, marginBottom: 8 }}>{judgeError}</div>
            <button className="btn-secondary" onClick={runJudge} style={{ height: 32, fontSize: 12 }}>Retry</button>
          </div>
        )}

        {judgeResult && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[
                { label: t('similarityScore'), value: `${judgeResult.similarity_score.toFixed(1)}%`, color: judgeResult.similarity_score > 70 ? "var(--trading-down)" : judgeResult.similarity_score > 40 ? "var(--primary)" : "var(--trading-up)" },
                { label: "Technical Overlap", value: `${judgeResult.technical_overlap.toFixed(1)}%`, color: judgeResult.technical_overlap > 70 ? "var(--trading-down)" : "var(--body)" },
                { label: "Risk Level", value: judgeResult.risk_level, color: judgeResult.risk_level === "CRITICAL" || judgeResult.risk_level === "HIGH" ? "var(--trading-down)" : "var(--trading-up)" },
                { label: "Model", value: judgeResult.model_used, color: "inherit" },
              ].map((d) => (
                <div key={d.label} style={{ padding: "10px 14px", borderRadius: 6, background: "rgba(59,130,246,0.06)" }}>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>{d.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: d.color }}>{d.value}</div>
                </div>
              ))}
            </div>

            {judgeResult.matched_elements.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Matched Elements</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {judgeResult.matched_elements.map((e, i) => (
                    <span key={i} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 4, background: "rgba(246,70,93,0.1)", color: "var(--trading-down)" }}>{e}</span>
                  ))}
                </div>
              </div>
            )}

            {judgeResult.license_issues.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>License Issues</div>
                {judgeResult.license_issues.map((li, i) => (
                  <div key={i} style={{ fontSize: 12, padding: "4px 0", color: "var(--body)" }}>• {li}</div>
                ))}
              </div>
            )}

            <div style={{ padding: 12, borderRadius: 6, background: "rgba(59,130,246,0.06)", marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Summary</div>
              <div style={{ fontSize: 13, lineHeight: 1.6 }}>{judgeResult.summary}</div>
            </div>

            <div style={{ padding: 12, borderRadius: 6, background: "rgba(252,213,53,0.06)", marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Recommendation</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--primary)" }}>{judgeResult.recommendation}</div>
            </div>

            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <button className="btn-secondary" onClick={runJudge} style={{ height: 32, fontSize: 12 }} disabled={judging}>
                {judging ? "Analyzing..." : "Re-run Analysis"}
              </button>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>
                Latency: {judgeResult.latency_ms}ms · ID: {judgeResult.analysis_id}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Worker Counter-Appeal ── */}
      {!appealSubmitted && !slashed && (
        <div className="card-dark" style={{ marginBottom: 24, border: "1px solid rgba(59,130,246,0.25)" }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px", color: "#3b82f6" }}>🛡 {t('counterAppeal')}</h3>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 16px", lineHeight: 1.6 }}>
            {t('counterAppealDesc')}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <textarea
              className="input-dark"
              rows={4}
              placeholder={t('counterAppealPlaceholder')}
              value={appealEvidence}
              onChange={(e) => setAppealEvidence(e.target.value)}
              style={{ fontSize: 13, resize: "vertical" }}
            />
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <button
                className="btn-primary"
                disabled={!appealEvidence.trim()}
                onClick={() => {
                  setAppealSubmitted(true);
                  setAppealEvidence("");
                }}
                style={{ height: 36, fontSize: 13 }}
              >
                {t('submitAppeal')}
              </button>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>
                {t('appealDeadline', { hours: appealHoursLeft.toString() })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="card-dark" style={{ border: "1px solid rgba(246,70,93,0.4)" }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px", color: "var(--trading-down)" }}>⚠ {t('dangerZone')}</h3>
        <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 20px", lineHeight: 1.6 }}>
          {t('dangerWarning')}
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button className="btn-trading-down" disabled={slashed}>
            {t('lockFreeze')}
          </button>
          <button className="btn-trading-down" style={{ padding: "12px 32px", fontSize: 16 }} onClick={() => setShowConfirmSlash(true)} disabled={slashed}>
            {t('executeSlashing')} ⚠
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="card-dark" style={{ marginTop: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 16px" }}>{t('actionLog')}</h3>
        {[
          { time: "2026-07-08 15:10 UTC", action: "Admin: arbitrateSlashing() — 99 USDT to plaintiff, hacker blacklisted" },
          { time: "2026-07-08 15:05 UTC", action: "Admin: lockAndFreeze() — escrow frozen" },
          ...(appealSubmitted ? [{ time: "2026-07-08 15:03 UTC", action: "Worker: Counter-appeal submitted with evidence — pending review" }] : []),
          { time: "2026-07-08 15:01 UTC", action: "Plaintiff filed complaint (5 USDT fee paid)" },
          { time: "2026-07-08 14:32 UTC", action: "Order PAYED — 100 USDT in escrow" },
        ].map((log, i) => (
          <div key={i} style={{ display: "flex", gap: 16, padding: "10px 0", borderBottom: "1px solid var(--hairline-on-dark)" }}>
            <span style={{ fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap", minWidth: 160 }}>{log.time}</span>
            <span style={{ fontSize: 13 }}>{log.action}</span>
          </div>
        ))}
      </div>

      {/* Confirmation modal */}
      {showConfirmSlash && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="card-dark" style={{ maxWidth: 460, width: "100%", border: "2px solid var(--trading-down)" }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 12px", color: "var(--trading-down)" }}>⚠ {t('confirmSlashTitle')}</h3>
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, margin: "0 0 8px" }}>
              This will permanently:
            </p>
            <ul style={{ fontSize: 14, color: "var(--body)", lineHeight: 1.8, margin: "0 0 16px", paddingLeft: 20 }}>
              <li>Slash 99 USDT to plaintiff <strong>0x90F7...b906</strong></li>
              <li>Send 1 USDT fee to treasury</li>
              <li>Permanently blacklist <strong>0x3C44...93BC</strong></li>
            </ul>
            <p style={{ fontSize: 13, color: "var(--trading-down)", fontWeight: 600, margin: "0 0 20px" }}>
              {t('confirmSlashWarning')}
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button className="btn-secondary" onClick={() => setShowConfirmSlash(false)}>{tc('cancel')}</button>
              <button className="btn-trading-down" onClick={() => { setSlashed(true); setShowConfirmSlash(false); }}>
                {t('confirmSlash')} ⚠
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
