import { API_BASE_URL } from "./config";
import { GameState, MoveOption, Room, RoomStateResponse } from "./types";

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed");
  }
  return response.json() as Promise<T>;
}

export async function getRooms(): Promise<Room[]> {
  const response = await fetch(`${API_BASE_URL}/rooms`, { method: "GET" });
  const data = await handleResponse<{ rooms: Room[] }>(response);
  return data.rooms;
}

export async function createRoom(payload: {
  type: "public" | "creator";
  stake: 1 | 5 | 10;
  maxPlayers: number;
  minPlayers: number;
}): Promise<Room> {
  const response = await fetch(`${API_BASE_URL}/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<Room>(response);
}

export async function getRoomState(id: string): Promise<RoomStateResponse> {
  const response = await fetch(`${API_BASE_URL}/rooms/${id}/state`, { method: "GET" });
  return handleResponse<RoomStateResponse>(response);
}

export async function joinRoom(id: string, playerId: string): Promise<Room> {
  const response = await fetch(`${API_BASE_URL}/rooms/${id}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerId }),
  });
  return handleResponse<Room>(response);
}

export async function commitMove(id: string, playerId: string, commitHash: string): Promise<GameState> {
  const response = await fetch(`${API_BASE_URL}/rooms/${id}/commit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerId, commitHash }),
  });
  return handleResponse<GameState>(response);
}

export async function revealMove(
  id: string,
  playerId: string,
  move: MoveOption,
  salt: string
): Promise<GameState> {
  const response = await fetch(`${API_BASE_URL}/rooms/${id}/reveal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerId, move, salt }),
  });
  return handleResponse<GameState>(response);
}
