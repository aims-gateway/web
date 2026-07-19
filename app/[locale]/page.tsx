"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

const iconMap: Record<string, string> = {
  key: "🔑", shield: "🛡", gavel: "⚖", route: "🔀", toggle: "🔘", tag: "🏷",
};

const MCP_URL = "https://api.aimsgateway.com/mcp";

export default function HomePage() {
  const t = useTranslations("HomePage");
  const router = useRouter();
  const [copiedTool, setCopiedTool] = useState<string | null>(null);

  const protectItems = Array.from({ length: 6 }, (_, i) => ({
    title: t(`protectItems.${i}.title`),
    desc: t(`protectItems.${i}.desc`),
    icon: t(`protectItems.${i}.icon`),
  }));
  const steps = Array.from({ length: 4 }, (_, i) => ({
    step: `0${i + 1}`,
    title: t(`steps.${i}.title`),
    desc: t(`steps.${i}.desc`),
  }));
  const requirements = Array.from({ length: 4 }, (_, i) => ({
    title: t(`requirements.${i}.title`),
    desc: t(`requirements.${i}.desc`),
  }));
  const localDevItems = Array.from({ length: 3 }, (_, i) => ({
    title: t(`localDevItems.${i}.title`),
    desc: t(`localDevItems.${i}.desc`),
  }));
  const skillCategories = Array.from({ length: 6 }, (_, i) => ({
    key: t(`skillCategories.${i}.key`),
    name: t(`skillCategories.${i}.name`),
    desc: t(`skillCategories.${i}.desc`),
    icon: t(`skillCategories.${i}.icon`),
  }));
  const tokenItems = Array.from({ length: 3 }, (_, i) => ({
    title: t(`tokenProgramItems.${i}.title`),
    desc: t(`tokenProgramItems.${i}.desc`),
  }));
  const builderItems = Array.from({ length: 3 }, (_, i) => ({
    title: t(`marketBuilderItems.${i}.title`),
    desc: t(`marketBuilderItems.${i}.desc`),
  }));

  const stats = Array.from({ length: 4 }, (_, i) => ({
    value: t(`stats.${i}.value`),
    label: t(`stats.${i}.label`),
  }));
  const trustItems = Array.from({ length: 3 }, (_, i) => ({
    value: t(`trustItems.${i}.value`),
    label: t(`trustItems.${i}.label`),
  }));

  const sectionStyle: React.CSSProperties = { maxWidth: 1100, margin: "0 auto", padding: "80px 24px" };
  const sectionTitle: React.CSSProperties = { fontSize: 32, fontWeight: 700, textAlign: "center", margin: "0 0 12px" };
  const sectionDesc: React.CSSProperties = { fontSize: 15, color: "var(--muted)", textAlign: "center", maxWidth: 640, margin: "0 auto 48px", lineHeight: 1.6 };

  const handleCopyMCP = () => {
    navigator.clipboard.writeText(MCP_URL);
    setCopiedTool("all");
    setTimeout(() => setCopiedTool(null), 2000);
  };

  return (
    <main>
      {/* ═══ Hero ═══ */}
      <section style={{ padding: "80px 24px 60px", textAlign: "center", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 9999, border: "1px solid rgba(252,213,53,0.25)", background: "rgba(252,213,53,0.08)", padding: "6px 16px", fontSize: 13, color: "var(--primary)", marginBottom: 32 }}>
          <span style={{ width: 8, height: 8, borderRadius: 4, background: "var(--primary)", display: "inline-block" }} />
          {t("badge")}
        </div>

        <h1 style={{ fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 700, lineHeight: 1.12, letterSpacing: "-1px", margin: "0 0 16px" }}>
          <span style={{ color: "var(--primary)" }}>{t("heroTitle1")}</span>
          <br />
          <span style={{ color: "var(--on-dark)" }}>{t("heroTitle2")}</span>
        </h1>

        <p style={{ fontSize: 16, color: "var(--muted-strong)", margin: "0 0 8px", fontStyle: "italic" }}>
          {t("heroSubtitle")}
        </p>

        <p style={{ fontSize: 15, color: "var(--muted)", maxWidth: 600, margin: "0 auto 36px", lineHeight: 1.65 }}>
          {t("heroDesc")}
        </p>

        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn-primary-pill" onClick={() => router.push("/login")} style={{ fontSize: 15, padding: "14px 32px" }}>
            {t("ctaActivate")}
          </button>
          <button className="btn-secondary" onClick={() => router.push("/marketplace")} style={{ fontSize: 15, padding: "14px 32px" }}>
            {t("ctaLearnMore")}
          </button>
        </div>
      </section>

      {/* ═══ Stat Row ═══ */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, maxWidth: 900, margin: "0 auto 40px", padding: "0 24px" }}>
        {stats.map((s) => (
          <div className="card-dark" style={{ textAlign: "center" }} key={s.label}>
            <div className="stat-number">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </section>

      {/* ═══ Developer Protection ═══ */}
      <section style={{ ...sectionStyle, paddingTop: 60 }}>
        <h2 style={sectionTitle}>{t("protectTitle")}</h2>
        <p style={sectionDesc}>{t("protectDesc")}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {protectItems.map((item) => (
            <div className="card-dark" key={item.title} style={{ padding: "24px 20px" }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{iconMap[item.icon] || "▪"}</div>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px" }}>{item.title}</h3>
              <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ How It Works ═══ */}
      <section style={{ ...sectionStyle, background: "var(--surface-card-dark)" }}>
        <h2 style={sectionTitle}>{t("howItWorks")}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginTop: 40 }}>
          {steps.map((item, i) => (
            <div className="card-dark" key={item.step} style={{ textAlign: "center", padding: "28px 18px", position: "relative" }}>
              <div style={{ fontSize: 40, fontWeight: 700, color: "var(--primary)", marginBottom: 12, fontFamily: "monospace" }}>{item.step}</div>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 8px" }}>{item.title}</h3>
              <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.55, margin: 0 }}>{item.desc}</p>
              {i < 3 && (
                <div style={{ position: "absolute", right: -12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", fontSize: 20, display: "none" /* hide on mobile */ }}>→</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ═══ Skill Requirements ═══ */}
      <section style={sectionStyle}>
        <h2 style={sectionTitle}>{t("requirementsTitle")}</h2>
        <p style={sectionDesc}>{t("requirementsDesc")}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
          {requirements.map((r, i) => (
            <div className="card-dark" key={r.title} style={{ padding: "22px 24px", display: "flex", gap: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(59,130,246,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#3b82f6", flexShrink: 0 }}>
                {i + 1}
              </div>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 6px" }}>{r.title}</h3>
                <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.55, margin: 0 }}>{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ One Skill, All Your Needs ═══ */}
      <section style={{ ...sectionStyle, background: "var(--surface-card-dark)" }}>
        <h2 style={sectionTitle}>{t("localDevTitle")}</h2>
        <p style={sectionDesc}>{t("localDevDesc")}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {localDevItems.map((item, i) => (
            <div className="card-dark" key={item.title} style={{ textAlign: "center", padding: "28px 20px" }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(59,130,246,0.1)", margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                {["📅", "💎", "🤝"][i]}
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 8px" }}>{item.title}</h3>
              <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.55, margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ Skill Categories ═══ */}
      <section style={sectionStyle}>
        <h2 style={sectionTitle}>{t("skillCategoriesTitle")}</h2>
        <p style={sectionDesc}>{t("skillCategoriesDesc")}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {skillCategories.map((cat) => (
            <div className="card-dark" key={cat.key} style={{ padding: "22px 24px", cursor: "pointer" }}
              onClick={() => router.push(`/marketplace?category_id=${cat.key}`)}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <span style={{ fontSize: 28 }}>{cat.icon}</span>
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{cat.name}</h3>
              </div>
              <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.55, margin: "0 0 10px" }}>{cat.desc}</p>
              <span style={{ fontSize: 12, color: "var(--primary)", fontWeight: 600 }}>
                {t("viewCategory", { name: cat.name })}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ aims-skill MCP ═══ */}
      <section style={{ ...sectionStyle, background: "var(--surface-card-dark)" }}>
        <h2 style={sectionTitle}>{t("mcp.title")}</h2>
        <p style={sectionDesc}>{t("mcp.desc")}</p>

        {/* Unified MCP address card */}
        <div style={{ maxWidth: 520, margin: "0 auto 48px" }}>
          <div className="card-dark" style={{ padding: "28px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔌</div>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 4px" }}>{t("mcp.cardTitle")}</h3>
            <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 16px", lineHeight: 1.5 }}>
              {t("mcp.cardDesc")}
            </p>
            <div style={{ display: "flex", gap: 8, alignItems: "stretch", maxWidth: 400, margin: "0 auto" }}>
              <code style={{ flex: 1, padding: "10px 14px", borderRadius: 8, background: "rgba(0,0,0,0.35)", fontSize: 12, fontFamily: "monospace", color: "var(--trading-up)", overflowX: "auto", whiteSpace: "nowrap", letterSpacing: "0.2px", display: "flex", alignItems: "center", textAlign: "left" }}>
                {MCP_URL}
              </code>
              <button className="btn-primary" style={{ height: 38, fontSize: 12, padding: "0 18px", whiteSpace: "nowrap", flexShrink: 0 }}
                onClick={() => handleCopyMCP()}>
                {copiedTool === "all" ? "✓" : t("mcp.copy")}
              </button>
            </div>
          </div>
        </div>

        {/* User path cards */}
        <h3 style={{ fontSize: 18, fontWeight: 600, textAlign: "center", margin: "0 0 24px" }}>{t("mcp.pathsTitle")}</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, maxWidth: 900, margin: "0 auto" }}>
          <div className="card-dark" style={{ padding: "22px 20px", borderTop: "3px solid var(--primary)" }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>🔑</div>
            <h4 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 6px" }}>{t("mcp.pathA.title")}</h4>
            <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>{t("mcp.pathA.desc")}</p>
            <button className="btn-secondary" style={{ marginTop: 12, fontSize: 12, padding: "6px 14px" }}
              onClick={() => router.push("/login")}>
              {t("mcp.pathA.cta")}
            </button>
          </div>
          <div className="card-dark" style={{ padding: "22px 20px", borderTop: "3px solid var(--trading-up)" }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>✨</div>
            <h4 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 6px" }}>{t("mcp.pathB.title")}</h4>
            <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>{t("mcp.pathB.desc")}</p>
            <button className="btn-secondary" style={{ marginTop: 12, fontSize: 12, padding: "6px 14px" }}
              onClick={() => router.push("/login")}>
              {t("mcp.pathB.cta")}
            </button>
          </div>
          <div className="card-dark" style={{ padding: "22px 20px", borderTop: "3px solid rgba(59,130,246,0.6)" }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>👛</div>
            <h4 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 6px" }}>{t("mcp.pathC.title")}</h4>
            <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>{t("mcp.pathC.desc")}</p>
            <button className="btn-secondary" style={{ marginTop: 12, fontSize: 12, padding: "6px 14px" }}
              onClick={() => router.push("/login")}>
              {t("mcp.pathC.cta")}
            </button>
          </div>
        </div>

        <p style={{ fontSize: 11, color: "var(--muted)", textAlign: "center", marginTop: 20, lineHeight: 1.5 }}>
          {t("mcp.securityNote")}
        </p>
      </section>

      {/* ═══ Token Contribution ═══ */}
      <section style={sectionStyle}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <span style={{ display: "inline-block", padding: "4px 14px", borderRadius: 9999, background: "rgba(14,203,129,0.1)", border: "1px solid rgba(14,203,129,0.25)", fontSize: 12, fontWeight: 600, color: "var(--trading-up)", marginBottom: 16 }}>
            {t("tokenProgramBadge")}
          </span>
        </div>
        <h2 style={sectionTitle}>{t("tokenProgramTitle")}</h2>
        <p style={sectionDesc}>{t("tokenProgramDesc")}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {tokenItems.map((item, i) => (
            <div className="card-dark" key={item.title} style={{ padding: "22px 20px", borderTop: "3px solid var(--trading-up)" }}>
              <div style={{ fontSize: 20, marginBottom: 10 }}>{["💰", "📊", "🌊"][i]}</div>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 8px" }}>{item.title}</h3>
              <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.55, margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ Market Builder ═══ */}
      <section style={{ ...sectionStyle, background: "var(--surface-card-dark)" }}>
        <h2 style={sectionTitle}>{t("marketBuilderTitle")}</h2>
        <p style={sectionDesc}>{t("marketBuilderDesc")}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {builderItems.map((item, i) => (
            <div className="card-dark" key={item.title} style={{ padding: "24px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{["🤝", "🌍", "🏅"][i]}</div>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 8px" }}>{item.title}</h3>
              <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.55, margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ Trust Band ═══ */}
      <section style={{ padding: "64px 24px", textAlign: "center", background: "var(--surface-card-dark)" }}>
        <h2 style={{ fontSize: "clamp(24px, 4vw, 40px)", fontWeight: 700, color: "var(--primary)", lineHeight: 1.2, margin: "0 0 40px" }}>
          {t("trustBadge")}
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32, maxWidth: 700, margin: "0 auto" }}>
          {trustItems.map((s) => (
            <div key={s.label}>
              <div className="stat-number" style={{ fontSize: 32 }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="card-dark" style={{ maxWidth: 900, margin: "60px auto 80px", padding: 48, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 28, fontWeight: 600, margin: "0 0 8px" }}>{t("ctaTitle")}</h2>
          <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>{t("ctaDesc")}</p>
        </div>
        <button className="btn-primary-pill" onClick={() => router.push("/login")} style={{ fontSize: 15, padding: "14px 32px", whiteSpace: "nowrap" }}>
          {t("ctaButton")}
        </button>
      </section>

    </main>
  );
}
