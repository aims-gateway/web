"use client";

import { useTranslations } from "next-intl";

export default function ForumAdminPage() {
  const t = useTranslations('ForumAdminPage');
  const events = [
    { time: "2026-07-08 14:32 UTC", type: "post_created", topicId: 42, classification: "OPTIMIZATION_SUGGESTION" },
    { time: "2026-07-08 13:15 UTC", type: "topic_created", topicId: 43, classification: "URGENT_BUG" },
    { time: "2026-07-08 11:00 UTC", type: "post_created", topicId: 40, classification: "GENERAL_FEEDBACK" },
    { time: "2026-07-07 18:45 UTC", type: "post_edited", topicId: 38, classification: "GENERAL_FEEDBACK" },
  ];

  const badge = (c: string) =>
    c === "URGENT_BUG" ? "badge badge-red" : c === "OPTIMIZATION_SUGGESTION" ? "badge badge-yellow" : "badge badge-muted";

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, margin: "0 0 32px" }}>{t('title')}</h1>

      {/* Status card */}
      <div className="card-dark" style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 16px" }}>{t('webhookStatus')}</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { label: t('endpoint'), value: "/api/v2/forum/webhook" },
            { label: t('status'), value: "Active ✓", color: "var(--trading-up)" },
            { label: t('lastEvent'), value: "2026-07-08 14:32 UTC" },
            { label: t('hmacVerification'), value: t('enabled') },
          ].map((d) => (
            <div key={d.label}>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 2 }}>{d.label}</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: d.color || "inherit" }}>{d.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Events table */}
      <div className="card-dark" style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 16px" }}>{t('recentEvents')}</h3>
        <table className="table-dark">
          <thead>
            <tr><th>{t('time')}</th><th>{t('eventType')}</th><th>{t('topicID')}</th><th>{t('classification')}</th></tr>
          </thead>
          <tbody>
            {events.map((e, i) => (
              <tr key={i}>
                <td style={{ fontSize: 13, color: "var(--muted)" }}>{e.time}</td>
                <td style={{ fontFamily: "monospace", fontSize: 13 }}>{e.type}</td>
                <td style={{ fontFamily: "monospace", fontSize: 14 }}>#{e.topicId}</td>
                <td><span className={badge(e.classification)}>{e.classification.replace(/_/g, " ")}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SSO config */}
      <div className="card-dark">
        <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 16px" }}>{t('ssoConfig')}</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>{t('discourseURL')}</label>
            <input className="input-dark" defaultValue="http://localhost:4000/session/sso" />
          </div>
          <div>
            <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>{t('ssoSecret')}</label>
            <input className="input-dark" type="password" defaultValue="••••••••••••••••" />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button className="btn-secondary">{t('testSSO')}</button>
            <button className="btn-trading-down">{t('regenerateSecret')}</button>
          </div>
        </div>
      </div>
    </main>
  );
}
