// frontend/lib/identity.ts
// Frontend-only identity v0 (no wallet, no backend auth).
// Stores a stable playerId + displayName per browser via localStorage.
// Does NOT log internal URLs/secrets.

export type Identity = {
  playerId: string;
  displayName: string;
};

const KEY_ID = "mg.playerId";
const KEY_NAME = "mg.displayName";

function normalizePlayerId(input: string): string {
  return input.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
}

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function safeRemove(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function randomId(prefix = "p"): string {
  // Prefer crypto for unpredictability; fallback to Math.random for older envs.
  try {
    const bytes = new Uint8Array(8);
    window.crypto.getRandomValues(bytes);
    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return `${prefix}${hex}`;
  } catch {
    return `${prefix}${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;
  }
}

export function getOrCreateIdentity(): Identity {
  const existingRaw = safeGet(KEY_ID);
  let playerId = existingRaw ? normalizePlayerId(existingRaw) : "";

  if (!playerId) {
    playerId = normalizePlayerId(randomId("p"));
    safeSet(KEY_ID, playerId);
  } else if (existingRaw !== playerId) {
    // normalize persisted
    safeSet(KEY_ID, playerId);
  }

  const displayName = safeGet(KEY_NAME) ?? "";
  return { playerId, displayName };
}

export function setDisplayName(name: string) {
  // Allow spaces; remove extreme length to reduce accidental logging / UI issues
  const clean = (name ?? "").trim().slice(0, 40);
  safeSet(KEY_NAME, clean);
}

export function resetIdentity() {
  safeRemove(KEY_ID);
  safeRemove(KEY_NAME);
}

export function setPlayerId(raw: string) {
  const id = normalizePlayerId(raw);
  if (!id) return;
  safeSet(KEY_ID, id);
}

export function copyToClipboard(text: string) {
  try {
    void navigator.clipboard.writeText(text);
  } catch {
    // ignore
  }
}
