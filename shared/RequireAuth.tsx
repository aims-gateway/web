"use client";

import { useEffect, useState } from "react";

import { useRouter } from "@/i18n/navigation";

// Client-side login gate. Pages behind this require a wallet session
// (aims_token + aims_wallet, set by the login flow). Unauthenticated
// visitors are redirected to /login. The marketplace and landing pages
// are intentionally NOT wrapped — they are public.
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const wallet = sessionStorage.getItem("aims_wallet");
    const token = sessionStorage.getItem("aims_token");
    if (!wallet || !token) {
      router.replace("/login");
      return;
    }
    setAuthorized(true);
  }, [router]);

  if (!authorized) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
          color: "var(--muted)",
        }}
      >
        …
      </div>
    );
  }

  return <>{children}</>;
}
