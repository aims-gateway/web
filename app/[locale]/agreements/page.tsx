"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

function shortHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const chr = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(36).padStart(8, "0");
}

const SKILL_DEVELOPER_MAP: Record<string, { devName: string; devAddr: string }> = {
  "LLaMA 3.1 70B": { devName: "Meta AI Labs", devAddr: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" },
  "Code Llama 34B": { devName: "SecureAudit DAO", devAddr: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65" },
  "Stable Diffusion XL": { devName: "PixelForge Studio", devAddr: "0x90F79bf6EB2c4f870365E785982E1f101E93b906" },
};

const SLA_TIERS = [
  { key: "standard", label: "Standard", desc: "Normal queue priority, best-effort scheduling", priority: "Normal" },
  { key: "priority", label: "Priority", desc: "Elevated queue priority, < 10s allocation", priority: "High" },
  { key: "reserved", label: "Reserved", desc: "Dedicated worker pool, < 2s allocation, 99.9% uptime SLA", priority: "Highest" },
];

export default function AgreementsPage() {
  const router = useRouter();
  const t = useTranslations('AgreementsPage');
  const tc = useTranslations('Common');
  const [tab, setTab] = useState<"active" | "new">("active");
  const [loading, setLoading] = useState(true);
  const [cpWallet, setCpWallet] = useState("");
  const [skillRef, setSkillRef] = useState("");
  const [amount, setAmount] = useState("");
  const [modeType, setModeType] = useState<"per_call" | "buyout" | "subscription" | "alliance">("per_call");
  const [slaTier, setSlaTier] = useState("standard");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem("aims_wallet")) { router.push("/login"); return; }
    setLoading(false);
  }, [router]);

  const selectedDeveloper = SKILL_DEVELOPER_MAP[skillRef] || null;

  // Auto-fill developer address when skill is selected
  useEffect(() => {
    if (selectedDeveloper) {
      setCpWallet(selectedDeveloper.devAddr);
    }
  }, [skillRef, selectedDeveloper]);

  const termsHash = useMemo(() => {
    if (!cpWallet && !skillRef && !amount) return "";
    return "Qm" + shortHash(`${cpWallet}:${skillRef}:${amount}:${slaTier}:${Date.now()}`);
  }, [cpWallet, skillRef, amount, slaTier]);

  if (loading) return <div style={{ padding: 80, textAlign: "center", color: "var(--muted)" }}>{tc('loading')}</div>;

  type AgreementMode = "per_call" | "buyout" | "subscription" | "alliance";
  interface AgreementEntry {
    id: string; party: string; partyName: string; value: string; status: string;
    created: string; expires: string; skill: string; sla: string; mode: AgreementMode;
  }
  const agreements: AgreementEntry[] = [
    { id: "AGR-001", party: "0x3C44...93BC", partyName: "Meta AI Labs", value: "500", status: "Active", created: "2026-07-01", expires: "Block #12.5M", skill: "LLaMA 3.1 70B", sla: "Priority", mode: "buyout" },
    { id: "AGR-002", party: "0x15d3...6A65", partyName: "SecureAudit DAO", value: "200", status: "Locked", created: "2026-07-03", expires: "Block #12.4M", skill: "Code Llama 34B", sla: "Standard", mode: "per_call" },
    { id: "AGR-003", party: "0x90F7...b906", partyName: "PixelForge Studio", value: "1000", status: "Active", created: "2026-07-05", expires: "Block #12.6M", skill: "Stable Diffusion XL", sla: "Reserved", mode: "alliance" },
  ];

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 24px" }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, margin: "0 0 8px" }}>{t('title')}</h1>
      <p style={{ color: "var(--muted)", fontSize: 13, margin: "0 0 32px", lineHeight: 1.6 }}>{t('slaDesc')}</p>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 24, marginBottom: 32, borderBottom: "1px solid var(--hairline-on-dark)" }}>
        <button onClick={() => setTab("active")} style={{ background: "none", border: "none", borderBottom: tab === "active" ? "2px solid var(--primary)" : "2px solid transparent", cursor: "pointer", fontSize: 16, fontWeight: 600, padding: "0 0 12px", color: tab === "active" ? "var(--primary)" : "var(--muted)" }}>
          {t('tabActive')}
        </button>
        <button onClick={() => setTab("new")} style={{ background: "none", border: "none", borderBottom: tab === "new" ? "2px solid var(--primary)" : "2px solid transparent", cursor: "pointer", fontSize: 16, fontWeight: 600, padding: "0 0 12px", color: tab === "new" ? "var(--primary)" : "var(--muted)" }}>
          + {t('tabCreate')}
        </button>
      </div>

      {tab === "active" ? (
        <div className="card-dark" style={{ overflowX: "auto" }}>
          <table className="table-dark">
            <thead>
              <tr>
                <th>Agreement ID</th><th>Skill</th><th>{t('developer')}</th><th>{t('modeType')}</th><th>SLA</th><th>Value</th><th>{tc('status')}</th><th>Expires</th><th>{tc('action')}</th>
              </tr>
            </thead>
            <tbody>
              {agreements.map((a, i) => (
                <tr key={i}>
                  <td style={{ fontFamily: "monospace" }}>{a.id}</td>
                  <td>{a.skill}</td>
                  <td>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{a.partyName}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "monospace" }}>{a.party}</div>
                  </td>
                  <td>
                    <span style={{
                      fontSize: 11, padding: "2px 8px", borderRadius: 4, fontWeight: 600,
                      background: a.mode === "buyout" ? "rgba(14,203,129,0.12)" : a.mode === "subscription" ? "rgba(59,130,246,0.12)" : a.mode === "alliance" ? "rgba(245,158,11,0.12)" : "rgba(112,122,138,0.08)",
                      color: a.mode === "buyout" ? "var(--trading-up)" : a.mode === "subscription" ? "#3b82f6" : a.mode === "alliance" ? "#f59e0b" : "var(--muted)",
                    }}>
                      {a.mode === "buyout" ? t("buyoutAgreement") : a.mode === "subscription" ? t("subscriptionAgreement") : a.mode === "alliance" ? t("allianceAgreement") : t("perCallAgreement")}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      fontSize: 11, padding: "2px 10px", borderRadius: 9999,
                      background: a.sla === "Reserved" ? "rgba(252,213,53,0.12)" : a.sla === "Priority" ? "rgba(59,130,246,0.12)" : "rgba(112,122,138,0.1)",
                      color: a.sla === "Reserved" ? "var(--primary)" : a.sla === "Priority" ? "#3b82f6" : "var(--muted)",
                      fontWeight: 600,
                    }}>
                      {a.sla}
                    </span>
                  </td>
                  <td style={{ fontFamily: "monospace" }}>{a.value} USDT</td>
                  <td><span className={a.status === "Active" ? "badge badge-green" : "badge badge-yellow"}>{a.status}</span></td>
                  <td style={{ color: "var(--muted)", fontSize: 13 }}>{a.expires}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8, minHeight: 28, alignItems: "center" }}>
                      {a.status === "Active" ? <button className="btn-trading-up" style={{ fontSize: 12, padding: "4px 12px" }}>{t('lock')}</button> : <span style={{ width: 58 }} />}
                      <button className="btn-trading-down" style={{ fontSize: 12, padding: "4px 12px" }}>{t('dispute')}</button>
                      <button className="text-link" style={{ fontSize: 12 }}>{t('view')}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : submitted ? (
        <div className="card-dark" style={{ maxWidth: 560, textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: 24, background: "var(--trading-up)", color: "white", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 12 }}>✓</div>
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 8px" }}>{t('agreementCreated')}</h2>
          <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 8px" }}>{t('agreementCreatedDesc', { hash: termsHash })}</p>
          <div style={{ padding: 12, borderRadius: 6, background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)", fontSize: 12, color: "var(--muted)", textAlign: "left", maxWidth: 380, margin: "0 auto 20px", lineHeight: 1.6 }}>
            <div style={{ fontWeight: 600, marginBottom: 4, color: "var(--body)" }}>{t('slaRoutingNote')}</div>
            {t('slaRoutingNoteDesc', { skill: skillRef, sla: SLA_TIERS.find(s => s.key === slaTier)?.label || "Standard" })}
          </div>
          <button className="btn-primary" onClick={() => { setTab("active"); setSubmitted(false); setCpWallet(""); setSkillRef(""); setAmount(""); setSlaTier("standard"); }}>{t('viewActiveAgreements')}</button>
        </div>
      ) : (
        <div className="card-dark" style={{ maxWidth: 560 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 8px" }}>{t('newAgreementTitle')}</h2>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 24px", lineHeight: 1.5 }}>{t('newAgreementDesc')}</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>{t('skillReference')}</label>
              <select className="input-dark" value={skillRef} onChange={(e) => setSkillRef(e.target.value)}>
                <option value="">{t('skillRefPlaceholder')}</option>
                {Object.keys(SKILL_DEVELOPER_MAP).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{t('skillRefHint')}</div>
            </div>

            <div>
              <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>{t('developerWallet')}</label>
              <input className="input-dark" value={cpWallet} readOnly style={{ fontFamily: "monospace", fontSize: 13, opacity: cpWallet ? 1 : 0.5 }} />
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                {selectedDeveloper
                  ? t('developerAutoFilled', { name: selectedDeveloper.devName })
                  : t('developerAutoFillHint')}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>{t('modeType')}</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {([
                  { key: "per_call", label: t("perCallAgreement") },
                  { key: "buyout", label: t("buyoutAgreement") },
                  { key: "subscription", label: t("subscriptionAgreement") },
                  { key: "alliance", label: t("allianceAgreement") },
                ] as const).map((m) => (
                  <label key={m.key} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", borderRadius: 6, cursor: "pointer",
                    border: modeType === m.key ? "2px solid var(--primary)" : "1px solid var(--hairline-on-dark)",
                    background: modeType === m.key ? "rgba(252,213,53,0.05)" : "transparent", fontSize: 13,
                  }}>
                    <input type="radio" name="modeType" checked={modeType === m.key} onChange={() => setModeType(m.key)} />
                    {m.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>{t('slaTier')}</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {SLA_TIERS.map((sla) => (
                  <label key={sla.key} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 8, cursor: "pointer",
                    border: slaTier === sla.key ? "2px solid var(--primary)" : "1px solid var(--hairline-on-dark)",
                    background: slaTier === sla.key ? "rgba(252,213,53,0.05)" : "transparent",
                  }}>
                    <input type="radio" name="sla" checked={slaTier === sla.key} onChange={() => setSlaTier(sla.key)} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{sla.label}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{sla.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>{t('amountUSDT')}</label>
              <input className="input-dark" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>

            <div>
              <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>{t('termsHash')}</label>
              <input className="input-dark" value={termsHash} readOnly style={{ fontFamily: "monospace", fontSize: 13, opacity: termsHash ? 1 : 0.5 }} />
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{t('termsHashHint')}</div>
            </div>

            <button className="btn-primary" style={{ marginTop: 8 }} onClick={() => setSubmitted(true)} disabled={!skillRef || !amount}>{t('createAgreement')}</button>
          </div>
        </div>
      )}
    </main>
  );
}
