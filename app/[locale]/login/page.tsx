"use client";

import { Suspense, useCallback, useState } from "react";

export const dynamic = "force-dynamic";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import LoginV2 from "@/components/LoginV2";

const OKX_AFFILIATE_URL =
  process.env.NEXT_PUBLIC_OKX_AFFILIATE_URL ||
  "https://www.okx.com/web3";
import { TRUSTED_ADMIN } from "@/shared/admin-wallet";

const ENV_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET || "";
const ADMIN_WALLET = ENV_WALLET || TRUSTED_ADMIN;

export default function LoginPage() {
  const t = useTranslations("LoginPage");
  const tc = useTranslations("Common");
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);

  const handleAuthSuccess = useCallback(
    (token: string, wallet: string) => {
      sessionStorage.setItem("aims_token", token);
      sessionStorage.setItem("aims_wallet", wallet);
      setStatus(t("authenticated", { wallet: wallet.slice(0, 10) }));
      const dest = ADMIN_WALLET && wallet.toLowerCase() === ADMIN_WALLET.toLowerCase() ? "/admin" : "/marketplace";
      setTimeout(() => router.push(dest), 800);
    },
    [router, t],
  );

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <button
          onClick={() => router.push("/")}
          className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          {tc("backToHome")}
        </button>

        {status && (
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
            {status}
          </div>
        )}

        <Suspense
          fallback={
            <div className="text-center text-gray-500 py-12">
              {t("loadingAuth")}
            </div>
          }
        >
          <LoginV2
            okxAffiliateUrl={OKX_AFFILIATE_URL}
            onAuthSuccess={handleAuthSuccess}
          />
        </Suspense>
      </div>
    </main>
  );
}
