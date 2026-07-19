"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface Section {
  id: string;
  name: string;
  description: string;
  parentModule: string;
  assignedTo: string;
  assignedName: string;
  permission: "view" | "edit" | "approve";
  status: "active" | "pending_review" | "revoked";
  createdAt: string;
  pendingChanges: number;
}

interface DelegationLog {
  id: string;
  sectionId: string;
  sectionName: string;
  action: string;
  by: string;
  detail: string;
  time: string;
}

function loadSections(): Section[] {
  if (typeof window === "undefined") return [];
  const raw = sessionStorage.getItem("aims_admin_sections");
  if (raw) return JSON.parse(raw);
  const defaults: Section[] = [
    { id: "sec-1", name: "LLM Inference板块", description: "LLM推理类技能的审核与上架", parentModule: "marketplace", assignedTo: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", assignedName: "Alice (核心开发者)", permission: "approve", status: "active", createdAt: "2026-07-01", pendingChanges: 3 },
    { id: "sec-2", name: "Image Gen板块", description: "图像生成技能的品控与定价审核", parentModule: "marketplace", assignedTo: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", assignedName: "Bob (设计师)", permission: "edit", status: "active", createdAt: "2026-07-03", pendingChanges: 0 },
    { id: "sec-3", name: "论坛技术区", description: "技术讨论区的帖子审核与分类", parentModule: "forum", assignedTo: "", assignedName: "", permission: "edit", status: "pending_review", createdAt: "2026-07-08", pendingChanges: 0 },
    { id: "sec-4", name: "API接入审核", description: "新API Provider接入的初审", parentModule: "api_config", assignedTo: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", assignedName: "Charlie (后端工程师)", permission: "view", status: "active", createdAt: "2026-07-05", pendingChanges: 7 },
  ];
  sessionStorage.setItem("aims_admin_sections", JSON.stringify(defaults));
  return defaults;
}

function loadDelegationLogs(): DelegationLog[] {
  if (typeof window === "undefined") return [];
  const raw = sessionStorage.getItem("aims_admin_delegation_logs");
  if (raw) return JSON.parse(raw);
  const defaults: DelegationLog[] = [
    { id: "log-1", sectionId: "sec-1", sectionName: "LLM Inference板块", action: "approve", by: "Alice", detail: "批准了 3 个新技能上架", time: "2026-07-10 08:30" },
    { id: "log-2", sectionId: "sec-4", sectionName: "API接入审核", action: "review", by: "Charlie", detail: "提交了 DeepSeek API 接入审核报告", time: "2026-07-10 07:15" },
    { id: "log-3", sectionId: "sec-1", sectionName: "LLM Inference板块", action: "edit", by: "Alice", detail: "修改了 LLaMA 3.1 的定价参数", time: "2026-07-09 22:00" },
    { id: "log-4", sectionId: "sec-2", sectionName: "Image Gen板块", action: "review", by: "Bob", detail: "新增 SDXL 模型变体", time: "2026-07-09 18:45" },
  ];
  sessionStorage.setItem("aims_admin_delegation_logs", JSON.stringify(defaults));
  return defaults;
}

export default function DelegationPage() {
  const t = useTranslations("AdminPage");
  const [sections, setSections] = useState<Section[]>([]);
  const [logs, setLogs] = useState<DelegationLog[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", parentModule: "marketplace", assignedTo: "", assignedName: "", permission: "edit" as "view" | "edit" | "approve" });

  useEffect(() => {
    setSections(loadSections());
    setLogs(loadDelegationLogs());
  }, []);

  const persistSections = (s: Section[]) => { sessionStorage.setItem("aims_admin_sections", JSON.stringify(s)); setSections(s); };
  const persistLogs = (l: DelegationLog[]) => { sessionStorage.setItem("aims_admin_delegation_logs", JSON.stringify(l)); setLogs(l); };

  const addSection = () => {
    if (!form.name) return;
    const newSec: Section = {
      id: "sec-" + Date.now(),
      ...form,
      status: "active",
      createdAt: new Date().toISOString().slice(0, 10),
      pendingChanges: 0,
    };
    persistSections([...sections, newSec]);
    persistLogs([...logs, {
      id: "log-" + Date.now(),
      sectionId: newSec.id,
      sectionName: newSec.name,
      action: "created",
      by: "Admin",
      detail: t("sectionCreated"),
      time: new Date().toLocaleString(),
    }]);
    setShowAdd(false);
    setForm({ name: "", description: "", parentModule: "marketplace", assignedTo: "", assignedName: "", permission: "edit" });
  };

  const revokeSection = (id: string) => {
    const sec = sections.find(s => s.id === id);
    persistSections(sections.map(s => s.id === id ? { ...s, status: "revoked" as const } : s));
    if (sec) {
      persistLogs([...logs, {
        id: "log-" + Date.now(),
        sectionId: id,
        sectionName: sec.name,
        action: "revoked",
        by: "Admin",
        detail: t("sectionRevoked"),
        time: new Date().toLocaleString(),
      }]);
    }
  };

  const approveSection = (id: string) => {
    const sec = sections.find(s => s.id === id);
    persistSections(sections.map(s => s.id === id ? { ...s, status: "active" as const } : s));
    if (sec) {
      persistLogs([...logs, {
        id: "log-" + Date.now(),
        sectionId: id,
        sectionName: sec.name,
        action: "approved",
        by: "Admin",
        detail: t("sectionApproved"),
        time: new Date().toLocaleString(),
      }]);
    }
  };

  const modules = ["marketplace", "forum", "api_config", "pricing", "workers", "ip_vault"];

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { active: "badge badge-green", pending_review: "badge badge-yellow", revoked: "badge badge-red" };
    return map[s] || "badge badge-muted";
  };

  const permBadge = (p: string) => {
    const map: Record<string, string> = { view: "badge badge-muted", edit: "badge badge-yellow", approve: "badge badge-green" };
    return map[p] || "badge badge-muted";
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 4px" }}>{t("delegation")}</h1>
          <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>{t("delegationDesc")}</p>
        </div>
        <button className="btn-primary" style={{ height: 40, padding: "0 20px" }}
          onClick={() => setShowAdd(true)}>+ {t("addSection")}</button>
      </div>

      {/* Add section modal */}
      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
          <div className="card-dark" style={{ width: 520, padding: 28 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 20px" }}>{t("addSection")}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>{t("sectionName")}</label>
                <input className="input-dark" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={t("sectionNamePlaceholder")} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>{t("description")}</label>
                <textarea className="input-dark" rows={2} value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ resize: "vertical" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>{t("parentModule")}</label>
                  <select className="input-dark" value={form.parentModule}
                    onChange={(e) => setForm({ ...form, parentModule: e.target.value })}>
                    {modules.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>{t("permission")}</label>
                  <select className="input-dark" value={form.permission}
                    onChange={(e) => setForm({ ...form, permission: e.target.value as "view" | "edit" | "approve" })}>
                    <option value="view">{t("permView")} — {t("permViewDesc")}</option>
                    <option value="edit">{t("permEdit")} — {t("permEditDesc")}</option>
                    <option value="approve">{t("permApprove")} — {t("permApproveDesc")}</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>{t("assignedWallet")}</label>
                  <input className="input-dark" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                    placeholder="0x..." style={{ fontFamily: "monospace" }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>{t("assignedName")}</label>
                  <input className="input-dark" value={form.assignedName} onChange={(e) => setForm({ ...form, assignedName: e.target.value })}
                    placeholder={t("assignedNamePlaceholder")} />
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 20, justifyContent: "flex-end" }}>
              <button className="btn-secondary" onClick={() => setShowAdd(false)}>{t("cancel")}</button>
              <button className="btn-primary" onClick={addSection}>{t("addSection")}</button>
            </div>
          </div>
        </div>
      )}

      {/* Sections grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 16, marginBottom: 32 }}>
        {sections.map((sec) => (
          <div key={sec.id} className="card-dark" style={{ padding: 20, borderLeft: sec.status === "active" ? "3px solid var(--trading-up)" : sec.status === "pending_review" ? "3px solid var(--primary)" : "3px solid var(--trading-down)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>{sec.name}</div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>{sec.parentModule} · {t("created")} {sec.createdAt}</div>
              </div>
              <span className={statusBadge(sec.status)} style={{ fontSize: 10 }}>{t(sec.status)}</span>
            </div>
            <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 12px", lineHeight: 1.5 }}>{sec.description}</p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}>
                {sec.assignedName || t("unassigned")}
              </span>
              {sec.assignedTo && (
                <span style={{ fontSize: 10, fontFamily: "monospace", padding: "2px 8px", borderRadius: 4, background: "rgba(112,122,138,0.1)", color: "var(--muted)" }}>
                  {sec.assignedTo.slice(0, 8)}...
                </span>
              )}
              <span className={permBadge(sec.permission)} style={{ fontSize: 10 }}>{sec.permission === "view" ? t("permView") : sec.permission === "edit" ? t("permEdit") : t("permApprove")}</span>
            </div>

            {sec.pendingChanges > 0 && (
              <div style={{ fontSize: 11, color: "var(--primary)", marginBottom: 10, padding: "6px 10px", borderRadius: 4, background: "rgba(252,213,53,0.06)" }}>
                ⚡ {sec.pendingChanges} {t("pendingChanges")}
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              {sec.status === "pending_review" && (
                <button className="btn-primary" style={{ height: 28, fontSize: 11 }} onClick={() => approveSection(sec.id)}>
                  ✓ {t("approve")}
                </button>
              )}
              {sec.status === "active" && (
                <button className="btn-secondary" style={{ height: 28, fontSize: 11, color: "var(--trading-down)" }}
                  onClick={() => revokeSection(sec.id)}>
                  {t("revoke")}
                </button>
              )}
              {sec.status === "revoked" && (
                <button className="btn-secondary" style={{ height: 28, fontSize: 11 }}
                  onClick={() => approveSection(sec.id)}>
                  {t("restore")}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Delegation activity log */}
      <div className="card-dark" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px" }}>{t("delegationActivityLog")}</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {logs.slice(0, 10).map((l) => (
            <div key={l.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--hairline-on-dark)", fontSize: 13 }}>
              <div>
                <span style={{ fontWeight: 600 }}>{l.sectionName}</span>
                <span style={{ margin: "0 6px", color: "var(--muted)" }}>·</span>
                <span style={{ color: "var(--muted)" }}>{l.detail}</span>
              </div>
              <span style={{ fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap", marginLeft: 12 }}>{l.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
