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

// Normalize player IDs to prevent case drift (P2 vs p2) and reduce injection surface.
function normalizePlayerId(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");
}

function hasUnsafeChars(input: string): boolean {
  // allow spaces for display name; ID should be strict
  return /[^a-z0-9 _-]/i.test(input);
}

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "0.5rem",
  borderBottom: "1px solid #e5e7eb",
  backgroundColor: "#f9fafb",
  fontWeight: 600,
};

const td: React.CSSProperties = {
  padding: "0.5rem",
  borderBottom: "1px solid #e5e7eb",
  verticalAlign: "top",
};

export default function LobbyPage() {
  const [rooms, setRooms] = useState<RoomOverview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // MVP identities (later replace with auth/wallet)
  const [hostIdRaw, setHostIdRaw] = useState("p1");
  const [hostName, setHostName] = useState("Host");
  const [playerIdRaw, setPlayerIdRaw] = useState("p2");
  const [playerName, setPlayerName] = useState("P2");

  const hostId = useMemo(() => normalizePlayerId(hostIdRaw), [hostIdRaw]);
  const playerId = useMemo(() => normalizePlayerId(playerIdRaw), [playerIdRaw]);

  const canAct = useMemo(() => !loading, [loading]);

  const idWarnings = useMemo(() => {
    const warnings: string[] = [];
    if (hostIdRaw !== hostId) warnings.push(`Host ID đã được normalize thành "${hostId}"`);
    if (playerIdRaw !== playerId) warnings.push(`Player ID đã được normalize thành "${playerId}"`);
    if (!hostId) warnings.push("Host ID đang trống sau khi normalize.");
    if (!playerId) warnings.push("Player ID đang trống sau khi normalize.");
    if (hasUnsafeChars(hostIdRaw)) warnings.push("Host ID có ký tự không hợp lệ (đã bị loại bỏ).");
    if (hasUnsafeChars(playerIdRaw)) warnings.push("Player ID có ký tự không hợp lệ (đã bị loại bỏ).");
    return warnings;
  }, [hostIdRaw, hostId, playerIdRaw, playerId]);

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

      if (!hostId) {
        setError("Host ID is required.");
        return;
      }

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

      if (!playerId) {
        setError("Player ID is required.");
        return;
      }

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

      if (!hostId) {
        setError("Host ID is required.");
        return;
      }

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

      if (!hostId) {
        setError("Host ID is required.");
        return;
      }

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
        <input
          value={hostIdRaw}
          onChange={(e) => setHostIdRaw(e.target.value)}
          style={{ padding: "0.35rem 0.5rem" }}
        />
        <input value={hostName} onChange={(e) => setHostName(e.target.value)} style={{ padding: "0.35rem 0.5rem" }} />

        <span style={{ opacity: 0.7 }}>Player:</span>
        <input
          value={playerIdRaw}
          onChange={(e) => setPlayerIdRaw(e.target.value)}
          style={{ padding: "0.35rem 0.5rem" }}
        />
        <input
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          style={{ padding: "0.35rem 0.5rem" }}
        />

        <span style={{ marginLeft: "auto", opacity: 0.7 }}>
          Uses: <code>{API_BASE_URL}</code> → <code>/overview/rooms</code>
        </span>
      </div>

      {idWarnings.length > 0 && (
        <div style={{ marginBottom: "0.75rem", fontSize: 12, color: "#6b7280" }}>
          <ul style={{ paddingLeft: "1.1rem", margin: 0 }}>
            {idWarnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

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
            {rooms.length === 0 && (
              <tr>
                <td style={td} colSpan={7}>
                  No rooms.
                </td>
              </tr>
            )}

            {rooms.map((r) => {
              const phase = r.game?.phase ?? "none";
              const playersCount = r.players?.length ?? 0;

              const canReady = phase === "lobby";
              const canStart = phase === "lobby";
              const canFinish = phase === "running";

              return (
                <tr key={r.id}>
                  <td style={td}>{r.id}</td>
                  <td style={td}>{r.type}</td>
                  <td style={td}>{r.stake}</td>
                  <td style={td}>
                    {playersCount} / {r.maxPlayers}
                  </td>
                  <td style={td}>{r.status}</td>
                  <td style={td}>
                    {r.game ? (
                      <span>
                        {r.game.phase} ({r.game.playersCount})
                      </span>
                    ) : (
                      <span>no game</span>
                    )}
                  </td>
                  <td style={td}>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      <button onClick={() => joinRoomGame(r.id)} disabled={!canAct || !playerId}>
                        Join (as {playerId || "?"})
                      </button>

                      <button
                        onClick={() => ready(r.id, playerId)}
                        disabled={!canAct || !playerId || !canReady}
                        title={!canReady ? `Ready disabled (phase=${phase})` : ""}
                      >
                        Ready (as {playerId || "?"})
                      </button>

                      <button
                        onClick={() => start(r.id)}
                        disabled={!canAct || !hostId || !canStart}
                        title={!canStart ? `Start disabled (phase=${phase})` : ""}
                      >
                        Start (as {hostId || "?"})
                      </button>

                      <button
                        onClick={() => finish(r.id)}
                        disabled={!canAct || !hostId || !canFinish}
                        title={!canFinish ? `Finish disabled (phase=${phase})` : ""}
                      >
                        Finish (as {hostId || "?"})
                      </button>

                      <Link href={`/battle/${r.id}`}>Open</Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
