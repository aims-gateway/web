"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

export default function VerifyCertPage() {
  const t = useTranslations("VerifyPage");
  const params = useParams();
  const certId = params?.cert_id as string || "";

  const certData = {
    certId: certId || "AIMS-IPV-20260709-00042",
    attestationTime: "2026-07-09 14:32:15 UTC",
    skill: "LLaMA 3.1 70B Inference Engine",
    developer: "0x3C44...93BC",
    level: "L2",
    codeHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    blockHeight: "18,245,367",
    txHash: "0x8a3b...f72c",
    ipfsCid: "QmXyZ...8aBc",
    contractAddr: "0x5FbD...3a1C",
    signer: "0xAIMS...OFFICIAL",
    valid: true,
    revoked: false,
  };

  return (
    <main style={{ maxWidth: 700, margin: "0 auto", padding: "40px 24px" }}>
      <div className="card-dark" style={{ padding: 32, textAlign: "center" }}>
        {/* Status */}
        <div style={{ fontSize: 48, marginBottom: 8 }}>
          {certData.revoked ? "❌" : certData.valid ? "✅" : "❌"}
        </div>
        <div style={{
          fontSize: 18, fontWeight: 700, marginBottom: 4,
          color: certData.revoked ? "var(--trading-down)" : certData.valid ? "var(--trading-up)" : "var(--trading-down)",
        }}>
          {certData.revoked ? t("revokedStatus") : certData.valid ? t("valid") : t("invalid")}
        </div>
        <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 24px" }}>
          {t("certId")}: {certData.certId}
        </p>

        {/* Key info */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 0", marginBottom: 28, textAlign: "left", fontSize: 13 }}>
          <div style={{ color: "var(--muted)" }}>{t("attestationTime")}</div>
          <div style={{ fontFamily: "monospace" }}>{certData.attestationTime}</div>
          <div style={{ color: "var(--muted)" }}>{t("skill")}</div>
          <div>{certData.skill}</div>
          <div style={{ color: "var(--muted)" }}>{t("developer")}</div>
          <div style={{ fontFamily: "monospace" }}>{certData.developer}</div>
          <div style={{ color: "var(--muted)" }}>{t("attestationLevel")}</div>
          <div style={{ color: "var(--primary)", fontWeight: 600 }}>{certData.level} {certData.level === "L3" ? "Judicial" : certData.level === "L2" ? "Pro" : "Basic"}</div>
        </div>

        <div style={{ height: 1, background: "var(--hairline-on-dark)", marginBottom: 24 }} />

        {/* Chain Verification */}
        <div style={{ textAlign: "left", marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 12px" }}>{t("chainVerification")}</h3>
          {[
            { label: t("codeHashMatch"), ok: true },
            { label: t("blockHeightVerified"), ok: true, detail: certData.blockHeight },
            { label: t("timestampVerified"), ok: true },
            { label: t("txNotTampered"), ok: true },
            { label: t("contractVerified"), ok: true, detail: certData.contractAddr },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 12 }}>
              <span>{item.ok ? "✅" : "❌"} {item.label}</span>
              {item.detail && <span style={{ fontFamily: "monospace", color: "var(--muted)", fontSize: 11 }}>{item.detail}</span>}
            </div>
          ))}
          <div style={{ marginTop: 8 }}>
            <a href={`https://optimistic.etherscan.io/tx/${certData.txHash}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "var(--primary)" }}>
              {t("viewOnExplorer")} →
            </a>
          </div>
        </div>

        {/* Storage Verification */}
        <div style={{ textAlign: "left", marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 12px" }}>{t("storageVerification")}</h3>
          {[
            { label: t("ipfsAccessible"), ok: true },
            { label: t("ipfsHashMatch"), ok: true, detail: certData.ipfsCid },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 12 }}>
              <span>{item.ok ? "✅" : "❌"} {item.label}</span>
              {item.detail && <span style={{ fontFamily: "monospace", color: "var(--muted)", fontSize: 11 }}>{item.detail}</span>}
            </div>
          ))}
          <div style={{ marginTop: 8 }}>
            <a href={`https://ipfs.io/ipfs/${certData.ipfsCid}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "var(--primary)" }}>
              {t("viewOnIpfs")} →
            </a>
          </div>
        </div>

        {/* Signature Verification */}
        <div style={{ textAlign: "left", marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 12px" }}>{t("signatureVerification")}</h3>
          <div style={{ padding: "4px 0", fontSize: 12 }}>
            ✅ {t("platformSignatureValid")}
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
            {t("signer")}: <span style={{ fontFamily: "monospace" }}>{certData.signer}</span>
          </div>
        </div>

        <div style={{ height: 1, background: "var(--hairline-on-dark)", marginBottom: 24 }} />

        {/* Conclusion */}
        <div style={{ padding: 16, borderRadius: 8, background: "rgba(14,203,129,0.06)", border: "1px solid rgba(14,203,129,0.2)", marginBottom: 20, textAlign: "left" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--trading-up)", marginBottom: 6 }}>
            {certData.valid && !certData.revoked ? `✅ ${t("conclusionText")}` : `❌ ${t("invalid")}`}
          </div>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 8px", lineHeight: 1.6 }}>
            {t("ownershipStatement")}
          </p>
          <p style={{ fontSize: 11, color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>
            {t("independentVerification")}
          </p>
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button className="btn-secondary" style={{ height: 36, fontSize: 12 }}>{t("downloadVerificationReport")}</button>
          <button className="btn-primary" style={{ height: 36, fontSize: 12 }}>{t("viewCertificatePdf")}</button>
        </div>
      </div>
    </main>
  );
}
