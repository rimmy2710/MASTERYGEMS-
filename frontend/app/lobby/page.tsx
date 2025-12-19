// frontend/app/lobby/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../../lib/config";
import { v2CreateRoom } from "../../lib/apiV2";
import { copyToClipboard, getOrCreateIdentity, resetIdentity, setDisplayName, setPlayerId } from "../../lib/identity";

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
    const msg = json?.error?.message || json?.error || json?.message || `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  return json as T;
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

  // Identity v0 (per browser)
  const [playerId, setPlayerIdState] = useState("");
  const [name, setNameState] = useState("");

  // Optional manual override for testing in same browser (advanced)
  const [overrideId, setOverrideId] = useState("");

  const canAct = useMemo(() => !loading, [loading]);

  useEffect(() => {
    const id = getOrCreateIdentity();
    setPlayerIdState(id.playerId);
    setNameState(id.displayName || "Player");
  }, []);

  const refreshIdentity = () => {
    const id = getOrCreateIdentity();
    setPlayerIdState(id.playerId);
    setNameState(id.displayName || "Player");
  };

  const loadRooms = async () => {
    try {
      setLoading(true);
      setError(null);

      // Canonical lobby data remains overview (room + game summary)
      const res = await apiJson<{ ok: true; data: RoomOverview[] }>("/v2/overview/rooms");
      setRooms(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createRoomOnly = async () => {
    try {
      setLoading(true);
      setError(null);

      // v2 envelope
      await v2CreateRoom({ type: "public", stake: 1, maxPlayers: 10, minPlayers: 2 });

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

      if (!playerId) {
        setError("Identity not ready. Refresh the page.");
        return;
      }

      // 1) create room (v2)
      const room = await v2CreateRoom({ type: "public", stake: 1, maxPlayers: 10, minPlayers: 2 });

      // 2) create (or reuse) game for that room with YOU as host
      await apiJson<{ ok: true; data: { gameId: string; reused: boolean } }>(`/v2/rooms/${room.id}/game`, {
        method: "POST",
        body: JSON.stringify({ hostPlayerId: playerId, hostDisplayName: name || "Host" }),
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
        setError("Identity not ready. Refresh the page.");
        return;
      }

      await apiJson(`/v2/rooms/${roomId}/game/join`, {
        method: "POST",
        body: JSON.stringify({ playerId, displayName: name || undefined }),
      });

      await loadRooms();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join");
    } finally {
      setLoading(false);
    }
  };

  const ready = async (roomId: string) => {
    try {
      setLoading(true);
      setError(null);

      if (!playerId) {
        setError("Identity not ready. Refresh the page.");
        return;
      }

      await apiJson(`/v2/rooms/${roomId}/game/ready`, {
        method: "POST",
        body: JSON.stringify({ playerId }),
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

      if (!playerId) {
        setError("Identity not ready. Refresh the page.");
        return;
      }

      await apiJson(`/v2/rooms/${roomId}/game/start`, {
        method: "POST",
        body: JSON.stringify({ playerId }),
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

      if (!playerId) {
        setError("Identity not ready. Refresh the page.");
        return;
      }

      await apiJson(`/v2/rooms/${roomId}/game/finish`, {
        method: "POST",
        body: JSON.stringify({ playerId }),
      });

      await loadRooms();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to finish");
    } finally {
      setLoading(false);
    }
  };

  const onSaveName = () => {
    setDisplayName(name);
    refreshIdentity();
  };

  const onResetIdentity = () => {
    resetIdentity();
    refreshIdentity();
  };

  const onApplyOverrideId = () => {
    if (!overrideId.trim()) return;
    setPlayerId(overrideId);
    setOverrideId("");
    refreshIdentity();
  };

  return (
    <section style={{ padding: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <h1 style={{ margin: 0 }}>Lobby</h1>

        <button onClick={loadRooms} disabled={!canAct}>
          Refresh
        </button>

        <button onClick={createRoomOnly} disabled={!canAct}>
          Create Room (v2)
        </button>

        <button onClick={createRoomWithGame} disabled={!canAct || !playerId}>
          Create Room + Game (You as Host)
        </button>

        <span style={{ opacity: 0.7 }}>You:</span>
        <code style={{ padding: "0.2rem 0.35rem", background: "#f3f4f6", borderRadius: 6 }}>{playerId || "…"}</code>
        <button onClick={() => copyToClipboard(playerId)} disabled={!playerId || !canAct}>
          Copy ID
        </button>

        <input
          value={name}
          onChange={(e) => setNameState(e.target.value)}
          placeholder="Display name"
          style={{ padding: "0.35rem 0.5rem" }}
        />
        <button onClick={onSaveName} disabled={!canAct}>
          Save Name
        </button>

        <button onClick={onResetIdentity} disabled={!canAct}>
          Reset Identity
        </button>

        <span style={{ marginLeft: "auto", opacity: 0.7 }}>
          Uses: <code>{API_BASE_URL}</code> → <code>/v2/overview/rooms</code>
        </span>
      </div>

      <div style={{ marginBottom: "0.75rem", fontSize: 12, color: "#6b7280" }}>
        Tip multi-player nhanh: mở **Incognito / browser profile khác** để có playerId khác. Hoặc dùng override bên dưới (nâng cao).
      </div>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <input
          value={overrideId}
          onChange={(e) => setOverrideId(e.target.value)}
          placeholder="Override playerId (advanced)"
          style={{ padding: "0.35rem 0.5rem" }}
        />
        <button onClick={onApplyOverrideId} disabled={!canAct || !overrideId.trim()}>
          Apply Override
        </button>
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
            {rooms.length === 0 && (
              <tr>
                <td style={td} colSpan={7}>
                  No rooms.
                </td>
              </tr>
            )}

            {rooms.map((r) => {
              const phase = r.game?.phase ?? "none";
              const canReady = phase === "lobby";
              const canStart = phase === "lobby";
              const canFinish = phase === "running";

              return (
                <tr key={r.id}>
                  <td style={td}>{r.id}</td>
                  <td style={td}>{r.type}</td>
                  <td style={td}>{r.stake}</td>
                  <td style={td}>
                    {(r.players?.length ?? 0)} / {r.maxPlayers}
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
                        Join (You)
                      </button>

                      <button
                        onClick={() => ready(r.id)}
                        disabled={!canAct || !playerId || !canReady}
                        title={!canReady ? `Ready disabled (phase=${phase})` : ""}
                      >
                        Ready (You)
                      </button>

                      <button
                        onClick={() => start(r.id)}
                        disabled={!canAct || !playerId || !canStart}
                        title={!canStart ? `Start disabled (phase=${phase})` : ""}
                      >
                        Start (You)
                      </button>

                      <button
                        onClick={() => finish(r.id)}
                        disabled={!canAct || !playerId || !canFinish}
                        title={!canFinish ? `Finish disabled (phase=${phase})` : ""}
                      >
                        Finish (You)
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
