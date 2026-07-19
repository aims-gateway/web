"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

interface LibrarySkill {
  skill_id: string;
  name: string;
  category_id: string;
  tags: string[];
  web3_pricing: number;
  provider: string;
  model_name: string;
  transaction_model: string;
  pricing_model: string;
  buyout_price: number;
  subscription_price: number;
  alliance_token_price: string;
  alliance_tested: boolean;
  ip_vault_level: string;
}

export default function SkillLibraryPage() {
  const t = useTranslations("SkillLibraryPage");
  const mp = useTranslations("MarketplacePage");
  const common = useTranslations("Common");
  const router = useRouter();
  const [skills, setSkills] = useState<LibrarySkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    const raw = sessionStorage.getItem("aims_skill_library");
    const ids: string[] = raw ? JSON.parse(raw) : [];
    setSavedIds(ids);

    if (ids.length === 0) {
      setLoading(false);
      return;
    }

    Promise.all(
      ids.map((id) =>
        fetch(`/api/v2/marketplace/skills/${encodeURIComponent(id)}`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      )
    ).then((results) => {
      setSkills(results.filter(Boolean) as LibrarySkill[]);
      setLoading(false);
    });
  }, []);

  function removeSkill(skillId: string) {
    const newIds = savedIds.filter((id) => id !== skillId);
    setSavedIds(newIds);
    sessionStorage.setItem("aims_skill_library", JSON.stringify(newIds));
    setSkills((prev) => prev.filter((s) => s.skill_id !== skillId));
  }

  if (loading) {
    return (
      <main style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ textAlign: "center", padding: 80, color: "var(--muted)" }}>{common("loading")}</div>
      </main>
    );
  }

  const catName = (categoryId: string) =>
    mp(`categories.${categoryId}` as any) || categoryId;

  function priceDisplay(s: LibrarySkill): string {
    if (s.transaction_model === "mode2") return `$${s.alliance_token_price}/10K tokens`;
    if (s.pricing_model === "buyout") return `$${(s.buyout_price || 0).toLocaleString()} buyout`;
    if (s.pricing_model === "subscription") return `$${s.subscription_price}/mo`;
    return `$${s.web3_pricing.toFixed(4)} / call`;
  }

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px" }}>
      <button className="text-link" onClick={() => router.push("/marketplace")} style={{ marginBottom: 24, display: "inline-block" }}>
        ← {t("backToMarketplace")}
      </button>

      <h1 style={{ fontSize: 32, fontWeight: 700, margin: "0 0 8px" }}>{t("title")}</h1>
      <p style={{ color: "var(--muted)", fontSize: 14, margin: "0 0 32px" }}>{t("subtitle")}</p>

      {skills.length === 0 ? (
        <div className="card-dark" style={{ textAlign: "center", padding: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📚</div>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>{t("emptyTitle")}</h2>
          <p style={{ color: "var(--muted)", fontSize: 14, margin: "0 0 20px", lineHeight: 1.6 }}>{t("emptyDesc")}</p>
          <button className="btn-primary" style={{ height: 40, fontSize: 14, padding: "0 28px" }} onClick={() => router.push("/marketplace")}>
            {t("browseMarketplace")}
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(340px, 100%), 1fr))", gap: 16 }}>
          {skills.map((skill) => (
            <div className="card-dark" key={skill.skill_id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, flex: 1 }}>{skill.name}</h3>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {skill.ip_vault_level && (
                    <span className="badge" style={{ fontSize: 10, background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>IP {skill.ip_vault_level}</span>
                  )}
                  {skill.alliance_tested && (
                    <span className="badge badge-blue" style={{ fontSize: 10 }}>{t("allianceTested")}</span>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                <span className="badge badge-yellow" style={{ fontSize: 10 }}>{catName(skill.category_id)}</span>
                {skill.provider && <span className="badge badge-muted" style={{ fontSize: 10 }}>{skill.provider}</span>}
              </div>

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                {skill.tags.map((tag) => (
                  <span key={tag} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "rgba(112,122,138,0.12)", color: "var(--muted-strong)" }}>{tag}</span>
                ))}
              </div>

              <div style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 600, color: "var(--primary)", marginBottom: 14 }}>
                {priceDisplay(skill)}
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn-primary" style={{ flex: 1, height: 34, fontSize: 12 }}
                  onClick={() => router.push(`/marketplace/${skill.skill_id}`)}>
                  {t("viewDetails")}
                </button>
                <button className="btn-secondary" style={{ height: 34, fontSize: 12, padding: "0 14px" }}
                  onClick={() => removeSkill(skill.skill_id)}>
                  {t("remove")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
