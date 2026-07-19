"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface WorkerEntry {
  address: string;
  stake: number;
  tier: number;
  tierLabel: string;
  completionRate: number;
  disputeRate: number;
  slashedCount: number;
  totalOrders: number;
  joinedAt: string;
}

export default function AdminWorkersPage() {
  const t = useTranslations("AdminWorkersPage");
  const common = useTranslations("Common");

  const [workers, setWorkers] = useState<WorkerEntry[]>([
    { address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", stake: 500, tier: 2, tierLabel: "VIP", completionRate: 99.2, disputeRate: 0.3, slashedCount: 0, totalOrders: 1247, joinedAt: "2026-03-15" },
    { address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", stake: 150, tier: 1, tierLabel: "Veteran", completionRate: 97.8, disputeRate: 1.2, slashedCount: 0, totalOrders: 823, joinedAt: "2026-04-02" },
    { address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", stake: 50, tier: 1, tierLabel: "Veteran", completionRate: 94.5, disputeRate: 3.8, slashedCount: 1, totalOrders: 456, joinedAt: "2026-05-10" },
    { address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", stake: 10, tier: 0, tierLabel: "Standard", completionRate: 88.2, disputeRate: 7.1, slashedCount: 2, totalOrders: 189, joinedAt: "2026-06-20" },
    { address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", stake: 25, tier: 0, tierLabel: "Standard", completionRate: 92.0, disputeRate: 2.5, slashedCount: 0, totalOrders: 312, joinedAt: "2026-05-28" },
  ]);

  const [confirmAction, setConfirmAction] = useState<{ addr: string; action: "upgrade" | "downgrade" } | null>(null);

  const tierBadgeStyle = (tier: number): React.CSSProperties => ({
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: 9999,
    fontSize: 11,
    fontWeight: 600,
    background: tier === 2 ? "rgba(252,213,53,0.15)" : tier === 1 ? "rgba(59,130,246,0.15)" : "rgba(112,122,138,0.15)",
    color: tier === 2 ? "var(--primary)" : tier === 1 ? "#3b82f6" : "var(--muted)",
  });

  const confirmTierChange = () => {
    if (!confirmAction) return;
    setWorkers((prev) =>
      prev.map((w) => {
        if (w.address !== confirmAction.addr) return w;
        const newTier = confirmAction.action === "upgrade"
          ? Math.min(2, w.tier + 1)
          : Math.max(0, w.tier - 1);
        const tierLabels = ["Standard", "Veteran", "VIP"];
        return { ...w, tier: newTier, tierLabel: tierLabels[newTier] };
      })
    );
    setConfirmAction(null);
  };

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>{t("title")}</h1>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>{workers.length} {t("workers")}</span>
      </div>
      <p style={{ color: "var(--muted)", fontSize: 13, margin: "0 0 32px" }}>{t("desc")}</p>

      {/* Tier legend */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24, fontSize: 12, color: "var(--muted)" }}>
        <span><span style={{ ...tierBadgeStyle(2), marginRight: 6 }}>VIP</span> {t("vipDesc")}</span>
        <span><span style={{ ...tierBadgeStyle(1), marginRight: 6 }}>Veteran</span> {t("veteranDesc")}</span>
        <span><span style={{ ...tierBadgeStyle(0), marginRight: 6 }}>Standard</span> {t("standardDesc")}</span>
      </div>

      <div className="card-dark" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {[t("address"), t("stake"), t("tier"), t("completion"), t("disputeRate"), t("slashed"), t("totalOrders"), t("joined"), t("actions")].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, color: "var(--muted)", borderBottom: "1px solid var(--hairline-on-dark)", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {workers.map((w) => (
              <tr key={w.address} style={{ borderBottom: "1px solid var(--hairline-on-dark)" }}>
                <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 12, whiteSpace: "nowrap" }}>
                  {w.address.slice(0, 10)}...
                </td>
                <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 13, fontWeight: 600 }}>
                  {w.stake.toLocaleString()} USDT
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <span style={tierBadgeStyle(w.tier)}>{w.tierLabel}</span>
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 60, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${w.completionRate}%`, borderRadius: 3, background: w.completionRate >= 95 ? "var(--trading-up)" : w.completionRate >= 90 ? "var(--primary)" : "var(--trading-down)" }} />
                    </div>
                    <span style={{ fontSize: 12, fontFamily: "monospace" }}>{w.completionRate}%</span>
                  </div>
                </td>
                <td style={{ padding: "10px 12px", fontSize: 13, fontFamily: "monospace", color: w.disputeRate > 5 ? "var(--trading-down)" : "var(--trading-up)" }}>
                  {w.disputeRate}%
                </td>
                <td style={{ padding: "10px 12px", fontSize: 13, fontFamily: "monospace", color: w.slashedCount > 0 ? "var(--trading-down)" : "var(--muted)" }}>
                  {w.slashedCount}
                </td>
                <td style={{ padding: "10px 12px", fontSize: 13 }}>
                  {w.totalOrders.toLocaleString()}
                </td>
                <td style={{ padding: "10px 12px", fontSize: 12, color: "var(--muted)" }}>
                  {w.joinedAt}
                </td>
                <td style={{ padding: "10px 12px", display: "flex", gap: 6 }}>
                  <button
                    className="btn-secondary"
                    style={{ height: 26, fontSize: 11, padding: "0 10px", color: "var(--trading-up)" }}
                    disabled={w.tier >= 2}
                    onClick={() => setConfirmAction({ addr: w.address, action: "upgrade" })}
                    title={t("upgradeTier")}
                  >
                    ↑ {t("upgrade")}
                  </button>
                  <button
                    className="btn-secondary"
                    style={{ height: 26, fontSize: 11, padding: "0 10px", color: "var(--trading-down)" }}
                    disabled={w.tier <= 0}
                    onClick={() => setConfirmAction({ addr: w.address, action: "downgrade" })}
                    title={t("downgradeTier")}
                  >
                    ↓ {t("downgrade")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Confirm Modal ── */}
      {confirmAction && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="card-dark" style={{ maxWidth: 440, width: "100%", padding: 28 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 12px" }}>
              {confirmAction.action === "upgrade" ? t("confirmUpgrade") : t("confirmDowngrade")}
            </h3>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 8px" }}>
              {t("confirmWorker", { addr: confirmAction.addr.slice(0, 10) + "..." })}
            </p>
            <p style={{ fontSize: 12, color: "var(--trading-down)", margin: "0 0 20px" }}>
              {t("tierChangeIrreversible")}
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmAction(null)}>
                {common("cancel")}
              </button>
              <button
                className="btn-primary"
                style={{ flex: 1, background: confirmAction.action === "downgrade" ? "var(--trading-down)" : undefined }}
                onClick={confirmTierChange}
              >
                {common("confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
