"use client";

import { Suspense, useCallback, useState } from "react";

export const dynamic = "force-dynamic";
import { useRouter } from "@/i18n/navigation";
import LoginV2 from "@/components/LoginV2";
import { TRUSTED_ADMIN } from "@/shared/admin-wallet";

const OKX_AFFILIATE_URL =
  process.env.NEXT_PUBLIC_OKX_AFFILIATE_URL ||
  "https://www.okx.com/web3";

const ENV_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET || "";
const ADMIN_WALLET = ENV_WALLET || TRUSTED_ADMIN;

export default function MichaelLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const handleAuthSuccess = useCallback(
    (token: string, wallet: string) => {
      if (wallet.toLowerCase() !== ADMIN_WALLET.toLowerCase()) {
        setError("Access denied — this wallet is not authorized.");
        return;
      }
      sessionStorage.setItem("aims_token", token);
      sessionStorage.setItem("aims_wallet", wallet);
      setStatus("Authenticated — redirecting...");
      setTimeout(() => router.push("/michael/relay"), 600);
    },
    [router],
  );

  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0a0a0f",
      padding: 24,
    }}>
      <div style={{ width: "100%", maxWidth: 400, textAlign: "center" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, color: "#fff" }}>
          AIMS Relay
        </h1>
        <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 24 }}>
          Connect your admin wallet to continue
        </p>

        {error && (
          <div style={{
            borderRadius: 8,
            border: "1px solid rgba(239,68,68,0.3)",
            background: "rgba(239,68,68,0.08)",
            padding: "12px 16px",
            marginBottom: 16,
            fontSize: 13,
            color: "#ef4444",
          }}>
            {error}
          </div>
        )}

        {status && (
          <div style={{
            borderRadius: 8,
            border: "1px solid rgba(14,203,129,0.3)",
            background: "rgba(14,203,129,0.08)",
            padding: "12px 16px",
            marginBottom: 16,
            fontSize: 13,
            color: "#0ecb81",
          }}>
            {status}
          </div>
        )}

        <Suspense
          fallback={
            <div style={{ color: "var(--muted)", fontSize: 13, padding: "40px 0" }}>
              Loading wallet connector...
            </div>
          }
        >
          <LoginV2
            okxAffiliateUrl={OKX_AFFILIATE_URL}
            onAuthSuccess={handleAuthSuccess}
          />
        </Suspense>

        <div style={{ marginTop: 24, fontSize: 12, color: "var(--muted)", opacity: 0.5 }}>
          Authorized wallet: <code style={{ fontSize: 11 }}>{ADMIN_WALLET.slice(0, 10)}...{ADMIN_WALLET.slice(-8)}</code>
        </div>
      </div>
    </main>
  );
}
