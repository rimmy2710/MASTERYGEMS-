// frontend/lib/api.ts

import {
  Room,
  RoomStateResponse,
  MoveOption,
  GameState,
} from "./types";
import { API_BASE_URL } from "./config";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      if (data && typeof (data as any).error === "string") {
        message = (data as any).error;
      }
    } catch {
      // ignore parse error
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

export async function getRooms(): Promise<Room[]> {
  const res = await fetch(`${API_BASE_URL}/rooms`, {
    method: "GET",
    cache: "no-store",
  });

  const data = await handleResponse<{ rooms: Room[] }>(res);
  return data.rooms;
}

export async function createRoom(payload: {
  type: "public" | "creator";
  stake: 1 | 5 | 10;
  maxPlayers: number;
  minPlayers: number;
}): Promise<Room> {
  const res = await fetch(`${API_BASE_URL}/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await handleResponse<{ room: Room }>(res);
  return data.room;
}

export async function getRoomState(id: string): Promise<RoomStateResponse> {
  const res = await fetch(`${API_BASE_URL}/rooms/${id}/state`, {
    method: "GET",
    cache: "no-store",
  });

  return handleResponse<RoomStateResponse>(res);
}

export async function joinRoom(id: string, playerId: string): Promise<Room> {
  const res = await fetch(`${API_BASE_URL}/rooms/${id}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerId }),
  });

  const data = await handleResponse<{ room: Room }>(res);
  return data.room;
}

export async function commitMove(
  id: string,
  playerId: string,
  commitHash: string
): Promise<GameState> {
  const res = await fetch(`${API_BASE_URL}/rooms/${id}/commit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerId, commitHash }),
  });

  const data = await handleResponse<{ game: GameState }>(res);
  return data.game;
}

export async function revealMove(
  id: string,
  playerId: string,
  move: MoveOption,
  salt: string
): Promise<GameState> {
  const res = await fetch(`${API_BASE_URL}/rooms/${id}/reveal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerId, move, salt }),
  });

  const data = await handleResponse<{ game: GameState }>(res);
  return data.game;
}
