"use client";

export default function SupportPage() {
  return (
    <main style={{ maxWidth: 700, margin: "0 auto", padding: "48px 24px" }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Support</h1>
      <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.7, marginBottom: 32 }}>
        Need help with AIMS? Choose the right channel below.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {[
          { title: "Forum", desc: "Ask questions and share knowledge with the AIMS community.", action: "Visit Forum", href: "/admin/forum" },
          { title: "Discord", desc: "Real-time chat with the team and other developers.", action: "Join Discord", href: "https://discord.gg/aims" },
          { title: "GitHub Issues", desc: "Report bugs or request features for the AIMS platform.", action: "Open Issue", href: "https://github.com/aims-v2" },
          { title: "Documentation", desc: "Read the API reference, SDK guide, and smart contract docs.", action: "Browse Docs", href: "/docs/api" },
        ].map((item) => (
          <div key={item.title} className="card-dark" style={{ padding: "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{item.title}</div>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>{item.desc}</div>
            </div>
            <a href={item.href} className="btn-secondary" style={{ padding: "6px 16px", fontSize: 13, textDecoration: "none" }}>
              {item.action}
            </a>
          </div>
        ))}
      </div>
    </main>
  );
}
