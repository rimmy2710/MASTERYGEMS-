export type MgIdentity = {
  hostId: string;
  hostName: string;
  playerId: string;
  playerName: string;
};

const STORAGE_KEY = "mg.identity.v1";

/**
 * Normalize player id to prevent case drift and reduce injection surface.
 * Rules:
 * - trim
 * - lowercase
 * - allow only [a-z0-9_-]
 */
export function normalizePlayerId(input: string): string {
  return (input ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");
}

/**
 * Display names are allowed to contain spaces, but we still strip
 * obviously risky characters.
 */
export function normalizeDisplayName(input: string): string {
  const raw = (input ?? "").trim();
  // Allow letters, numbers, space, underscore, dash, dot.
  return raw.replace(/[^a-z0-9 _\-.]/gi, "");
}

export function hasUnsafeIdChars(input: string): boolean {
  return /[^a-z0-9_-]/i.test((input ?? "").trim());
}

export function loadIdentity(fallback?: Partial<MgIdentity>): MgIdentity {
  const fb: MgIdentity = {
    hostId: fallback?.hostId ?? "p1",
    hostName: fallback?.hostName ?? "Host",
    playerId: fallback?.playerId ?? "p2",
    playerName: fallback?.playerName ?? "P2",
  };

  if (typeof window === "undefined") return fb;

  try {
    const txt = window.localStorage.getItem(STORAGE_KEY);
    if (!txt) return fb;

    const parsed = JSON.parse(txt) as Partial<MgIdentity>;
    const hostId = normalizePlayerId(parsed.hostId ?? fb.hostId);
    const playerId = normalizePlayerId(parsed.playerId ?? fb.playerId);

    return {
      hostId: hostId || normalizePlayerId(fb.hostId),
      hostName: normalizeDisplayName(parsed.hostName ?? fb.hostName) || fb.hostName,
      playerId: playerId || normalizePlayerId(fb.playerId),
      playerName: normalizeDisplayName(parsed.playerName ?? fb.playerName) || fb.playerName,
    };
  } catch {
    return fb;
  }
}

export function saveIdentity(next: MgIdentity): void {
  if (typeof window === "undefined") return;

  const payload: MgIdentity = {
    hostId: normalizePlayerId(next.hostId),
    hostName: normalizeDisplayName(next.hostName),
    playerId: normalizePlayerId(next.playerId),
    playerName: normalizeDisplayName(next.playerName),
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage failures
  }
}
