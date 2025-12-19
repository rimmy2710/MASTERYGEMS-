import crypto from "crypto";

export type WalletAttachInput = {
  address: string;
  chainId: number;
};

export type WalletAttachResult = {
  walletKey: string; // evm:0x...
  playerId: string;  // stable for the same walletKey
};

function isValidEvmAddress(addr: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

function normalizeEvmAddress(addr: string) {
  return addr.toLowerCase();
}

/**
 * In-memory identity store (Phase 4.1).
 * - Resets on server restart (OK for MVP phase).
 * - No secrets used.
 */
class WalletIdentityStore {
  private map = new Map<string, string>();

  attachEvmWallet(address: string, chainId: number): WalletAttachResult {
    if (!Number.isInteger(chainId) || chainId <= 0) {
      throw new Error("Invalid chainId");
    }
    if (!isValidEvmAddress(address)) {
      throw new Error("Invalid EVM address");
    }

    const normalized = normalizeEvmAddress(address);
    const walletKey = `evm:${normalized}`;

    const existing = this.map.get(walletKey);
    if (existing) return { walletKey, playerId: existing };

    // Deterministic playerId from walletKey (no secret). Stable across restarts? No (map resets).
    // That's fine in Phase 4.1 because we only need stable within a server uptime.
    const h = crypto.createHash("sha256").update(walletKey).digest("hex");
    const playerId = `w_${h.slice(0, 10)}`;

    this.map.set(walletKey, playerId);
    return { walletKey, playerId };
  }

  getPlayerId(walletKey: string) {
    return this.map.get(walletKey);
  }

  size() {
    return this.map.size;
  }
}

export const walletIdentityStore = new WalletIdentityStore();
