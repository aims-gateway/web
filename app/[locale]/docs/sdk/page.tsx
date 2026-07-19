"use client";

import { Link } from "@/i18n/navigation";

export default function DocsSdkPage() {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>SDK Guide</h1>
      <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 40, lineHeight: 1.7 }}>
        Use the AIMS SDK to integrate AI skills, relay access, and on-chain attestation
        into your application. The SDK wraps the AIMS REST API with typed clients for
        TypeScript and Python.
      </p>

      <Section title="1. Get an API Key">
        <p style={{ fontSize: 14, color: "var(--body)", lineHeight: 1.7, marginBottom: 12 }}>
          Before you can call the relay or other authenticated endpoints, you need an API key.
          Go to the{" "}
          <Link href="/api-station" style={{ color: "var(--primary)" }}>
            API Station
          </Link>
          , connect your wallet, and click &quot;Generate Key&quot;. Copy the key — it will
          only be shown once.
        </p>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          Keys have the format <code>aims_sk_&lt;48 hex chars&gt;</code>. Use Basic tier
          for development (1,000 calls/day), Pro for production (10,000 calls/day).
        </p>
      </Section>

      <Section title="2. Install">
        <CodeBlock lang="bash" code={'npm install @aims-v2/sdk\n# or\npip install aims-v2-sdk'} />
        <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 8 }}>
          The SDK is also available as a standalone ES module for direct use in
          edge functions and browser extensions.
        </p>
      </Section>

      <Section title="3. Configure">
        <CodeBlock lang="ts" code={`import { AimsClient } from "@aims-v2/sdk";

const aims = new AimsClient({
  apiKey: process.env.AIMS_API_KEY,     // aims_sk_...
  baseUrl:  "https://api.aimsgateway.com",
});`} />
      </Section>

      <Section title="4. Chat Completions (Relay)">
        <p style={{ fontSize: 14, color: "var(--body)", lineHeight: 1.7, marginBottom: 12 }}>
          The relay endpoint is OpenAI-compatible — you can point any OpenAI SDK at
          AIMS by changing the base URL and API key.
        </p>
        <CodeBlock lang="ts" code={`const res = await aims.relay.chat.create({
  model: "deepseek-chat",
  messages: [{ role: "user", content: "Hello from AIMS!" }],
  max_tokens: 500,
  temperature: 0.7,
});

console.log(res.choices[0].message.content);`} />
      </Section>

      <Section title="5. Marketplace">
        <CodeBlock lang="ts" code={`// List available skills
const skills = await aims.marketplace.list({ search: "coding", page: 1 });

// Get a single skill
const skill = await aims.marketplace.get("skill_uuid");`} />
      </Section>

      <Section title="6. IP Vault">
        <p style={{ fontSize: 14, color: "var(--body)", lineHeight: 1.7, marginBottom: 12 }}>
          Register your skill for on-chain copyright attestation. Requires a developer
          wallet authenticated via Web3 signature.
        </p>
        <CodeBlock lang="ts" code={`// Register IP with on-chain attestation
const result = await aims.ipVault.register({
  skill_name: "my-fine-tuned-model",
  version: "1.0.0",
});

// Verify an existing registration
const cert = await aims.ipVault.verify("cert_uuid");`} />
      </Section>

      <Section title="Raw REST">
        <p style={{ fontSize: 14, color: "var(--body)", lineHeight: 1.7 }}>
          You can also call the API directly without the SDK — just include your API key
          or JWT in the Authorization header. See the{" "}
          <Link href="/docs/api" style={{ color: "var(--primary)" }}>
            API Reference
          </Link>{" "}
          for all endpoints.
        </p>
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

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  return (
    <pre style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--hairline-on-dark)", borderRadius: 8, padding: "16px 20px", overflow: "auto", fontSize: 13, lineHeight: 1.6, fontFamily: "monospace", color: "var(--body)", whiteSpace: "pre-wrap" }}>
      {code}
    </pre>
  );
}
