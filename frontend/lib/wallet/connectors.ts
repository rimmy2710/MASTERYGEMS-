import type { EvmIdentity } from "./types";

declare global {
  interface Window {
    ethereum?: any;
  }
}

function toHexChainId(n: number) {
  return "0x" + n.toString(16);
}

function normalizeAddress(addr: string) {
  return addr.toLowerCase() as `0x${string}`;
}

export async function connectInjected(requiredChainId?: number): Promise<EvmIdentity> {
  const eth = window.ethereum;
  if (!eth) throw new Error("No injected wallet found");

  const accounts: string[] = await eth.request({ method: "eth_requestAccounts" });
  const address = (accounts?.[0] ?? "") as `0x${string}`;
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) throw new Error("Invalid address");

  const chainIdHex: string = await eth.request({ method: "eth_chainId" });
  const chainId = parseInt(chainIdHex, 16);

  if (requiredChainId && chainId !== requiredChainId) {
    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: toHexChainId(requiredChainId) }],
    });
  }

  const finalChainIdHex: string = await eth.request({ method: "eth_chainId" });
  const finalChainId = parseInt(finalChainIdHex, 16);

  return {
    kind: "evm",
    address: normalizeAddress(address),
    chainId: finalChainId,
    connector: "injected",
  };
}

export async function connectWalletConnect(
  wcProjectId: string,
  requiredChainId: number
): Promise<{ identity: EvmIdentity; provider: any }> {
  const EthereumProvider = (await import("@walletconnect/ethereum-provider")).default;

  const provider = await EthereumProvider.init({
    projectId: wcProjectId,
    chains: [requiredChainId],
    showQrModal: true,
  });

  await provider.enable();

  const accounts: string[] = provider.accounts || [];
  const address = (accounts?.[0] ?? "") as `0x${string}`;
  const chainId: number = provider.chainId;

  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) throw new Error("Invalid address");

  return {
    identity: {
      kind: "evm",
      address: normalizeAddress(address),
      chainId,
      connector: "walletconnect",
    },
    provider,
  };
}
