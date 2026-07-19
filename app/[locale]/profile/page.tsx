"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

interface ContactMethod {
  type: "email" | "whatsapp" | "telegram" | "wechat" | "discord" | "website";
  value: string;
}

const CONTACT_OPTIONS = [
  { key: "email" as const, icon: "📧", labelKey: "email", placeholderKey: "emailPlaceholder" },
  { key: "whatsapp" as const, icon: "💬", labelKey: "whatsapp", placeholderKey: "whatsappPlaceholder" },
  { key: "telegram" as const, icon: "✈️", labelKey: "telegram", placeholderKey: "telegramPlaceholder" },
  { key: "wechat" as const, icon: "💚", labelKey: "wechat", placeholderKey: "wechatPlaceholder" },
  { key: "discord" as const, icon: "🎮", labelKey: "discord", placeholderKey: "discordPlaceholder" },
  { key: "website" as const, icon: "🌐", labelKey: "website", placeholderKey: "websitePlaceholder" },
];

const SETTINGS_KEY = "aims_profile_settings";

function loadSettings(): { name: string; contacts: ContactMethod[]; displayPreference: "name" | "address" } | null {
  try {
    const raw = sessionStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveSettings(data: { name: string; contacts: ContactMethod[]; displayPreference: "name" | "address" }) {
  sessionStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
}

interface ApiKey {
  key_id: string;
  key_prefix: string;
  tier: string;
  label: string;
  created_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const t = useTranslations("ProfilePage");
  const common = useTranslations("Common");
  const [wallet, setWallet] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Editable state
  const [displayName, setDisplayName] = useState("");
  const [contacts, setContacts] = useState<ContactMethod[]>([]);
  const [newContactType, setNewContactType] = useState<ContactMethod["type"]>("email");
  const [newContactValue, setNewContactValue] = useState("");
  const [saved, setSaved] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [displayPreference, setDisplayPreference] = useState<"name" | "address">("name");

  // API keys
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [keysLoading, setKeysLoading] = useState(false);
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);

  useEffect(() => {
    const w = sessionStorage.getItem("aims_wallet");
    if (!w) { router.push("/login"); return; }
    setWallet(w);

    // Load saved settings
    const saved = loadSettings();
    if (saved) {
      setDisplayName(saved.name || "");
      setContacts(saved.contacts || []);
      if (saved.displayPreference) setDisplayPreference(saved.displayPreference);
    }
    setLoading(false);

    // Fetch API keys
    fetchApiKeys();
  }, [router]);

  const fetchApiKeys = () => {
    const token = sessionStorage.getItem("aims_token");
    if (!token) return;
    setKeysLoading(true);
    fetch("/api/v2/developer/keys", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("fetch_error");
        return res.json();
      })
      .then((data) => {
        setApiKeys(data.items || []);
        setKeysLoading(false);
      })
      .catch(() => setKeysLoading(false));
  };

  const handleSave = () => {
    saveSettings({ name: displayName, contacts, displayPreference });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const addContact = () => {
    if (!newContactValue.trim()) return;
    setContacts((prev) => [...prev, { type: newContactType, value: newContactValue.trim() }]);
    setNewContactValue("");
  };

  const removeContact = (idx: number) => {
    setContacts((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDisconnect = () => {
    sessionStorage.removeItem("aims_token");
    sessionStorage.removeItem("aims_wallet");
    router.push("/login");
  };

  const handleGenerateKey = async () => {
    const token = sessionStorage.getItem("aims_token");
    if (!token || !newKeyLabel.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/v2/developer/keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tier: "basic", label: newKeyLabel.trim() }),
      });
      if (!res.ok) throw new Error("generate_error");
      const data = await res.json();
      setGeneratedKey(data.api_key);
      setNewKeyLabel("");
      fetchApiKeys();
    } catch {} finally {
      setGenerating(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    const token = sessionStorage.getItem("aims_token");
    if (!token) return;
    try {
      const res = await fetch(`/api/v2/developer/keys/${encodeURIComponent(keyId)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setApiKeys((prev) => prev.filter((k) => k.key_id !== keyId));
      }
    } catch {}
  };

  if (loading || !wallet) return <div style={{ padding: 80, textAlign: "center", color: "var(--muted)" }}>{common("loading")}</div>;

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 24px" }}>{t("myProfile")}</h1>

      {/* ── Personal Info ── */}
      <div className="card-dark" style={{ marginBottom: 24, padding: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 4px" }}>{t("personalInfo")}</h2>
        <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 20px" }}>{t("personalInfoDesc")}</p>

        {/* Avatar + Name */}
        <div style={{ display: "flex", gap: 16, alignItems: "flex-end", marginBottom: 20 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 32, flexShrink: 0,
            background: "linear-gradient(135deg, var(--primary), #f0b90b)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, fontWeight: 700, color: "var(--on-primary)",
          }}>
            {displayName ? displayName.charAt(0).toUpperCase() : wallet.slice(2, 4).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>{t("displayName")}</label>
            <input
              className="input-dark"
              style={{ height: 42, fontSize: 15, width: "100%" }}
              placeholder={t("displayNamePlaceholder")}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4 }}>{t("displayNameHint")}</div>
          </div>
        </div>

        {/* Wallet address */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("walletAddress")}</div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <code style={{
              flex: 1, padding: "10px 14px", background: "var(--canvas-dark)", borderRadius: 6,
              fontFamily: "monospace", fontSize: 13, color: "var(--body)", wordBreak: "break-all",
            }}>
              {wallet}
            </code>
            <button
              className="btn-secondary"
              style={{ height: 36, fontSize: 12, whiteSpace: "nowrap" }}
              onClick={() => setShowDisconnectConfirm(true)}
            >
              {t("changeWallet")}
            </button>
          </div>
          <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4 }}>{t("changeWalletDesc")}</div>
        </div>

        {/* Display Preference Toggle */}
        <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--hairline-on-dark)" }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{t("displayPreference")}</div>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 12px" }}>{t("displayPreferenceDesc")}</p>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={() => setDisplayPreference("name")}
              style={{
                flex: 1, padding: "10px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                border: displayPreference === "name" ? "2px solid var(--primary)" : "2px solid var(--hairline-on-dark)",
                background: displayPreference === "name" ? "rgba(252,213,53,0.08)" : "transparent",
                color: displayPreference === "name" ? "var(--primary)" : "var(--muted)",
                cursor: "pointer",
              }}
            >
              {t("showName")}
            </button>
            <button
              onClick={() => setDisplayPreference("address")}
              style={{
                flex: 1, padding: "10px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                border: displayPreference === "address" ? "2px solid var(--primary)" : "2px solid var(--hairline-on-dark)",
                background: displayPreference === "address" ? "rgba(252,213,53,0.08)" : "transparent",
                color: displayPreference === "address" ? "var(--primary)" : "var(--muted)",
                cursor: "pointer",
              }}
            >
              {t("showAddress")}
            </button>
          </div>
        </div>
      </div>

      {/* ── Contact Info ── */}
      <div className="card-dark" style={{ marginBottom: 24, padding: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 4px" }}>{t("contactInfo")}</h2>
        <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 20px" }}>{t("contactInfoDesc")}</p>

        {/* Existing contacts */}
        {contacts.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            {contacts.map((c, i) => {
              const opt = CONTACT_OPTIONS.find((o) => o.key === c.type);
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 0",
                  borderBottom: "1px solid var(--hairline-on-dark)",
                }}>
                  <span style={{ fontSize: 16 }}>{opt?.icon}</span>
                  <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500, minWidth: 80 }}>
                    {opt ? t(opt.labelKey as any) : c.type}
                  </span>
                  <span style={{ flex: 1, fontSize: 13 }}>{c.value}</span>
                  <button
                    className="btn-secondary"
                    style={{ height: 26, fontSize: 10, color: "var(--trading-down)" }}
                    onClick={() => removeContact(i)}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Add new contact */}
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <div style={{ minWidth: 130 }}>
            <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>{t("addContact")}</label>
            <select
              className="input-dark"
              style={{ height: 38, fontSize: 12, width: "100%" }}
              value={newContactType}
              onChange={(e) => setNewContactType(e.target.value as ContactMethod["type"])}
              data-testid="contact-type-select"
            >
              {CONTACT_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>{opt.icon} {t(opt.labelKey as any)}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <input
              className="input-dark"
              style={{ height: 38, fontSize: 13, width: "100%" }}
              placeholder={t(CONTACT_OPTIONS.find((o) => o.key === newContactType)!.placeholderKey as any)}
              value={newContactValue}
              onChange={(e) => setNewContactValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addContact(); }}
              data-testid="contact-value-input"
            />
          </div>
          <button className="btn-primary" style={{ height: 38, fontSize: 12, whiteSpace: "nowrap" }} onClick={addContact}>
            {t("addContact")}
          </button>
        </div>
      </div>

      {/* ── Save ── */}
      <div style={{ marginBottom: 32 }}>
        <button className="btn-primary" style={{ height: 44, fontSize: 14, width: "100%" }} onClick={handleSave}>
          {saved ? `✓ ${t("settingsSaved")}` : t("saveSettings")}
        </button>
      </div>

      {/* ── Public Profile Preview ── */}
      <div className="card-dark" style={{ marginBottom: 24, padding: 24, border: "1px dashed var(--hairline-on-dark)" }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 4px" }}>{t("publicProfile")}</h3>
        <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 16px" }}>{t("publicProfileDesc")}</p>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 24, flexShrink: 0,
            background: "linear-gradient(135deg, var(--primary), #f0b90b)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 700, color: "var(--on-primary)",
          }}>
            {displayName ? displayName.charAt(0).toUpperCase() : wallet.slice(2, 4).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{displayPreference === "name" ? (displayName || "Anonymous Developer") : `${wallet.slice(0, 10)}...${wallet.slice(-6)}`}</div>
            <div style={{ fontFamily: "monospace", fontSize: 11, color: "var(--muted)" }}>{displayPreference === "address" ? (displayName || "Anonymous Developer") : `${wallet.slice(0, 10)}...${wallet.slice(-6)}`}</div>
          </div>
        </div>

        {contacts.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {contacts.map((c, i) => {
              const opt = CONTACT_OPTIONS.find((o) => o.key === c.type);
              return (
                <span key={i} style={{
                  padding: "4px 10px", borderRadius: 9999, fontSize: 11,
                  background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)",
                  color: "var(--body)", display: "flex", alignItems: "center", gap: 4,
                }}>
                  {opt?.icon} {c.value}
                </span>
              );
            })}
          </div>
        )}

        {contacts.length === 0 && (
          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            No contact methods added yet. Add contacts above to be visible.
          </div>
        )}
      </div>

      {/* ── API Keys ── */}
      <div className="card-dark" style={{ marginBottom: 24, padding: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 4px" }}>{t("apiKeys")}</h2>
        <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 20px" }}>{t("apiKeysDesc")}</p>

        {/* Existing keys */}
        {keysLoading ? (
          <div style={{ fontSize: 13, color: "var(--muted)", padding: "12px 0" }}>{common("loading")}...</div>
        ) : apiKeys.length > 0 ? (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 80px", gap: 8, fontSize: 11, color: "var(--muted)", marginBottom: 8, padding: "0 8px" }}>
              <div>{t("keyLabel")}</div>
              <div>{t("keyPrefix")}</div>
              <div>{t("keyCreated")}</div>
              <div></div>
            </div>
            {apiKeys.map((key) => (
              <div key={key.key_id} style={{
                display: "grid", gridTemplateColumns: "2fr 1fr 1fr 80px", gap: 8, alignItems: "center",
                padding: "10px 8px", borderBottom: "1px solid var(--hairline-on-dark)",
                fontSize: 12,
              }}>
                <div style={{ fontWeight: 500 }}>{key.label || key.tier}</div>
                <div style={{ fontFamily: "monospace", color: "var(--muted)" }}>{key.key_prefix}...</div>
                <div style={{ color: "var(--muted)", fontSize: 11 }}>{key.created_at ? new Date(key.created_at).toISOString().slice(0, 10) : "-"}</div>
                <button
                  className="btn-secondary"
                  style={{ height: 26, fontSize: 10, color: "var(--trading-down)" }}
                  onClick={() => handleRevokeKey(key.key_id)}
                >
                  {t("revoke")}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: "var(--muted)", padding: "12px 0", marginBottom: 20 }}>{t("noKeys")}</div>
        )}

        {/* Generate new key */}
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>{t("keyLabel")}</label>
            <input
              className="input-dark"
              style={{ height: 38, fontSize: 13, width: "100%" }}
              placeholder={t("keyLabelPlaceholder")}
              value={newKeyLabel}
              onChange={(e) => setNewKeyLabel(e.target.value)}
            />
          </div>
          <button
            className="btn-primary"
            style={{ height: 38, fontSize: 12, whiteSpace: "nowrap" }}
            onClick={handleGenerateKey}
            disabled={generating || !newKeyLabel.trim()}
          >
            {generating ? common("loading") + "..." : t("generateKey")}
          </button>
        </div>
      </div>

      {/* ── New Key Modal ── */}
      {generatedKey && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="card-dark" style={{ maxWidth: 480, width: "100%", padding: 28 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>{t("newKeyGenerated")}</h3>
            <p style={{ fontSize: 12, color: "var(--trading-down)", margin: "0 0 16px" }}>{t("copyKeyWarning")}</p>
            <div style={{
              padding: 14, background: "var(--canvas-dark)", borderRadius: 8,
              fontFamily: "monospace", fontSize: 12, wordBreak: "break-all",
              marginBottom: 16, border: "1px solid var(--hairline-on-dark)",
            }}>
              {generatedKey}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                className="btn-primary"
                style={{ flex: 1, height: 40 }}
                onClick={() => {
                  navigator.clipboard.writeText(generatedKey);
                  setKeyCopied(true);
                  setTimeout(() => setKeyCopied(false), 2000);
                }}
              >
                {keyCopied ? t("keyCopied") : t("copyKey")}
              </button>
              <button
                className="btn-secondary"
                style={{ flex: 1, height: 40 }}
                onClick={() => { setGeneratedKey(null); setKeyCopied(false); }}
              >
                {t("close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Disconnect Confirm Modal ── */}
      {showDisconnectConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="card-dark" style={{ maxWidth: 400, width: "100%", padding: 28 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>{t("changeWallet")}</h3>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 20px", lineHeight: 1.6 }}>
              {t("changeWalletDesc")}
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn-secondary" style={{ flex: 1, height: 40 }} onClick={() => setShowDisconnectConfirm(false)}>
                {common("cancel")}
              </button>
              <button className="btn-primary" style={{ flex: 1, height: 40, background: "var(--trading-down)" }} onClick={handleDisconnect}>
                {t("disconnectWallet")}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
