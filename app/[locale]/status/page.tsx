"use client";

export default function StatusPage() {
  return (
    <main style={{ maxWidth: 700, margin: "0 auto", padding: "48px 24px" }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>System Status</h1>
      <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.7, marginBottom: 32 }}>
        Current operational status of AIMS services.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[
          { name: "AIMS Gateway API", status: "Operational" },
          { name: "AI Relay Station", status: "Operational" },
          { name: "Marketplace", status: "Operational" },
          { name: "IP Vault / Attestation", status: "Operational" },
          { name: "Discourse Forum", status: "Operational" },
          { name: "On-Chain Contracts (Base)", status: "Operational" },
        ].map((svc) => (
          <div key={svc.name} className="card-dark" style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 500, fontSize: 14 }}>{svc.name}</span>
            <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 4, background: "rgba(14,203,129,0.12)", color: "#0ecb81", fontWeight: 600 }}>
              {svc.status}
            </span>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 32, textAlign: "center" }}>
        Last updated: {new Date().toISOString().slice(0, 10)}. For incident history, follow us on Twitter.
      </p>
    </main>
  );
}
