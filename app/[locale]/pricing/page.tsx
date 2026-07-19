"use client";

import { Link } from "@/i18n/navigation";

export default function PricingPage() {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Pricing</h1>
      <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.7, marginBottom: 40 }}>
        AIMS uses a pay-per-use model for AI relay and subscription-based fees for IP attestation.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20, marginBottom: 40 }}>
        {[
          { tier: "Basic", price: "Free", quota: "1,000 calls/day", desc: "For individual developers testing skills and exploring the marketplace." },
          { tier: "Pro", price: "$29/mo", quota: "10,000 calls/day", desc: "For professional developers and small teams building production skills." },
          { tier: "Enterprise", price: "Custom", quota: "Unlimited", desc: "For organizations needing dedicated relay capacity, SLA, and priority support." },
        ].map((p) => (
          <div key={p.tier} className="card-dark" style={{ padding: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--primary)", marginBottom: 4 }}>{p.tier}</div>
            <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{p.price}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>{p.quota}</div>
            <div style={{ fontSize: 13, color: "var(--body)" }}>{p.desc}</div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Relay Model Pricing</h2>
      <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, marginBottom: 24 }}>
        Relay charges are per 10k tokens consumed. See the{" "}
        <Link href="/api-station" style={{ color: "var(--primary)" }}>API Station</Link>{" "}
        for the full rate card with current prices for all supported models.
      </p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>IP Vault Fees</h2>
      <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7 }}>
        Attestation fees depend on the level requested:
        L1 registration is free. L2 at $5 one-time per skill. L3 at $19 one-time per skill (includes 10 attestations), plus gas fees.
        View your active subscriptions and billing in the API Station.
      </p>
    </main>
  );
}
