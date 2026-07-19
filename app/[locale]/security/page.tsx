"use client";

export default function SecurityPage() {
  return (
    <main style={{ maxWidth: 700, margin: "0 auto", padding: "48px 24px" }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Security</h1>
      <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.7, marginBottom: 32 }}>
        AIMS takes security seriously. Here is how we protect your data, keys, and assets.
      </p>

      {[
        { title: "API Key Storage", desc: "API keys are hashed with SHA-256 before storage. The raw key is shown only once at creation time and cannot be retrieved afterward." },
        { title: "JWT Authentication", desc: "Session tokens are HMAC-SHA256 JWTs with short expiration. All authenticated endpoints verify the token on every request." },
        { title: "Admin Key Isolation", desc: "Administrative operations require a separate admin key verified via constant-time comparison. Admin and user auth paths are fully separated." },
        { title: "Relay Key Authentication", desc: "Relay API keys use the aims_sk_ prefix with dedicated rate limiting, quota tracking, and per-key tier enforcement." },
        { title: "On-Chain Blacklist", desc: "Suspended wallets are blocked at the middleware layer via both a local identity check and an on-chain blacklist query." },
        { title: "SSRF Protection", desc: "The relay service validates all target URLs against internal/private network ranges before proxying requests." },
        { title: "Input Sanitization", desc: "All user-provided content is sanitized: null bytes, control characters, and surrogate pairs are stripped. Payload lengths are enforced." },
        { title: "Production Secret Validation", desc: "The backend refuses to boot in production if critical secrets (JWT secret, encryption key, admin key, database URL) are missing or set to insecure defaults." },
      ].map((item) => (
        <div key={item.title} style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{item.title}</h3>
          <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
        </div>
      ))}

      <div className="card-dark" style={{ padding: 20, marginTop: 32 }}>
        <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
          To report a security vulnerability, please contact us through Discord or the Forum.
          Do not disclose security issues publicly until they have been addressed.
        </p>
      </div>
    </main>
  );
}
