// frontend/lib/apiV2.ts
// Additive client for v2 endpoints: always expects { ok, data } envelope.
// Safe: does not log internal URLs or secrets.

import { API_BASE_URL } from "./config";

export type ApiErrorShape =
  | string
  | { code?: string; message: string };

export type ApiEnvelopeOk<T> = { ok: true; data: T };
export type ApiEnvelopeErr = { ok: false; error: ApiErrorShape };
export type ApiEnvelope<T> = ApiEnvelopeOk<T> | ApiEnvelopeErr;

function isEnvelope<T>(x: any): x is ApiEnvelope<T> {
  return x && typeof x === "object" && typeof x.ok === "boolean";
}

function errorToMessage(e: ApiErrorShape): string {
  if (typeof e === "string") return e;
  return e.message || "Unknown error";
}

async function requestV2<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // keep null
  }

  // If server returned non-JSON, treat as error
  if (!json) {
    if (res.ok) throw new Error("Unexpected empty response");
    throw new Error(text || `Request failed: ${res.status}`);
  }

  if (!isEnvelope<T>(json)) {
    // Unexpected shape: don't silently accept to avoid bugs
    throw new Error("Unexpected response shape (expected v2 envelope)");
  }

  if (!json.ok) {
    const msg = errorToMessage(json.error);
    throw new Error(msg);
  }

  return json.data;
}

/** ---- Domain types (minimal, FE-friendly) ---- */
export type Room = {
  id: string;
  type: "public" | "creator";
  stake: 1 | 5 | 10;
  maxPlayers: number;
  minPlayers: number;
  players: { id: string; joinedAt: number }[];
  status: "waiting" | "in-progress" | "finished";
  createdAt: number;
};

export type GameState = {
  id: string;
  roomId: string;
  phase: "lobby" | "running" | "finished";
  createdAt: number;
  startedAt?: number;
  finishedAt?: number;
  config: {
    roomId: string;
    stake: 1 | 5 | 10;
    minPlayers: number;
    maxPlayers: number;
  };
  players: Array<{
    id: string;
    displayName?: string;
    joinedAt: number;
    isReady: boolean;
    isHost?: boolean;
  }>;
  meta?: Record<string, any>;
};

/** ---- Rooms v2 ---- */
export function v2ListRooms() {
  return requestV2<Room[]>("/v2/rooms");
}

export function v2CreateRoom(input: {
  type: "public" | "creator";
  stake: 1 | 5 | 10;
  maxPlayers: number;
  minPlayers: number;
}) {
  return requestV2<Room>("/v2/rooms", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function v2JoinRoom(roomId: string, input: { playerId: string }) {
  return requestV2<{ room: Room }>(`/v2/rooms/${roomId}/join`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function v2GetRoomState(roomId: string) {
  return requestV2<Room>(`/v2/rooms/${roomId}/state`);
}

/** ---- Games v2 ---- */
export function v2GamesHealth() {
  return requestV2<{ status: string; module: string }>("/v2/games/health");
}

export function v2CreateGame(input: {
  roomId: string;
  stake: 1 | 5 | 10;
  minPlayers: number;
  maxPlayers: number;
  hostPlayerId?: string;
  hostDisplayName?: string;
}) {
  return requestV2<GameState>("/v2/games", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function v2GetGame(gameId: string) {
  return requestV2<GameState>(`/v2/games/${gameId}`);
}

export function v2ListGamesByRoom(roomId: string) {
  return requestV2<GameState[]>(`/v2/rooms/${roomId}/games`);
}

export function v2JoinGame(gameId: string, input: { playerId: string; displayName?: string }) {
  return requestV2<GameState>(`/v2/games/${gameId}/join`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function v2Action(gameId: string, input: { type: "PLAYER_READY" | "PLAYER_UNREADY" | "START_GAME" | "FINISH_GAME"; playerId?: string; at?: number }) {
  return requestV2<GameState>(`/v2/games/${gameId}/action`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
