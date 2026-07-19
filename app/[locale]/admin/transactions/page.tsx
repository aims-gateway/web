"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface Transaction {
  id: string;
  userWallet: string;
  type: "buyout" | "subscription" | "per_call" | "alliance" | "deposit" | "withdrawal";
  skillName: string;
  amount: number;
  fee: number;
  devPayout: number;
  status: "completed" | "pending" | "failed";
  createdAt: string;
}

function loadTransactions(): Transaction[] {
  if (typeof window === "undefined") return [];
  const raw = sessionStorage.getItem("aims_admin_transactions");
  if (raw) return JSON.parse(raw);
  const defaults: Transaction[] = [
    { id: "tx-001", userWallet: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", type: "per_call", skillName: "LLaMA 3.1 70B Inference", amount: 4.20, fee: 0.04, devPayout: 4.16, status: "completed", createdAt: "2026-07-10T08:32:00Z" },
    { id: "tx-002", userWallet: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", type: "subscription", skillName: "Stable Diffusion XL", amount: 299.00, fee: 2.99, devPayout: 296.01, status: "completed", createdAt: "2026-07-10T08:15:00Z" },
    { id: "tx-003", userWallet: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", type: "buyout", skillName: "Code Llama 34B Audit", amount: 15000.00, fee: 150.00, devPayout: 14850.00, status: "completed", createdAt: "2026-07-10T07:45:00Z" },
    { id: "tx-004", userWallet: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", type: "alliance", skillName: "Whisper Large v3 TTS", amount: 12.50, fee: 1.88, devPayout: 7.50, status: "completed", createdAt: "2026-07-10T07:20:00Z" },
    { id: "tx-005", userWallet: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", type: "deposit", skillName: "USDT Deposit", amount: 500.00, fee: 0, devPayout: 0, status: "completed", createdAt: "2026-07-10T06:55:00Z" },
    { id: "tx-006", userWallet: "0xA1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0", type: "per_call", skillName: "Mixtral 8x7B MoE", amount: 3.50, fee: 0.04, devPayout: 3.46, status: "completed", createdAt: "2026-07-10T06:30:00Z" },
    { id: "tx-007", userWallet: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", type: "per_call", skillName: "LLaMA 3.1 70B Inference", amount: 1.20, fee: 0.01, devPayout: 1.19, status: "pending", createdAt: "2026-07-10T06:10:00Z" },
    { id: "tx-008", userWallet: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", type: "withdrawal", skillName: "USDT Withdrawal", amount: 200.00, fee: 2.00, devPayout: 0, status: "failed", createdAt: "2026-07-09T23:45:00Z" },
    { id: "tx-009", userWallet: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", type: "subscription", skillName: "GPT-4o Team Plan", amount: 499.00, fee: 4.99, devPayout: 494.01, status: "completed", createdAt: "2026-07-09T22:00:00Z" },
    { id: "tx-010", userWallet: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", type: "alliance", skillName: "DeepSeek-R1 Reasoning", amount: 8.75, fee: 1.31, devPayout: 5.25, status: "completed", createdAt: "2026-07-09T21:30:00Z" },
    { id: "tx-011", userWallet: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", type: "buyout", skillName: "DALL-E 3 Compatible", amount: 8000.00, fee: 80.00, devPayout: 7920.00, status: "completed", createdAt: "2026-07-09T20:15:00Z" },
    { id: "tx-012", userWallet: "0xA1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0", type: "deposit", skillName: "USDT Deposit", amount: 1000.00, fee: 0, devPayout: 0, status: "completed", createdAt: "2026-07-09T19:00:00Z" },
  ];
  sessionStorage.setItem("aims_admin_transactions", JSON.stringify(defaults));
  return defaults;
}

export default function TransactionsPage() {
  const t = useTranslations("AdminPage");
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => { setTxs(loadTransactions()); }, []);

  const filtered = txs.filter((tx) => {
    if (filter !== "all" && tx.type !== filter) return false;
    if (search && !tx.userWallet.toLowerCase().includes(search.toLowerCase()) && !tx.skillName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalVolume = filtered.reduce((s, tx) => tx.status === "completed" ? s + tx.amount : s, 0);
  const totalFees = filtered.reduce((s, tx) => tx.status === "completed" ? s + tx.fee : s, 0);

  const typeBadge = (type: string) => {
    const map: Record<string, string> = {
      buyout: "badge badge-yellow",
      subscription: "badge badge-blue",
      per_call: "badge badge-green",
      alliance: "badge",
      deposit: "badge badge-green",
      withdrawal: "badge badge-red",
    };
    return map[type] || "badge badge-muted";
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      completed: "badge badge-green",
      pending: "badge badge-yellow",
      failed: "badge badge-red",
    };
    return map[status] || "badge badge-muted";
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 4px" }}>{t("transactions")}</h1>
          <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>{t("transactionsDesc")}</p>
        </div>
        <button className="btn-secondary" style={{ height: 36, fontSize: 12 }}
          onClick={() => {
            const csv = "id,user,type,skill,amount,fee,dev_payout,status,time\n" +
              txs.map(tx => `${tx.id},${tx.userWallet},${tx.type},${tx.skillName},${tx.amount},${tx.fee},${tx.devPayout},${tx.status},${tx.createdAt}`).join("\n");
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = "transactions.csv"; a.click();
          }}>
          {t("exportCsv")}
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        <div className="card-dark" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>{t("totalVolume")}</div>
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "monospace", color: "var(--primary)" }}>${totalVolume.toLocaleString()}</div>
        </div>
        <div className="card-dark" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>{t("platformFees")}</div>
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "monospace", color: "var(--trading-up)" }}>${totalFees.toLocaleString()}</div>
        </div>
        <div className="card-dark" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>{t("totalTransactions")}</div>
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "monospace" }}>{filtered.length}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <input className="input-dark" placeholder={t("searchWalletOrSkill")} value={search}
          onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, maxWidth: 300 }} />
        <select className="input-dark" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: 160 }}>
          <option value="all">{t("allTypes")}</option>
          <option value="buyout">{t("buyout")}</option>
          <option value="subscription">{t("subscription")}</option>
          <option value="per_call">{t("perCall")}</option>
          <option value="alliance">{t("alliance")}</option>
          <option value="deposit">{t("deposit")}</option>
          <option value="withdrawal">{t("withdrawal")}</option>
        </select>
      </div>

      {/* Table */}
      <div className="card-dark" style={{ overflow: "auto" }}>
        <table className="table-dark">
          <thead>
            <tr>
              <th>{t("txId")}</th>
              <th>{t("user")}</th>
              <th>{t("type")}</th>
              <th>{t("skill")}</th>
              <th>{t("amount")}</th>
              <th>{t("fee")}</th>
              <th>{t("devPayout")}</th>
              <th>{t("status")}</th>
              <th>{t("time")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((tx) => (
              <tr key={tx.id}>
                <td style={{ fontFamily: "monospace", fontSize: 12 }}>{tx.id}</td>
                <td style={{ fontFamily: "monospace", fontSize: 11, color: "var(--muted)" }}>{tx.userWallet.slice(0, 10)}...</td>
                <td><span className={typeBadge(tx.type)} style={{ fontSize: 10 }}>{tx.type === "per_call" ? t("perCall") : t(tx.type as "buyout" | "subscription" | "alliance" | "deposit" | "withdrawal")}</span></td>
                <td style={{ fontSize: 13, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.skillName}</td>
                <td style={{ fontFamily: "monospace", fontSize: 13 }}>${tx.amount.toFixed(2)}</td>
                <td style={{ fontFamily: "monospace", fontSize: 12, color: "var(--trading-down)" }}>${tx.fee.toFixed(2)}</td>
                <td style={{ fontFamily: "monospace", fontSize: 12, color: "var(--trading-up)" }}>${tx.devPayout.toFixed(2)}</td>
                <td><span className={statusBadge(tx.status)} style={{ fontSize: 10 }}>{t(tx.status)}</span></td>
                <td style={{ fontSize: 11, color: "var(--muted)" }}>{new Date(tx.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
