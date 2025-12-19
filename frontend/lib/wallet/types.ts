export type EvmIdentity = {
  kind: "evm";
  address: `0x${string}`;
  chainId: number;
  connector: "injected" | "walletconnect";
};
