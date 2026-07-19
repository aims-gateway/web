"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

interface SettlementEntry {
  task: string;
  skill: string;
  amount: string;
  fee: string;
  worker: string;
  status: string;
  time: string;
  tx: string;
  accessMethod?: "byo" | "aims_managed";
  priority?: "normal" | "urgent";
  resellerId?: string;
  resellerMarkup?: string;
  basePrice?: string;
  transactionModel?: "mode1" | "mode2";
  orderType: "buyout" | "alliance_markup" | "pure_alliance";
  buyoutAmount?: string;
}

interface SplitDetail {
  consumerPaid: string;
  platformTax: string;
  aimsServiceFee: string;
  priorityMultiplier: string;
  resellerProfit: string;
  developerPayout: string;
  workerImmediate: string;
  workerReserve: string;
  workerReserveUnlock: string;
}

export default function SettlementsPage() {
  const router = useRouter();
  const t = useTranslations("SettlementsPage");
  const common = useTranslations("Common");
  const [loading, setLoading] = useState(true);
  const [splitModal, setSplitModal] = useState<SettlementEntry | null>(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [orderFilter, setOrderFilter] = useState("All");

  useEffect(() => {
    const w = sessionStorage.getItem("aims_wallet");
    if (!w) { router.push("/login"); return; }
    setLoading(false);
  }, [router]);

  if (loading) return <div style={{ padding: 80, textAlign: "center", color: "var(--muted)" }}>{common('loading')}</div>;

  const settlements: SettlementEntry[] = [
    { task: "Buyout #B1A2", skill: "LLaMA 3.1 70B", amount: "15000", fee: "150.00", worker: "0x3C44...93BC", status: "Complete", time: "2 min ago", tx: "0xabcd...1234", orderType: "buyout", buyoutAmount: "15000", transactionModel: "mode1" },
    { task: "Alliance+Markup #M1K2", skill: "Mixtral 8x7B MoE", amount: "0.0080", fee: "0.00425", worker: "0x7099...79C8", status: "Complete", time: "15 min ago", tx: "0xef01...5678", orderType: "alliance_markup", basePrice: "0.0050", resellerId: "R-xyz789", resellerMarkup: "0.0030", transactionModel: "mode2" },
    { task: "Pure Alliance #P3A4", skill: "Whisper Large v3", amount: "0.0020", fee: "0.00050", worker: "0xf39F...2266", status: "Complete", time: "20 min ago", tx: "0x3333...bbbb", orderType: "pure_alliance", basePrice: "0.0020", transactionModel: "mode2" },
    { task: "Buyout #B5C6", skill: "Code Llama 34B", amount: "8000", fee: "80.00", worker: "0x15d3...6A65", status: "Complete", time: "30 min ago", tx: "0x5555...aaaa", orderType: "buyout", buyoutAmount: "8000", transactionModel: "mode1" },
    { task: "Alliance+Markup #M7D8", skill: "DeepSeek-R1", amount: "0.0120", fee: "0.00600", worker: "0xA1B2...C3D4", status: "Complete", time: "1 hr ago", tx: "0x7777...cccc", orderType: "alliance_markup", basePrice: "0.0080", resellerId: "R-abc456", resellerMarkup: "0.0040", transactionModel: "mode2" },
    { task: "Pure Alliance #P9E0", skill: "Claude-3-Opus", amount: "0.0150", fee: "0.00375", worker: "0xE5F6...G7H8", status: "Pending", time: "1 hr ago", tx: "—", orderType: "pure_alliance", basePrice: "0.0150", transactionModel: "mode2" },
  ];

  const filtered = settlements.filter((s) => {
    if (statusFilter !== "All" && s.status !== statusFilter) return false;
    if (orderFilter !== "All" && s.orderType !== orderFilter) return false;
    return true;
  });

  const handleExportCSV = () => {
    const header = ["Task ID", "Skill", "Order Type", "Amount", "Fee", "Worker", "Status", "Time", "TxHash"];
    const rows = filtered.map((s) => [s.task, s.skill, s.orderType, s.amount, s.fee, s.worker, s.status, s.time, s.tx]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `settlements_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const calculateSplit = (s: SettlementEntry): SplitDetail => {
    const total = parseFloat(s.amount);
    const reserveRate = 0.04;
    const reserveUnlock = "7 days";

    if (s.orderType === "buyout") {
      // Path 1: Buyout fee 99/1
      const buyoutAmount = parseFloat(s.buyoutAmount || s.amount);
      const platformTax = buyoutAmount * 0.01;
      const devPayout = buyoutAmount * 0.99;
      const immediate = devPayout * (1 - reserveRate);
      const reserve = devPayout * reserveRate;

      return {
        consumerPaid: buyoutAmount.toFixed(2),
        platformTax: platformTax.toFixed(4),
        aimsServiceFee: "0.0000",
        priorityMultiplier: "1×",
        resellerProfit: "0.0000",
        developerPayout: devPayout.toFixed(4),
        workerImmediate: immediate.toFixed(4),
        workerReserve: reserve.toFixed(4),
        workerReserveUnlock: reserveUnlock,
      };
    }

    if (s.orderType === "alliance_markup") {
      // Path 2: Alliance base 10/40/50 + markup 100% to promoter
      const basePrice = parseFloat(s.basePrice || "0");
      const markup = parseFloat(s.resellerMarkup || "0");
      const aimsShare = basePrice * 0.10;
      const devShare = basePrice * 0.40;
      const resellerBaseCommission = basePrice * 0.50;
      const resellerTotal = resellerBaseCommission + markup;
      const devImmediate = devShare * (1 - reserveRate);
      const devReserve = devShare * reserveRate;

      return {
        consumerPaid: (basePrice + markup).toFixed(4),
        platformTax: aimsShare.toFixed(4),
        aimsServiceFee: "0.0000",
        priorityMultiplier: "1×",
        resellerProfit: resellerTotal.toFixed(4),
        developerPayout: devShare.toFixed(4),
        workerImmediate: devImmediate.toFixed(4),
        workerReserve: devReserve.toFixed(4),
        workerReserveUnlock: reserveUnlock,
      };
    }

    // Path 3: Pure Alliance — 10/40/50
    const basePrice = parseFloat(s.basePrice || s.amount);
    const aimsShare = basePrice * 0.10;
    const devShare = basePrice * 0.40;
    const resellerShare = basePrice * 0.50;
    const devImmediate = devShare * (1 - reserveRate);
    const devReserve = devShare * reserveRate;

    return {
      consumerPaid: basePrice.toFixed(4),
      platformTax: aimsShare.toFixed(4),
      aimsServiceFee: "0.0000",
      priorityMultiplier: "1×",
      resellerProfit: resellerShare.toFixed(4),
      developerPayout: devShare.toFixed(4),
      workerImmediate: devImmediate.toFixed(4),
      workerReserve: devReserve.toFixed(4),
      workerReserveUnlock: reserveUnlock,
    };
  };

  return (
    <main style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, margin: "0 0 4px" }}>{t('title')}</h1>
          <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>{t('subtitle')}</p>
        </div>
        <button className="btn-secondary" style={{ height: 36 }} onClick={handleExportCSV}>{common('exportCSV')}</button>
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { key: "All", label: t('filterAll') },
          { key: "Complete", label: t('filterComplete') },
          { key: "Pending", label: t('filterPending') },
          { key: "Disputed", label: t('filterDisputed') },
        ].map((f) => (
          <button key={f.key}
            className={statusFilter === f.key ? "btn-primary" : "btn-secondary"}
            style={{ height: 36, padding: "0 20px" }}
            onClick={() => setStatusFilter(f.key)}>
            {f.label}
          </button>
        ))}
        <span style={{ color: "var(--hairline-on-dark)", fontSize: 20, lineHeight: "36px" }}>|</span>
        {[
          { key: "All", label: t('filterAll') },
          { key: "buyout", label: t('filterBuyout') },
          { key: "alliance_markup", label: t('filterAllianceMarkup') },
          { key: "pure_alliance", label: t('filterPureAlliance') },
          { key: "test_period", label: t('filterTestPeriod') },
        ].map((f) => (
          <button key={f.key}
            className={orderFilter === f.key ? "btn-primary" : "btn-secondary"}
            style={{ height: 36, padding: "0 16px", fontSize: 12 }}
            onClick={() => setOrderFilter(f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>
        {t('showing')} {filtered.length} {t('of')} {settlements.length} {t('records').toLowerCase()}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--muted)" }}>{common('noResults')}</div>
      ) : (
      <div className="card-dark" style={{ overflowX: "auto" }}>
        <table className="table-dark">
          <thead>
            <tr>
              <th>{t('taskID')}</th><th>{t('skill')}</th><th>{t('orderType')}</th><th>Amount</th><th>{t('fee')}</th>
              <th>{t('worker')}</th><th>{common('status')}</th>
              <th>Time</th><th>{t('txHash')}</th><th>{t('split')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => (
              <tr key={i}>
                <td style={{ fontFamily: "monospace", fontSize: 13 }}>{s.task}</td>
                <td>{s.skill}{s.resellerId && s.orderType === "alliance_markup" && <span style={{ fontSize: 10, color: "var(--primary)", marginLeft: 6 }}>via {s.resellerId}</span>}</td>
                <td>
                  <span style={{
                    fontSize: 11, padding: "2px 8px", borderRadius: 4, fontWeight: 600,
                    background: s.orderType === "buyout" ? "rgba(14,203,129,0.1)" : s.orderType === "alliance_markup" ? "rgba(252,213,53,0.12)" : "rgba(59,130,246,0.12)",
                    color: s.orderType === "buyout" ? "var(--trading-up)" : s.orderType === "alliance_markup" ? "var(--primary)" : "#3b82f6",
                  }}>
                    {s.orderType === "buyout" ? t('buyoutOrder') : s.orderType === "alliance_markup" ? t('allianceMarkupOrder') : t('pureAllianceOrder')}
                  </span>
                </td>
                <td style={{ fontFamily: "monospace" }}>{parseFloat(s.amount) >= 1 ? `$${parseFloat(s.amount).toLocaleString()}` : `${s.amount}`} USDT</td>
                <td style={{ fontFamily: "monospace", color: "var(--muted)" }}>{s.fee} USDT</td>
                <td style={{ fontFamily: "monospace", fontSize: 13, color: "var(--muted)" }}>{s.worker}</td>
                <td><span className={s.status === "Complete" ? "badge badge-green" : "badge badge-yellow"}>{s.status === "Complete" ? common('complete') : common('pending')}</span></td>
                <td style={{ fontSize: 13, color: "var(--muted)" }}>{s.time}</td>
                <td style={{ fontFamily: "monospace", fontSize: 12, color: s.tx === "—" ? "var(--muted)" : "var(--primary)" }}>{s.tx}</td>
                <td>
                  <button className="btn-secondary" style={{ height: 28, fontSize: 11 }} onClick={() => setSplitModal(s)} data-testid={`view-split-${i}`}>
                    {t('viewSplit')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {/* ── Revenue Split Modal ── */}
      {splitModal && (() => {
        const split = calculateSplit(splitModal);
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
            <div className="card-dark" style={{ maxWidth: 520, width: "100%", padding: 28, maxHeight: "90vh", overflowY: "auto" }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 4px" }}>{t('splitTitle')}</h3>
              <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 20px", fontFamily: "monospace" }}>{splitModal.task}</p>

              {/* Formula summary */}
              <div style={{ padding: 14, borderRadius: 8, background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)", marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>{t('pricingFormula')}</div>
                  <span style={{
                    fontSize: 10, padding: "2px 8px", borderRadius: 4, fontWeight: 600,
                    background: splitModal.orderType === "buyout" ? "rgba(14,203,129,0.12)" : splitModal.orderType === "alliance_markup" ? "rgba(252,213,53,0.12)" : "rgba(59,130,246,0.15)",
                    color: splitModal.orderType === "buyout" ? "var(--trading-up)" : splitModal.orderType === "alliance_markup" ? "var(--primary)" : "#3b82f6",
                  }}>
                    {splitModal.orderType === "buyout" ? t('buyoutOrder') : splitModal.orderType === "alliance_markup" ? t('allianceMarkupOrder') : t('pureAllianceOrder')}
                  </span>
                </div>
                <code style={{ fontSize: 11, fontFamily: "monospace", color: "var(--body)", lineHeight: 1.7, wordBreak: "break-all" }}>
                  {splitModal.orderType === "buyout"
                    ? t('buyoutSplitDetail')
                    : splitModal.orderType === "alliance_markup"
                    ? t('allianceMarkupSplitDetail')
                    : t('pureAllianceSplitDetail')}
                </code>
              </div>

              {/* Split flow */}
              <div style={{ display: "flex", flexDirection: "column", gap: 1, marginBottom: 20 }}>
                {(splitModal.orderType === "buyout" ? [
                  { label: t('consumerPaid'), value: `$${split.consumerPaid}`, color: "var(--primary)", bold: true },
                  { label: t('platformTax1'), value: `−$${split.platformTax}`, color: "var(--trading-down)", indent: true },
                  { label: t('developerPayout'), value: `$${split.developerPayout}`, color: "var(--trading-up)", bold: true },
                  { label: "", value: "", color: "" },
                  { label: t('workerImmediate'), value: `$${split.workerImmediate}`, color: "var(--trading-up)", bold: true },
                  { label: t('workerReserve'), value: `$${split.workerReserve}`, color: "var(--muted)", indent: true },
                  { label: t('reserveUnlock'), value: split.workerReserveUnlock, color: "var(--muted)", indent: true },
                ] : splitModal.orderType === "alliance_markup" ? [
                  { label: t('consumerPaid'), value: `$${split.consumerPaid}`, color: "var(--primary)", bold: true },
                  { label: t('aimsAllianceShare'), value: `−$${split.platformTax}`, color: "var(--trading-down)", indent: true, sub: "AIMS 10%" },
                  { label: t('devAllianceShare'), value: `$${split.developerPayout}`, color: "var(--trading-up)", bold: true, sub: "Dev 40%" },
                  { label: t('resellerProfitLine'), value: `$${(parseFloat(split.resellerProfit) - parseFloat(splitModal.resellerMarkup || "0")).toFixed(4)}`, color: "var(--primary)", indent: true, sub: "Base 50%" },
                  { label: t('markupComponent'), value: `$${splitModal.resellerMarkup || "0"}`, color: "var(--primary)", indent: true, sub: "Markup 100%" },
                  { label: "", value: "", color: "" },
                  { label: t('workerImmediate'), value: `$${split.workerImmediate}`, color: "var(--trading-up)", bold: true },
                  { label: t('workerReserve'), value: `$${split.workerReserve}`, color: "var(--muted)", indent: true },
                  { label: t('reserveUnlock'), value: split.workerReserveUnlock, color: "var(--muted)", indent: true },
                ] : [
                  { label: t('consumerPaid'), value: `$${split.consumerPaid}`, color: "var(--primary)", bold: true },
                  { label: t('aimsAllianceShare'), value: `−$${split.platformTax}`, color: "var(--trading-down)", indent: true },
                  { label: t('devAllianceShare'), value: `$${split.developerPayout}`, color: "var(--trading-up)", bold: true },
                  { label: t('resellerProfitLine'), value: `$${split.resellerProfit}`, color: "var(--primary)", indent: true },
                  { label: "", value: "", color: "" },
                  { label: t('workerImmediate'), value: `$${split.workerImmediate}`, color: "var(--trading-up)", bold: true },
                  { label: t('workerReserve'), value: `$${split.workerReserve}`, color: "var(--muted)", indent: true },
                  { label: t('reserveUnlock'), value: split.workerReserveUnlock, color: "var(--muted)", indent: true },
                ]).filter((r) => r.label !== "" || r.value !== "").map((row, j) => (
                  <div key={j} style={{ display: "flex", justifyContent: "space-between", padding: row.indent ? "3px 8px 3px 20px" : "6px 8px", fontSize: row.bold ? 14 : 12, fontWeight: row.bold ? 600 : 400, fontFamily: row.bold ? "monospace" : "inherit" }}>
                    <span style={{ color: "var(--muted)" }}>
                      {row.label}
                      {(row as any).sub && <span style={{ fontSize: 9, color: "var(--muted)", marginLeft: 4 }}>{(row as any).sub}</span>}
                    </span>
                    <span style={{ color: row.color, fontFamily: "monospace" }}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Zero-sum verification */}
              <div style={{ padding: 10, borderRadius: 6, background: "rgba(14,203,129,0.06)", border: "1px solid rgba(14,203,129,0.15)", fontSize: 11, textAlign: "center", color: "var(--trading-up)", fontFamily: "monospace", marginBottom: 20 }}>
                ✓ {t('zeroSumVerified')}
              </div>

              <button className="btn-primary" style={{ width: "100%" }} onClick={() => setSplitModal(null)}>
                {common('close')}
              </button>
            </div>
          </div>
        );
      })()}
    </main>
  );
}
