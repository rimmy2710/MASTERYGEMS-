import { API_BASE_URL } from "./config";

export type Room = {
  id: string;
  type?: string;
  stake?: number;
  players?: number;
  status?: string;
};

async function request(path: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    ...init,
    headers: {
      accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${init?.method ?? "GET"} ${API_BASE_URL}${path} -> ${res.status} ${text}`);
  }

  return res;
}

export async function getRooms(): Promise<Room[]> {
  const res = await request(`/rooms`);
  return (await res.json()) as Room[];
}

// ✅ POST tạo room: gửi JSON + content-type để tránh 400
export async function createRoom(): Promise<any> {
  const res = await request(`/rooms`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ type: "test", stake: 1 }),
  });
  return await res.json().catch(() => ({}));
}

export async function getRoomState(id: string): Promise<any> {
  const res = await request(`/rooms/${id}/state`);
  return await res.json();
}

export async function joinRoom(id: string): Promise<any> {
  const res = await request(`/rooms/${id}/join`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({}),
  });
  return await res.json().catch(() => ({}));
}

export async function commitMove(id: string, payload: any): Promise<any> {
  const res = await request(`/rooms/${id}/commit`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload ?? {}),
  });
  return await res.json().catch(() => ({}));
}

export async function revealMove(id: string, payload: any): Promise<any> {
  const res = await request(`/rooms/${id}/reveal`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload ?? {}),
  });
  return await res.json().catch(() => ({}));
}
