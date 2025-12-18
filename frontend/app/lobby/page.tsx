// frontend/app/lobby/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../../lib/config";

type Room = {
  id: string;
  type: "public" | "creator";
  stake: 1 | 5 | 10;
  maxPlayers: number;
  minPlayers: number;
  players: { id: string; joinedAt: number }[];
  status: "waiting" | "in-progress" | "finished";
  createdAt: number;
};

type GameSummary = {
  id: string;
  phase: "lobby" | "running" | "finished";
  createdAt: number;
  startedAt?: number;
  finishedAt?: number;
  playersCount: number;
  stake: number;
};

type RoomOverview = Room & {
  game: GameSummary | null;
};

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
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
    // ignore
  }

  if (!res.ok) {
    const msg =
      json?.error?.message ||
      json?.error ||
      json?.message ||
      `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  return json as T;
}

export default function LobbyPage() {
  const [rooms, setRooms] = useState<RoomOverview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // MVP identities (later replace with auth/wallet)
  const [hostId, setHostId] = useState("p1");
  const [hostName, setHostName] = useState("Host");
  const [playerId, setPlayerId] = useState("p2");
  const [playerName, setPlayerName] = useState("P2");

  const canAct = useMemo(() => !loading, [loading]);

  const loadRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiJson<{ ok: true; data: RoomOverview[] }>("/overview/rooms");
      setRooms(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };

  const createRoomOnly = async () => {
    try {
      setLoading(true);
      setError(null);

      await apiJson<Room>("/rooms", {
        method: "POST",
        body: JSON.stringify({ type: "public", stake: 1, maxPlayers: 10, minPlayers: 2 }),
      });

      await loadRooms();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  const createRoomWithGame = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1) create room
      const room = await apiJson<Room>("/rooms", {
        method: "POST",
        body: JSON.stringify({ type: "public", stake: 1, maxPlayers: 10, minPlayers: 2 }),
      });

      // 2) create (or reuse) game for that room with host
      await apiJson<{ ok: true; data: { gameId: string; reused: boolean } }>(`/rooms/${room.id}/game`, {
        method: "POST",
        body: JSON.stringify({ hostPlayerId: hostId, hostDisplayName: hostName }),
      });

      await loadRooms();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create room+game");
    } finally {
      setLoading(false);
    }
  };

  const joinRoomGame = async (roomId: string) => {
    try {
      setLoading(true);
      setError(null);

      await apiJson(`/rooms/${roomId}/game/join`, {
        method: "POST",
        body: JSON.stringify({ playerId, displayName: playerName }),
      });

      await loadRooms();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join");
    } finally {
      setLoading(false);
    }
  };

  const ready = async (roomId: string, pid: string) => {
    try {
      setLoading(true);
      setError(null);

      await apiJson(`/rooms/${roomId}/game/ready`, {
        method: "POST",
        body: JSON.stringify({ playerId: pid }),
      });

      await loadRooms();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to ready");
    } finally {
      setLoading(false);
    }
  };

  const start = async (roomId: string) => {
    try {
      setLoading(true);
      setError(null);

      await apiJson(`/rooms/${roomId}/game/start`, {
        method: "POST",
        body: JSON.stringify({ playerId: hostId }),
      });

      await loadRooms();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start");
    } finally {
      setLoading(false);
    }
  };

  const finish = async (roomId: string) => {
    try {
      setLoading(true);
      setError(null);

      await apiJson(`/rooms/${roomId}/game/finish`, {
        method: "POST",
        body: JSON.stringify({ playerId: hostId }),
      });

      await loadRooms();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to finish");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section style={{ padding: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <h1 style={{ margin: 0 }}>Lobby</h1>

        <button onClick={loadRooms} disabled={!canAct}>
          Refresh
        </button>

        <button onClick={createRoomOnly} disabled={!canAct}>
          Create Room
        </button>

        <button onClick={createRoomWithGame} disabled={!canAct}>
          Create Room + Game (Host)
        </button>

        <span style={{ opacity: 0.7 }}>Host:</span>
        <input value={hostId} onChange={(e) => setHostId(e.target.value)} style={{ padding: "0.35rem 0.5rem" }} />
        <input value={hostName} onChange={(e) => setHostName(e.target.value)} style={{ padding: "0.35rem 0.5rem" }} />

        <span style={{ opacity: 0.7 }}>Player:</span>
        <input value={playerId} onChange={(e) => setPlayerId(e.target.value)} style={{ padding: "0.35rem 0.5rem" }} />
        <input
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          style={{ padding: "0.35rem 0.5rem" }}
        />

        <span style={{ marginLeft: "auto", opacity: 0.7 }}>
          Uses: <code>{API_BASE_URL}</code> → <code>/overview/rooms</code>
        </span>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "#b91c1c", marginTop: "0.5rem" }}>{error}</p>}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "#ffffff" }}>
          <thead>
            <tr>
              <th style={th}>Room ID</th>
              <th style={th}>Type</th>
              <th style={th}>Stake</th>
              <th style={th}>Room Players</th>
              <th style={th}>Room Status</th>
              <th style={th}>Game</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {rooms.length === 0 && !loading ? (
              <tr>
                <td colSpan={7} style={{ padding: "0.75rem" }}>
                  No rooms available.
                </td>
              </tr>
            ) : (
              rooms.map((room) => (
                <tr key={room.id}>
                  <td style={td}>{room.id}</td>
                  <td style={td}>{room.type}</td>
                  <td style={td}>{room.stake}</td>
                  <td style={td}>
                    {room.players.length} / {room.maxPlayers}
                  </td>
                  <td style={td}>{room.status}</td>
                  <td style={td}>
                    {room.game ? (
                      <span>
                        {room.game.phase} ({room.game.playersCount})
                      </span>
                    ) : (
                      <span style={{ opacity: 0.6 }}>—</span>
                    )}
                  </td>
                  <td style={td}>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      <button onClick={() => joinRoomGame(room.id)} disabled={!canAct}>
                        Join (as {playerId})
                      </button>

                      <button onClick={() => ready(room.id, playerId)} disabled={!canAct}>
                        Ready (as {playerId})
                      </button>

                      <button onClick={() => start(room.id)} disabled={!canAct}>
                        Start (as {hostId})
                      </button>

                      <button onClick={() => finish(room.id)} disabled={!canAct}>
                        Finish (as {hostId})
                      </button>

                      <Link href={`/battle/${room.id}`} style={{ color: "#2563eb", alignSelf: "center" }}>
                        Open
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const th: React.CSSProperties = {
  borderBottom: "1px solid #e5e7eb",
  textAlign: "left",
  padding: "0.5rem",
  whiteSpace: "nowrap",
};

const td: React.CSSProperties = {
  padding: "0.75rem",
  borderBottom: "1px solid #e5e7eb",
  verticalAlign: "top",
};
