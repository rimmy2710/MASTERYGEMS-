import type { EvmIdentity } from "./types";

export async function attachWalletToBackend(identity: EvmIdentity) {
  const res = await fetch("/api/backend/v2/wallet/attach", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ address: identity.address, chainId: identity.chainId }),
  });

  const json = await res.json();
  if (!res.ok || !json?.ok) {
    throw new Error(json?.error ?? "Attach failed");
  }
  return json.data as { walletKey: string; playerId: string };
}
