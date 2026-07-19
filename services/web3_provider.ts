/**
 * AIMS v2 — Web3 Provider Bridge (viem)
 *
 * Connects the browser wallet (MetaMask / WalletConnect / Coinbase) to the
 * AIMS v2 backend authentication and settlement pipeline.  Every signature
 * is an EIP-191 ``personal_sign`` over a canonical AIMS challenge string.
 *
 * Usage::
 *
 *   import { generateV2HandshakeSignature } from './web3_provider';
 *   const { wallet, signature, nonce } = await generateV2HandshakeSignature();
 *   const auth = await postHandshake(wallet, signature, nonce);
 */

import {
  createWalletClient,
  custom,
  getAddress,
  type WalletClient,
} from "viem";

// ── Canonical AIMS v2 authentication message template ───────────────────
const AIMS_AUTH_MESSAGE = (nonce: string): string =>
  `AIMS v2 Authentication\nNonce: ${nonce}`;


// ── Types ────────────────────────────────────────────────────────────────

export interface HandshakePayload {
  wallet: string;
  signature: string;
  nonce: string;
}

export interface AuthResponse {
  token: string;
  wallet: string;
  tier: string;
  quota_max: number | null;
  quota_used: number;
}

export interface V2ProviderError {
  code: "WALLET_REJECTED" | "WALLET_NOT_FOUND" | "SIGN_FAILED" | "AUTH_FAILED";
  message: string;
}

// ── Provider detection ───────────────────────────────────────────────────

function detectProvider(): unknown {
  if (typeof window === "undefined") {
    throw new Error("window is not defined — web3_provider requires a browser");
  }
  const w = window as unknown as Record<string, unknown>;
  const provider =
    w.ethereum ||
    (w as Record<string, Record<string, unknown>>).phantom?.ethereum;
  if (!provider) {
    throw Object.assign(
      new Error(
        "No Web3 wallet detected. Install MetaMask, WalletConnect, or another EIP-1193 provider.",
      ),
      { code: "WALLET_NOT_FOUND" as const },
    );
  }
  return provider;
}

// ── Wallet client (lazy singleton) ───────────────────────────────────────

let _walletClient: WalletClient | null = null;

function getWalletClient(): WalletClient {
  if (!_walletClient) {
    const provider = detectProvider();
    _walletClient = createWalletClient({
      transport: custom(provider as Parameters<typeof custom>[0]),
    });
  }
  return _walletClient;
}

// ── Core signing function ─────────────────────────────────────────────────

/**
 * Request an EIP-191 ``personal_sign`` over the canonical AIMS v2
 * authentication challenge.
 *
 * 1. Detects the injected EIP-1193 provider.
 * 2. Prompts the user to sign ``"AIMS v2 Authentication\\nNonce: <nonce>"``.
 * 3. Returns the 0x-prefixed hex signature and the checksummed wallet address.
 *
 * @param nonce  A fresh nonce obtained from ``GET /api/v2/developer/nonce``.
 * @throws {V2ProviderError}  If the wallet is missing, the user rejects the
 *                            signature, or the provider returns an error.
 */
export async function generateV2HandshakeSignature(
  nonce: string,
): Promise<HandshakePayload> {
  const client = getWalletClient();

  // Request wallet accounts
  let addresses: readonly `0x${string}`[];
  try {
    addresses = await client.requestAddresses();
  } catch {
    try {
      addresses = await client.requestAddresses();
    } catch (err: unknown) {
      throw Object.assign(
        new Error(
          `Failed to request wallet accounts: ${(err as Error)?.message ?? err}`,
        ),
        { code: "WALLET_REJECTED" as const },
      );
    }
  }

  if (!addresses || addresses.length === 0) {
    throw Object.assign(new Error("No accounts available in wallet."), {
      code: "WALLET_NOT_FOUND" as const,
    });
  }

  const wallet = getAddress(addresses[0]);
  const message = AIMS_AUTH_MESSAGE(nonce);

  let signature: `0x${string}`;
  try {
    signature = await client.signMessage({
      account: wallet,
      message,
    });
  } catch (err: unknown) {
    throw Object.assign(
      new Error(
        `Signature rejected or failed: ${(err as Error)?.message ?? err}`,
      ),
      { code: "SIGN_FAILED" as const },
    );
  }

  return { wallet, signature, nonce };
}

// ── Backend handshake submission ──────────────────────────────────────────

/**
 * Post the signed handshake payload to ``POST /api/v2/blockchain/verify-tx``
 * for backend-side cross-verification.
 *
 * The backend verifies signature integrity (EIP-191 recovery) and, when a
 * blockchain verifier is configured, cross-checks the transaction receipt
 * against an RPC node to defeat client-side forgery.
 */
export async function postHandshake(
  wallet: string,
  signature: string,
  nonce: string,
): Promise<AuthResponse> {
  const url = `/api/v2/blockchain/verify-tx`;

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet, signature, nonce }),
  });

  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw Object.assign(
      new Error(
        `Auth handshake failed [${resp.status}]: ${body?.detail ?? "unknown error"}`,
      ),
      { code: "AUTH_FAILED" as const },
    );
  }

  return resp.json() as Promise<AuthResponse>;
}

// ── Convenience: full flow in one call ────────────────────────────────────

/**
 * Complete AIMS v2 handshake flow:
 *
 * 1. Fetches a fresh nonce from ``GET /api/v2/developer/nonce``.
 * 2. Requests an EIP-191 signature from the wallet.
 * 3. Posts the signed payload to the backend for verification.
 *
 * Returns the authenticated session payload including tier and quota info.
 */
export async function performFullHandshake(): Promise<AuthResponse> {
  // 1. Fetch nonce
  const nonceResp = await fetch(`/api/v2/developer/nonce`);
  if (!nonceResp.ok) {
    throw Object.assign(
      new Error(`Failed to fetch nonce: ${nonceResp.status}`),
      { code: "AUTH_FAILED" as const },
    );
  }
  const { nonce } = (await nonceResp.json()) as { nonce: string };

  // 2. Sign
  const { wallet, signature } =
    await generateV2HandshakeSignature(nonce);

  // 3. Post
  return postHandshake(wallet, signature, nonce);
}

// ── Re-exports for convenience ────────────────────────────────────────────

export { getAddress, getWalletClient };
export type { WalletClient };
