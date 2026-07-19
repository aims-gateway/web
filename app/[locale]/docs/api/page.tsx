"use client";

import { Link } from "@/i18n/navigation";

export default function DocsApiPage() {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>API Reference</h1>
      <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 40, lineHeight: 1.7 }}>
        The AIMS v2 API lets skills, developers, and applications interact with the AIMS
        marketplace, relay station, settlement engine, and on-chain attestations. All
        endpoints are served from <code>https://api.aimsgateway.com/api/v2/</code>.
      </p>

      {/* Auth */}
      <Section title="Authentication">
        <Endpoint method="GET" path="/api/v2/auth/nonce" desc="Request a signable nonce for wallet authentication." />
        <Endpoint method="POST" path="/api/v2/auth/native" desc="Submit a signed nonce + wallet address to receive an AIMS JWT. Returns a Bearer token valid for session use." />
        <Endpoint method="POST" path="/api/v2/auth/embedded" desc="Authenticate via embedded wallet (same flow as native)." />
        <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 12 }}>
          All authenticated requests must include <code>Authorization: Bearer &lt;aims_jwt&gt;</code>.
          The JWT&apos;s <code>sub</code> claim is the authenticated wallet address.
        </p>
      </Section>

      {/* Developer Keys */}
      <Section title="Developer API Keys">
        <Endpoint method="GET" path="/api/v2/developer/keys" auth desc="List your API keys (for skill relay access)." />
        <Endpoint method="POST" path="/api/v2/developer/keys" auth desc="Generate a new relay API key. Pass {'tier': 'basic'|'pro'|'enterprise', 'label': '...'}." />
        <Endpoint method="DELETE" path="/api/v2/developer/keys/{'{key_id}'}" auth desc="Revoke an API key you own." />
        <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 12 }}>
          Relay keys use prefix <code>aims_sk_</code> and are authenticated via
          <code>Authorization: Bearer aims_sk_...</code>. Generate keys from the
          <Link href="/api-station" style={{ color: "var(--primary)" }}> API Station</Link>.
        </p>
      </Section>

      {/* Relay */}
      <Section title="AI Relay">
        <Endpoint method="POST" path="/api/v2/relay/chat/completions" auth desc="Proxy a chat completion through AIMS relay. Requires a relay API key (aims_sk_...). OpenAI-compatible request/response format." />
        <Endpoint method="POST" path="/api/v2/relay/images/generations" auth desc="Proxy image generation. Requires relay API key." />
        <Endpoint method="POST" path="/api/v2/relay/audio/transcriptions" auth desc="Proxy audio transcription. Requires relay API key." />
      </Section>

      {/* Marketplace */}
      <Section title="Marketplace">
        <Endpoint method="GET" path="/api/v2/marketplace" desc="List available skills. Query: ?page=1&page_size=20&search=..." />
        <Endpoint method="GET" path="/api/v2/marketplace/{'{skill_id}'}" desc="Get a single skill's details." />
      </Section>

      {/* Developer */}
      <Section title="Developer">
        <Endpoint method="POST" path="/api/v2/developer/skill" auth desc="Register or update a skill. Requires Web3 signature auth (X-Identity headers)." />
        <Endpoint method="GET" path="/api/v2/developer/nonce" desc="Get a nonce for Web3 signature authentication." />
      </Section>

      {/* IP Vault */}
      <Section title="IP Vault">
        <Endpoint method="GET" path="/api/v2/ip-vault/status" auth desc="Get your IP registration status and history." />
        <Endpoint method="POST" path="/api/v2/ip-vault/register" auth desc="Register a skill for IP protection / copyright attestation." />
      </Section>

      {/* Reseller */}
      <Section title="Reseller">
        <Endpoint method="POST" path="/api/v2/reseller/register" auth desc="Register as a reseller." />
        <Endpoint method="GET" path="/api/v2/reseller/commissions" auth desc="List your commission earnings." />
      </Section>

      {/* Subscription */}
      <Section title="Subscription">
        <Endpoint method="POST" path="/api/v2/subscription/purchase" auth desc="Purchase a subscription to a skill." />
        <Endpoint method="GET" path="/api/v2/subscription/active" auth desc="List your active subscriptions." />
        <Endpoint method="POST" path="/api/v2/subscription/cancel" auth desc="Cancel an active subscription." />
      </Section>
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

function Endpoint({ method, path, auth, desc }: { method: string; path: string; auth?: boolean; desc: string }) {
  const colors: Record<string, string> = { GET: "#3b82f6", POST: "#10b981", DELETE: "#ef4444", PUT: "#f59e0b" };
  return (
    <div style={{ marginBottom: 12, padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid var(--hairline-on-dark)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: colors[method] || "#666", color: "#fff", fontFamily: "monospace" }}>{method}</span>
        <code style={{ fontSize: 13, color: "var(--on-dark)" }}>{path}</code>
        {auth && <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3, background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>AUTH</span>}
      </div>
      <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>{desc}</p>
    </div>
  );
}
