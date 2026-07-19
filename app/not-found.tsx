export default function NotFound() {
  return (
    <html lang="en">
      <body className="bg-grid" style={{ minHeight: "100vh" }}>
        <main
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: 40,
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: "var(--primary)",
              margin: 0,
            }}
          >
            404
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 18, margin: "12px 0 24px" }}>
            Page not found
          </p>
          <a
            href="/en"
            style={{
              color: "var(--primary)",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Return home
          </a>
        </main>
      </body>
    </html>
  );
}
