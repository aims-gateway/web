import SignClient from "@walletconnect/sign-client";
import type { SessionTypes } from "@walletconnect/types";

const PROJECT_ID = process.env.NEXT_PUBLIC_WC_PROJECT_ID || "";

let signClient: SignClient | null = null;

export async function getSignClient(): Promise<SignClient | null> {
  if (!PROJECT_ID) return null;
  if (signClient) return signClient;

  try {
    signClient = await SignClient.init({
      projectId: PROJECT_ID,
      relayUrl: "wss://relay.walletconnect.com",
      metadata: {
        name: "AIMS v2",
        description: "Agent Intelligence Mesh Settlement",
        url: typeof window !== "undefined" ? window.location.origin : "https://aimsgateway.com",
        icons: [],
      },
    });
    return signClient;
  } catch (err) {
    console.warn("WalletConnect init failed:", err);
    return null;
  }
}

export interface WCPairing {
  uri: string;
  approval: () => Promise<SessionTypes.Struct>;
}

let approvalResolve: ((session: SessionTypes.Struct) => void) | null = null;
let approvalReject: ((err: Error) => void) | null = null;

export async function createPairing(): Promise<WCPairing | null> {
  const client = await getSignClient();
  if (!client) return null;

  try {
    const { uri, approval } = await client.connect({
      pairingTopic: undefined,
      requiredNamespaces: {
        eip155: {
          methods: [
            "eth_sendTransaction",
            "eth_signTransaction",
            "personal_sign",
            "eth_sign",
            "eth_signTypedData",
          ],
          chains: ["eip155:1", "eip155:137", "eip155:56", "eip155:8453", "eip155:84532", "eip155:31337"],
          events: ["accountsChanged", "chainChanged", "disconnect"],
        },
      },
    });

    if (!uri) return null;

    return {
      uri,
      approval: async () => approval(),
    };
  } catch (err) {
    console.warn("createPairing failed:", err);
    return null;
  }
}

export async function signMessageWC(
  session: SessionTypes.Struct,
  wallet: string,
  message: string,
): Promise<string> {
  const client = await getSignClient();
  if (!client) throw new Error("WalletConnect not initialized");

  const result = await client.request<string>({
    topic: session.topic,
    chainId: "eip155:1",
    request: {
      method: "personal_sign",
      params: [message, wallet],
    },
  });

  return result;
}

export async function disconnectWC(session: SessionTypes.Struct): Promise<void> {
  const client = await getSignClient();
  if (!client) return;
  try {
    await client.disconnect({ topic: session.topic, reason: { code: 6000, message: "User disconnected" } });
  } catch {
    // ignore
  }
}

export function isWalletConnectAvailable(): boolean {
  return !!PROJECT_ID;
}

export function getWCProjectId(): string {
  return PROJECT_ID;
}
