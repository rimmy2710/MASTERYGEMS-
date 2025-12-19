// backend/src/utils/sessionToken.ts
import crypto from "crypto";

function b64urlEncode(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, "utf8");
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function b64urlDecodeToString(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((input.length + 3) % 4);
  return Buffer.from(padded, "base64").toString("utf8");
}

export function getBearerToken(authHeader?: string): string | null {
  if (!authHeader) return null;
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

export function sanitizeDisplayName(name?: string): string | undefined {
  if (!name) return undefined;
  const trimmed = name.trim();
  if (!trimmed) return undefined;
  // Allow letters/numbers/spaces/._- only. Limit length to reduce abuse/log noise.
  const safe = trimmed.replace(/[^\p{L}\p{N}\s._-]/gu, "").slice(0, 40);
  return safe || undefined;
}

export function normalizePlayerId(raw: string): string {
  // Strict ID: lowercase, [a-z0-9_-], max 32 chars
  return raw.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 32);
}

export function signSessionToken(args: {
  secret: string;
  playerId: string;
  displayName?: string;
  iat?: number;
}): string {
  const payloadObj = {
    v: 1,
    playerId: normalizePlayerId(args.playerId),
    displayName: sanitizeDisplayName(args.displayName),
    iat: args.iat ?? Date.now(),
  };

  const payloadJson = JSON.stringify(payloadObj);
  const payloadB64 = b64urlEncode(payloadJson);
  const sig = crypto.createHmac("sha256", args.secret).update(payloadB64).digest();
  const sigB64 = b64urlEncode(sig);
  return `${payloadB64}.${sigB64}`;
}

export function verifySessionToken(args: { secret: string; token: string }):
  | { ok: true; playerId: string; displayName?: string }
  | { ok: false } {
  const parts = (args.token || "").split(".");
  if (parts.length !== 2) return { ok: false };

  const [payloadB64, sigB64] = parts;

  const expectedSig = crypto.createHmac("sha256", args.secret).update(payloadB64).digest();
  const expectedSigB64 = b64urlEncode(expectedSig);

  // timing-safe compare
  const a = Buffer.from(expectedSigB64);
  const b = Buffer.from(sigB64);
  if (a.length !== b.length) return { ok: false };
  if (!crypto.timingSafeEqual(a, b)) return { ok: false };

  let payload: any = null;
  try {
    payload = JSON.parse(b64urlDecodeToString(payloadB64));
  } catch {
    return { ok: false };
  }

  const pid = typeof payload?.playerId === "string" ? normalizePlayerId(payload.playerId) : "";
  if (!pid) return { ok: false };

  const dn = typeof payload?.displayName === "string" ? sanitizeDisplayName(payload.displayName) : undefined;
  return { ok: true, playerId: pid, displayName: dn };
}
