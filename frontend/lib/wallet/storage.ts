import type { EvmIdentity } from "./types";

const KEY = "mg_evm_identity_v1";

export function saveIdentity(id: EvmIdentity) {
  localStorage.setItem(KEY, JSON.stringify(id));
}

export function loadIdentity(): EvmIdentity | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.kind !== "evm") return null;
    return parsed as EvmIdentity;
  } catch {
    return null;
  }
}

export function clearIdentity() {
  localStorage.removeItem(KEY);
}
