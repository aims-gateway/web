"use client";

export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 700, margin: "0 auto", padding: "48px 24px" }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Privacy Policy</h1>
      <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.7, marginBottom: 32 }}>
        Last updated: July 2026
      </p>

      <Section title="Data We Collect">
        <ul style={{ fontSize: 14, color: "var(--body)", lineHeight: 2.0, paddingLeft: 20 }}>
          <li><strong>Wallet addresses</strong> — Used for authentication, transaction history, and on-chain attestation.</li>
          <li><strong>API usage metadata</strong> — Model, token count, latency for each relay request. We do not log prompt or response content.</li>
          <li><strong>Skill registration data</strong> — Skill name, version, description, and attestation metadata you provide.</li>
        </ul>
      </Section>

      <Section title="What We Don't Collect">
        <ul style={{ fontSize: 14, color: "var(--body)", lineHeight: 2.0, paddingLeft: 20 }}>
          <li>Prompt contents or model responses (relay content is streamed, not stored).</li>
          <li>Personally identifiable information beyond wallet addresses.</li>
          <li>Browser fingerprinting or cross-site tracking.</li>
        </ul>
      </Section>

      <Section title="Data Storage">
        <p style={{ fontSize: 14, color: "var(--body)", lineHeight: 1.7 }}>
          Wallet and transaction data is stored in Fly.io managed Postgres (region: Singapore).
          On-chain attestation records are public by design — they are stored on the Base
          blockchain and cannot be deleted.
        </p>
      </Section>

      <Section title="Third-Party Providers">
        <p style={{ fontSize: 14, color: "var(--body)", lineHeight: 1.7 }}>
          Relay requests are forwarded to AI providers (OpenAI, Anthropic, DeepSeek, etc.).
          Each provider has its own data handling policies. We do not share your identity
          with providers beyond the API key used for the request.
        </p>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>{title}</h2>
      {children}
    </section>
  );
}
