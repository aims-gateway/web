"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

const blacklist = [
  { addr: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", reason: "Code Theft — DeepSeek 87.3% match", since: "2026-07-08", block: "12,456,789" },
  { addr: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", reason: "Repeated Non-Payment", since: "2026-06-15", block: "11,234,567" },
  { addr: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", reason: "Sybil Attack — 47 fake identities", since: "2026-05-20", block: "10,123,456" },
];

export default function BlacklistPage() {
  const t = useTranslations('BlacklistPage');
  const tc = useTranslations('Common');
  const [checkAddr, setCheckAddr] = useState("");
  const [checkResult, setCheckResult] = useState<null | boolean>(null);

  const handleCheck = () => {
    setCheckResult(blacklist.some((b) => b.addr.toLowerCase() === checkAddr.toLowerCase()));
  };

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, margin: "0 0 4px" }}>{t('title')}</h1>
          <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>
            {t('subtitle', { count: blacklist.length })}
          </p>
        </div>
        <span className="badge badge-red">Admin Zone</span>
      </div>

      {/* Check address */}
      <div className="card-dark" style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 16px" }}>{t('checkAddress')}</h3>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <input className="input-dark" placeholder="0x..." value={checkAddr} onChange={(e) => setCheckAddr(e.target.value)} />
          </div>
          <button className="btn-secondary" style={{ height: 40 }} onClick={handleCheck}>{t('checkStatus')}</button>
        </div>
        {checkResult !== null && (
          <div style={{ marginTop: 12, padding: "12px 16px", borderRadius: 8, background: checkResult ? "rgba(246,70,93,0.1)" : "rgba(14,203,129,0.1)", border: `1px solid ${checkResult ? "rgba(246,70,93,0.3)" : "rgba(14,203,129,0.3)"}` }}>
            <span style={{ fontWeight: 600, color: checkResult ? "var(--trading-down)" : "var(--trading-up)" }}>
              {checkResult ? <>⛔ {t('blacklisted')}</> : <>✅ {t('clean')}</>}
            </span>
            <span style={{ marginLeft: 8, fontSize: 13, color: "var(--muted)" }}>
              {checkResult ? t('blacklistedDesc') : t('cleanDesc')}
            </span>
          </div>
        )}
      </div>

      {/* Blacklist table */}
      <div className="card-dark">
        <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 16px" }}>Blacklisted Addresses</h3>
        <table className="table-dark">
          <thead>
            <tr><th>{t('address')}</th><th>{t('reason')}</th><th>{t('since')}</th><th>{t('block')}</th><th>{tc('action')}</th></tr>
          </thead>
          <tbody>
            {blacklist.map((b, i) => (
              <tr key={i}>
                <td style={{ fontFamily: "monospace", fontSize: 13, color: "var(--trading-down)" }}>{b.addr}</td>
                <td style={{ fontSize: 14 }}>{b.reason}</td>
                <td style={{ fontSize: 13, color: "var(--muted)" }}>{b.since}</td>
                <td style={{ fontFamily: "monospace", fontSize: 13, color: "var(--muted)" }}>{b.block}</td>
                <td>
                  <button className="text-link" style={{ fontSize: 12 }} onClick={() => { navigator.clipboard.writeText(b.addr); }}>
                    {tc('copy')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 16 }}>
          {t('footerNote')}
        </p>
      </div>
    </main>
  );
}
