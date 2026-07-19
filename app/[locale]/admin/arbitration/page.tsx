"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

interface Case { id: string; orderId: string; plaintiff: string; hacker: string; amount: string; status: "FROZEN" | "ARBITRATED" | "PAYED"; time: string; }

export default function ArbitrationBoardPage() {
  const router = useRouter();
  const t = useTranslations('ArbitrationBoardPage');
  const tc = useTranslations('Common');
  const [filter, setFilter] = useState("All");

  const cases: Case[] = [
    { id: "CASE-001", orderId: "0xabcd...ef01", plaintiff: "0x90F7...b906", hacker: "0x3C44...93BC", amount: "100 USDT", status: "FROZEN", time: "2 hr ago" },
    { id: "CASE-002", orderId: "0x2345...6789", plaintiff: "0x15d3...6A65", hacker: "0x7099...79C8", amount: "250 USDT", status: "ARBITRATED", time: "1 day ago" },
    { id: "CASE-003", orderId: "0x9876...5432", plaintiff: "0xf39F...2266", hacker: "0x90F7...b906", amount: "50 USDT", status: "FROZEN", time: "5 hr ago" },
    { id: "CASE-004", orderId: "0xdead...beef", plaintiff: "0x3C44...93BC", hacker: "0x15d3...6A65", amount: "500 USDT", status: "PAYED", time: "3 days ago" },
  ];

  const filtered = filter === "All" ? cases : cases.filter((c) => c.status === filter);
  const statusBadge = (s: string) => s === "FROZEN" ? "badge badge-red" : s === "ARBITRATED" ? "badge badge-green" : "badge badge-muted";

  return (
    <main style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, margin: "0 0 4px" }}>{t('title')}</h1>
          <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>{t('subtitle')}</p>
        </div>
        <span className="badge badge-red">{t('adminZone')}</span>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        {[
          { label: t('openCases'), value: "3", color: "var(--trading-down)" },
          { label: t('frozen'), value: "2", color: "var(--trading-down)" },
          { label: t('resolved'), value: "47", color: "var(--trading-up)" },
          { label: t('totalSlashed'), value: "1,250 USDT", color: "var(--primary)" },
        ].map((s) => (
          <div className="card-dark" key={s.label}>
            <div className="stat-number" style={{ fontSize: 28, color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        {["All", "FROZEN", "PAYED", "ARBITRATED"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={filter === f ? "btn-primary" : "btn-secondary"} style={{ height: 36, padding: "0 20px" }}>{f}</button>
        ))}
      </div>

      {/* Cases table */}
      <div className="card-dark">
        <table className="table-dark">
          <thead>
            <tr><th>{t('caseID')}</th><th>{t('orderID')}</th><th>{t('plaintiff')}</th><th>{t('hacker')}</th><th>Amount</th><th>{tc('status')}</th><th>Time</th><th>{tc('action')}</th></tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td style={{ fontFamily: "monospace" }}>{c.id}</td>
                <td style={{ fontFamily: "monospace", fontSize: 12, color: "var(--muted)" }}>{c.orderId}</td>
                <td style={{ fontFamily: "monospace", fontSize: 13, color: "var(--muted)" }}>{c.plaintiff}</td>
                <td style={{ fontFamily: "monospace", fontSize: 13, color: "var(--trading-down)" }}>{c.hacker}</td>
                <td style={{ fontFamily: "monospace" }}>{c.amount}</td>
                <td><span className={statusBadge(c.status)}>{c.status}</span></td>
                <td style={{ fontSize: 13, color: "var(--muted)" }}>{c.time}</td>
                <td><button className="btn-primary" style={{ height: 28, padding: "0 14px", fontSize: 12 }} onClick={() => router.push(`/admin/arbitration/${c.id}`)}>{t('review')}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
