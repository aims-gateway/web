/**
 * LoginV2 — Secure wallet authentication for AIMS v2.
 *
 * Three tracks, zero private-key exposure:
 *   A — Browser Extension (Desktop): EIP-1193 (MetaMask / OKX / Phantom).
 *   B — WalletConnect QR (Mobile):  Scan QR with phone wallet app.
 *   C — Social Login:                Privy / Web3Auth embedded wallet.
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  createPairing,
  isWalletConnectAvailable,
  signMessageWC,
  disconnectWC,
  getWCProjectId,
  getSignClient,
} from "@/services/walletconnect";
import type { SessionTypes } from "@walletconnect/types";
import QRCodeLib from "qrcode";
import { useTranslations } from "next-intl";

// ── Types ───────────────────────────────────────────────────────────────

type AuthState =
  | { phase: "idle" }
  | { phase: "connecting_wallet" }
  | { phase: "signing" }
  | { phase: "qr_loading" }
  | { phase: "qr_ready"; uri: string; qrDataUrl: string; dismiss: () => void }
  | { phase: "qr_connecting" }
  | { phase: "social_login" }
  | { phase: "authenticated"; token: string; wallet: string }
  | { phase: "no_wallet" }
  | { phase: "error"; message: string };

interface LoginV2Props {
  okxAffiliateUrl?: string;
  onAuthSuccess?: (token: string, wallet: string) => void;
  onSocialLogin?: (
    apiBase: string,
    onAuthSuccess: (token: string, wallet: string) => void,
  ) => Promise<void>;
}

// ── Browser wallet detection ────────────────────────────────────────────

interface WalletInfo {
  installed: boolean;
  isMetaMask: boolean;
  isOKX: boolean;
  hasAccounts: boolean;
  name: string;
}

function detectWallets(): WalletInfo {
  if (typeof window === "undefined") {
    return { installed: false, isMetaMask: false, isOKX: false, hasAccounts: false, name: "" };
  }
  const w = window as unknown as Record<string, unknown>;
  const eth = w.ethereum as Record<string, unknown> | undefined;
  if (!eth) return { installed: false, isMetaMask: false, isOKX: false, hasAccounts: false, name: "" };

  const isMetaMask = !!(eth.isMetaMask);
  const isOKX = !!(eth.isOKXWallet || (eth as Record<string, string>).okx);
  const hasAccounts = Array.isArray(eth.accounts) && eth.accounts.length > 0;

  let name = "Wallet";
  if (isOKX) name = "OKX Wallet";
  else if (isMetaMask) name = "MetaMask";
  else if (eth.isPhantom) name = "Phantom";
  else if (eth.isCoinbaseWallet) name = "Coinbase Wallet";

  return { installed: true, isMetaMask, isOKX, hasAccounts, name };
}

async function authFlow(wallet: string, signFn: (msg: string) => Promise<string>): Promise<string> {
  const nonceResp = await fetch(`/api/v2/auth/nonce?wallet=${wallet}`);
  if (!nonceResp.ok) throw new Error(`Nonce fetch failed [${nonceResp.status}]`);
  const { nonce } = (await nonceResp.json()) as { nonce: string };

  const message = `AIMS v2 Identity Auth\nWallet: ${wallet}\nNonce: ${nonce}`;
  const signature = await signFn(message);

  const authResp = await fetch(`/api/v2/auth/native`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet_address: wallet, signature, nonce }),
  });
  if (!authResp.ok) {
    const err = (await authResp.json().catch(() => ({}))) as { detail?: string };
    throw new Error(err.detail ?? `Auth failed [${authResp.status}]`);
  }
  const { token } = (await authResp.json()) as { token: string };
  return token;
}

// ── Component ───────────────────────────────────────────────────────────

const LoginV2: React.FC<LoginV2Props> = ({
  okxAffiliateUrl = "https://web3.okx.com/join/1979AIMS",
  onAuthSuccess,
  onSocialLogin,
}) => {
  const t = useTranslations("LoginV2");

  const [mounted, setMounted] = useState(false);
  const [auth, setAuth] = useState<AuthState>({ phase: "idle" });
  const [walletInfo, setWalletInfo] = useState<WalletInfo>({
    installed: false, isMetaMask: false, isOKX: false, hasAccounts: false, name: "",
  });
  const wcEnabled = isWalletConnectAvailable();

  useEffect(() => {
    setMounted(true);
    setWalletInfo(detectWallets());
    const timer = setTimeout(() => setWalletInfo(detectWallets()), 1000);
    // Pre-warm WalletConnect relay connection so QR code appears instantly.
    if (wcEnabled) getSignClient().catch(() => {});
    return () => clearTimeout(timer);
  }, []);

  // ── Track A: Browser extension ─────────────────────────────────────

  const connectBrowserWallet = useCallback(async () => {
    const info = detectWallets();
    setWalletInfo(info);

    if (!info.installed) {
      setAuth({ phase: "no_wallet" });
      return;
    }

    setAuth({ phase: "connecting_wallet" });
    try {
      const eth = (window as unknown as Record<string, unknown>).ethereum as {
        request(args: { method: string; params?: unknown[] }): Promise<unknown>;
      };
      const addresses = (await eth.request({ method: "eth_requestAccounts" })) as string[];
      if (!addresses?.length) {
        setAuth({ phase: "error", message: t("noAccountsError") });
        return;
      }
      const wallet = addresses[0].toLowerCase();
      setAuth({ phase: "signing" });

      const token = await authFlow(wallet, async (message) => {
        const sig = await eth.request({ method: "personal_sign", params: [message, wallet] });
        return sig as string;
      });

      setAuth({ phase: "authenticated", token, wallet });
      onAuthSuccess?.(token, wallet);
    } catch (err: unknown) {
      const msg = (err as Error).message ?? "Unknown error";
      if (/rejected|denied|cancelled/i.test(msg)) { setAuth({ phase: "idle" }); return; }
      setAuth({ phase: "error", message: msg });
    }
  }, [onAuthSuccess]);

  // ── Track B: WalletConnect QR ──────────────────────────────────────

  const showQrCode = useCallback(async () => {
    setAuth({ phase: "qr_loading" });

    try {
      const pairing = await createPairing();
      if (!pairing) {
        setAuth({ phase: "error", message: t("wcFailedError") });
        return;
      }

      const qrDataUrl = await QRCodeLib.toDataURL(pairing.uri, {
        width: 320,
        margin: 2,
        color: { dark: "#181a20", light: "#ffffff" },
      });

      let dismissed = false;

      const dismiss = () => {
        dismissed = true;
        setAuth({ phase: "idle" });
      };

      setAuth({ phase: "qr_ready", uri: pairing.uri, qrDataUrl, dismiss });

      // Wait for mobile wallet approval
      let session: SessionTypes.Struct;
      try {
        session = await pairing.approval();
      } catch {
        if (!dismissed) setAuth({ phase: "idle" });
        return;
      }

      if (dismissed) { disconnectWC(session).catch(() => {}); return; }

      const accounts = session.namespaces.eip155?.accounts || [];
      if (!accounts.length) {
        setAuth({ phase: "error", message: t("noWcAccountsError") });
        return;
      }

      const wallet = accounts[0].split(":").pop()?.toLowerCase();
      if (!wallet) {
        setAuth({ phase: "error", message: t("invalidAccountError") });
        return;
      }

      setAuth({ phase: "qr_connecting" });

      const token = await authFlow(wallet, async (message) => {
        return signMessageWC(session, wallet, message);
      });

      setAuth({ phase: "authenticated", token, wallet });
      onAuthSuccess?.(token, wallet);
    } catch (err: unknown) {
      const msg = (err as Error).message ?? "Unknown error";
      if (/rejected|denied|cancelled/i.test(msg)) { setAuth({ phase: "idle" }); return; }
      setAuth({ phase: "error", message: `WalletConnect: ${msg}` });
    }
  }, [onAuthSuccess]);

  // ── Track C: Social login ──────────────────────────────────────────

  const showSocialLogin = typeof onSocialLogin === "function";

  const connectSocialLogin = useCallback(async () => {
    if (!onSocialLogin) { setAuth({ phase: "error", message: t("socialNotConfigured") }); return; }
    setAuth({ phase: "social_login" });
    try {
      await onSocialLogin("", (token, wallet) => {
        setAuth({ phase: "authenticated", token, wallet });
        onAuthSuccess?.(token, wallet);
      });
    } catch (err: unknown) {
      setAuth({ phase: "error", message: (err as Error).message ?? "Social login error" });
    }
  }, [onAuthSuccess, onSocialLogin]);

  // ── Authenticated ──────────────────────────────────────────────────

  if (auth.phase === "authenticated") {
    return (
      <div style={s.card}>
        <div style={s.checkmark}>✓</div>
        <h2 style={s.title}>{t("authenticated")}</h2>
        <p style={s.wallet}>{auth.wallet}</p>
        <p style={{ ...s.greenNote, textAlign: "center", marginTop: 12 }}>{t("redirectingConsole")}</p>
      </div>
    );
  }

  const isBusy = !["idle", "error", "qr_ready", "no_wallet"].includes(auth.phase);

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <div style={s.card}>
      <div style={s.lockIcon}>🔐</div>
      <h2 style={s.title}>{t("title")}</h2>
      <p style={s.subtitle}>{t("subtitle")}</p>

      <div style={s.greenNote}>
        🛡 {t("secureNote")}
      </div>

      {auth.phase === "error" && (
        <div style={s.error}>
          <span>{auth.message}</span>
          <button style={s.dismissBtn} onClick={() => setAuth({ phase: "idle" })}>×</button>
        </div>
      )}

      {auth.phase === "no_wallet" && (
        <div style={s.installPanel}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{t("installWalletTitle")}</span>
            <button style={s.dismissBtn} onClick={() => setAuth({ phase: "idle" })}>×</button>
          </div>
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12, lineHeight: 1.5 }}>
            {t("installWalletDesc")}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" style={s.installLink}>
              🦊 {t("installMetaMask")}
            </a>
            <a href="https://chromewebstore.google.com/detail/okx-wallet/mcohilncbfahbmgdjkbpemcciiolgcge" target="_blank" rel="noopener noreferrer" style={s.installLink}>
              🟠 {t("installOKX")}
            </a>
            <a href="/" style={s.installLink}>
              📦 {t("downloadFromAIMS")}
            </a>
          </div>
        </div>
      )}

      {/* Wallet detection status */}
      <div style={s.statusRow}>
        <span style={{ ...s.dot, background: !mounted ? "var(--muted)" : walletInfo.installed ? (walletInfo.hasAccounts ? "var(--trading-up)" : "var(--primary)") : "var(--muted)" }} />
        {!mounted
          ? t("detectingWallet")
          : walletInfo.installed
            ? walletInfo.hasAccounts ? t("detected", { name: walletInfo.name }) : t("detectedLocked", { name: walletInfo.name })
            : t("noWalletDetected")}
      </div>
      <div style={{ ...s.statusRow, marginBottom: 16 }}>
        <span style={{ ...s.dot, background: wcEnabled ? "var(--trading-up)" : "var(--muted)" }} />
        {wcEnabled ? t("wcReady", { id: getWCProjectId().slice(0, 8) }) : t("wcNoProjectId")}
      </div>

      {/* ── A: Browser Wallet ── */}
      <button style={s.btnYellow} onClick={connectBrowserWallet} disabled={isBusy}>
        <span style={s.btnIcon}>
          {auth.phase === "connecting_wallet" ? "⏳" : auth.phase === "signing" ? "✍" : "🦊"}
        </span>
        <div style={{ textAlign: "left", flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>
            {auth.phase === "connecting_wallet" ? t("openingWallet") :
             auth.phase === "signing" ? t("signMessage") :
             !mounted ? t("browserWallet") :
             walletInfo.installed ? t("connectWith", { name: walletInfo.name }) : t("browserWallet")}
          </div>
          <div style={{ fontSize: 12, fontWeight: 400, opacity: 0.7 }}>
            {!mounted ? t("detectingWalletBtn") :
             walletInfo.installed ? t("clickToSign") : t("requiresExtension")}
          </div>
        </div>
      </button>

      {/* ── B: WalletConnect QR ── */}
      {auth.phase === "qr_loading" ? (
        <div style={s.qrPanel}>
          <div style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>{t("qrLoading")}</div>
        </div>
      ) : auth.phase === "qr_ready" ? (
        <div style={s.qrPanel}>
          <div style={s.qrHeader}>
            <span style={{ fontWeight: 600 }}>{t("scanMobileWallet")}</span>
            <button style={s.dismissBtn} onClick={auth.dismiss}>×</button>
          </div>
          <div style={s.qrCodeWrapper}>
            <img src={auth.qrDataUrl} alt="WalletConnect QR" style={{ width: 220, height: 220, borderRadius: 10 }} />
          </div>
          <p style={s.qrHint}>
            {t("qrHint")}
          </p>
          <details style={{ marginTop: 8 }}>
            <summary style={{ fontSize: 12, color: "var(--muted)", cursor: "pointer" }}>{t("copyLink")}</summary>
            <code style={s.wcUri}>{auth.uri}</code>
          </details>
          <p style={{ ...s.greenNote, fontSize: 11, marginTop: 12 }}>
            {t("oneTimePairing")}
          </p>
        </div>
      ) : auth.phase === "qr_connecting" ? (
        <div style={s.qrPanel}>
          <div style={{ textAlign: "center", padding: 24 }}>
            <div style={{ fontSize: 18, marginBottom: 8 }}>📱</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{t("connected")}</div>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>{t("signingAuth")}</div>
          </div>
        </div>
      ) : (
        <button style={s.btnDark} onClick={showQrCode} disabled={isBusy}>
          <span style={s.btnIcon}>📱</span>
          <div style={{ textAlign: "left", flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{t("scanQR")}</div>
            <div style={{ fontSize: 12, fontWeight: 400, opacity: 0.7 }}>
              {wcEnabled ? t("scanDesc") : t("needsProjectId")}
            </div>
          </div>
        </button>
      )}

      {/* ── C: Social Login ── */}
      {showSocialLogin && (
        <>
          <div style={s.divider}><span style={s.dividerText}>{t("orContinueWith")}</span></div>
          <button style={s.btnOutline} onClick={connectSocialLogin} disabled={isBusy}>
            <span style={s.btnIcon}>🔑</span>
            <div style={{ textAlign: "left", flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>
                {auth.phase === "social_login" ? t("openingSocial") : t("socialLogin")}
              </div>
              <div style={{ fontSize: 12, fontWeight: 400, opacity: 0.7 }}>{t("socialProviders")}</div>
            </div>
          </button>
        </>
      )}

      <p style={s.footer}>
        <a href={okxAffiliateUrl} target="_blank" rel="noopener noreferrer" style={s.footerLink}>
          {t("getOKXWallet")}
        </a>
      </p>
      <p style={{ ...s.greenNote, fontSize: 11, marginTop: 8, textAlign: "center" }}>
        {t("neverAskKey")}
      </p>
    </div>
  );
};

// ── Styles ──────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  card: {
    maxWidth: 460, margin: "0 auto", padding: 36, borderRadius: 12,
    background: "var(--surface-card-dark, #1e2329)",
    border: "1px solid var(--hairline-on-dark, #2b3139)",
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
  },
  lockIcon: { textAlign: "center", fontSize: 28, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 700, margin: "0 0 8px", textAlign: "center", color: "var(--on-dark, #fff)" },
  subtitle: { fontSize: 14, color: "var(--muted)", textAlign: "center", margin: "0 0 16px", lineHeight: 1.5 },
  greenNote: { fontSize: 12, color: "var(--trading-up)", background: "rgba(14,203,129,0.08)", border: "1px solid rgba(14,203,129,0.2)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, lineHeight: 1.5 },
  statusRow: { fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 8, marginBottom: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, display: "inline-block", flexShrink: 0 },
  error: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", marginBottom: 16, borderRadius: 8, background: "rgba(246,70,93,0.1)", border: "1px solid rgba(246,70,93,0.3)", color: "var(--trading-down)", fontSize: 13 },
  installPanel: { padding: "16px 20px", marginBottom: 16, borderRadius: 8, background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.25)", color: "var(--on-dark)", fontSize: 13 },
  installLink: { display: "block", padding: "10px 14px", borderRadius: 6, background: "var(--surface-elevated-dark, #2b3139)", color: "var(--on-dark)", textDecoration: "none", fontSize: 13, fontWeight: 500, transition: "background 0.15s" },
  dismissBtn: { background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "inherit", marginLeft: 12, padding: 0, lineHeight: 1 },
  btnYellow: { width: "100%", padding: "16px 20px", border: "none", borderRadius: 8, background: "var(--primary, #fcd535)", color: "var(--on-primary, #181a20)", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, marginBottom: 12, transition: "background 0.15s" },
  btnDark: { width: "100%", padding: "16px 20px", border: "1px solid var(--hairline-on-dark)", borderRadius: 8, background: "var(--surface-elevated-dark, #2b3139)", color: "var(--on-dark)", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, marginBottom: 12 },
  btnOutline: { width: "100%", padding: "14px 20px", border: "1px solid var(--hairline-on-dark)", borderRadius: 8, background: "transparent", color: "var(--on-dark)", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 },
  btnIcon: { fontSize: 24, flexShrink: 0, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center" },
  qrPanel: { border: "1px solid var(--hairline-on-dark)", borderRadius: 10, padding: 20, marginBottom: 16, background: "var(--canvas-dark, #0b0e11)" },
  qrHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14, color: "var(--on-dark)", marginBottom: 16 },
  qrCodeWrapper: { display: "flex", justifyContent: "center", marginBottom: 14, padding: 14, background: "#fff", borderRadius: 14 },
  qrHint: { fontSize: 13, color: "var(--muted)", textAlign: "center", lineHeight: 1.5, margin: 0 },
  wcUri: { display: "block", marginTop: 8, padding: 8, fontSize: 10, background: "var(--canvas-dark)", borderRadius: 6, wordBreak: "break-all", color: "var(--muted)" },
  divider: { display: "flex", alignItems: "center", margin: "16px 0" },
  dividerText: { margin: "0 auto", color: "var(--muted)", fontSize: 13, fontWeight: 500, padding: "0 12px" },
  footer: { marginTop: 20, fontSize: 13, color: "var(--muted)", textAlign: "center" },
  footerLink: { color: "var(--primary, #fcd535)", fontWeight: 600, textDecoration: "none" },
  checkmark: { width: 48, height: 48, borderRadius: 24, background: "var(--trading-up)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 12px" },
  wallet: { fontSize: 12, fontFamily: "monospace", color: "var(--muted)", textAlign: "center", wordBreak: "break-all" },
};

export default LoginV2;
export type { AuthState, LoginV2Props };
