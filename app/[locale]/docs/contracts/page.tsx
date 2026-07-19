"use client";

import { Link } from "@/i18n/navigation";

export default function DocsContractsPage() {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Smart Contract Rights Confirmation</h1>
      <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 40, lineHeight: 1.7 }}>
        AIMS smart contracts provide on-chain copyright attestation for AI skills
        and digital assets. This page explains what the contracts do and what rights
        you gain — no deep technical knowledge required.
      </p>

      {/* What the contracts do */}
      <Section title="What the Contracts Do">
        <BenefitCard
          title="Proof of Authorship"
          desc="When you register a skill through AIMS, the contract records a cryptographic fingerprint on-chain. This creates an immutable, timestamped record that you are the original creator — anyone can verify it independently, forever."
        />
        <BenefitCard
          title="Ownership Registry"
          desc="Each registration links your wallet address to the skill's unique identifier. The blockchain acts as a public, tamper-proof registry: your ownership is visible to everyone and cannot be altered or deleted."
        />
        <BenefitCard
          title="License & Authorization Tracking"
          desc="When you license your skill to another party — e.g. via a Cooperation Agreement or reseller arrangement — the contract records the authorization details. Disputes over usage rights can be resolved by checking the on-chain history."
        />
        <BenefitCard
          title="Public Verification"
          desc={
            <>
              Any registration can be verified at{" "}
              <code>/verify/&lt;cert_id&gt;</code> without a wallet or login. This is the
              contract&apos;s core purpose: anyone can confirm a skill&apos;s registered
              owner and attestation level without trusting a centralized database.
            </>
          }
        />
      </Section>

      {/* What you get */}
      <Section title="What Rights Confirmation Means for You">
        <ul style={{ fontSize: 14, color: "var(--body)", lineHeight: 2.0, paddingLeft: 20 }}>
          <li><strong>Creators</strong> — Prove you built a skill first. If someone copies it, the on-chain timestamp is your evidence.</li>
          <li><strong>Buyers / Licensees</strong> — Check that a skill is legitimately registered before purchasing or integrating it.</li>
          <li><strong>Resellers</strong> — Show your customers verifiable proof that you&apos;re authorized to distribute a skill.</li>
          <li><strong>Marketplace Participants</strong> — The AIMS marketplace displays attestation levels (L1–L5) that are backed by on-chain data, not self-reported claims.</li>
        </ul>
      </Section>

      {/* Already live */}
      <Section title="What's Already Live">
        <p style={{ fontSize: 14, color: "var(--body)", lineHeight: 1.7, marginBottom: 12 }}>
          The copyright attestation system is operational. You can use it today:
        </p>
        <FeatureRow
          items={[
            { label: "IP Vault", href: "/developer/ip-vault", desc: "Register your skills, view attestation records, manage your IP portfolio." },
            { label: "IP Fees", href: "/api-station", desc: "API Station tab — view active attestation subscriptions and billing history." },
            { label: "Public Verify", href: "/verify", desc: "Anyone can verify a registration certificate by ID, no login required." },
            { label: "Marketplace", href: "/marketplace", desc: "Every listed skill shows its attestation level (L1–L5) backed by on-chain data." },
          ]}
        />
      </Section>

      {/* Attestation levels */}
      <Section title="Attestation Levels (L1–L5)">
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--hairline-on-dark)", color: "var(--muted)", fontSize: 12 }}>Level</th>
              <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--hairline-on-dark)", color: "var(--muted)", fontSize: 12 }}>What it Means</th>
              <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--hairline-on-dark)", color: "var(--muted)", fontSize: 12 }}>On-Chain Record</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["L1", "Self-declared authorship", "Timestamp + wallet + skill hash"],
              ["L2", "Community-reviewed", "L1 + community audit trail"],
              ["L3", "Third-party attested", "L2 + external auditor signature"],
              ["L4", "Arbitration-resolved", "L3 + dispute outcome recorded"],
              ["L5", "Fully adjudicated", "L4 + judicial / institutional ruling"],
            ].map(([level, meaning, record]) => (
              <tr key={level}>
                <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--hairline-on-dark)", fontWeight: 700, color: "var(--primary)" }}>{level}</td>
                <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--hairline-on-dark)" }}>{meaning}</td>
                <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--hairline-on-dark)", color: "var(--muted)", fontSize: 12 }}>{record}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <div style={{ marginTop: 48, padding: 24, borderRadius: 12, background: "rgba(252,213,53,0.05)", border: "1px solid rgba(252,213,53,0.12)", textAlign: "center" }}>
        <p style={{ fontSize: 14, color: "var(--body)", margin: "0 0 8px" }}>
          Ready to protect your AI skill?
        </p>
        <Link
          href="/developer/ip-vault"
          className="btn-primary"
          style={{ display: "inline-block", padding: "10px 24px", textDecoration: "none", fontSize: 14 }}
        >
          Go to IP Vault
        </Link>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, paddingBottom: 8, borderBottom: "1px solid var(--hairline-on-dark)" }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function BenefitCard({ title, desc }: { title: string; desc: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16, padding: "16px 20px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid var(--hairline-on-dark)" }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{title}</h3>
      <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>{desc}</p>
    </div>
  );
}

function FeatureRow({ items }: { items: { label: string; href: string; desc: string }[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          style={{
            display: "block", padding: "14px 18px", borderRadius: 10,
            background: "rgba(255,255,255,0.03)", border: "1px solid var(--hairline-on-dark)",
            textDecoration: "none", color: "inherit",
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, color: "var(--primary)" }}>{item.label}</div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>{item.desc}</div>
        </Link>
      ))}
    </div>
  );
}
