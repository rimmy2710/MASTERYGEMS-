// frontend/app/lobby/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import WalletPanel from "../components/WalletPanel";
import { API_BASE_URL } from "../../lib/config";
import { v2CreateRoom } from "../../lib/apiV2";
import {
  loadIdentity,
  saveIdentity,
  normalizePlayerId,
  normalizeDisplayName,
  hasUnsafeIdChars,
  MgIdentity,
} from "../../lib/identity";

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

  // One shared identity source for FE (later replace with auth/wallet)
  const [identity, setIdentity] = useState<MgIdentity>({
    hostId: "p1",
    hostName: "Host",
    playerId: "p2",
    playerName: "P2",
  });

  // Load once on mount
  useEffect(() => {
    const loaded = loadIdentity(identity);
    setIdentity(loaded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on changes
  useEffect(() => {
    saveIdentity(identity);
  }, [identity]);

  const hostId = useMemo(
    () => normalizePlayerId(identity.hostId),
    [identity.hostId]
  );
  const playerId = useMemo(
    () => normalizePlayerId(identity.playerId),
    [identity.playerId]
  );

  const canAct = useMemo(() => !loading, [loading]);

  const idWarnings = useMemo(() => {
    const warnings: string[] = [];
    if (identity.hostId !== hostId)
      warnings.push(`Host ID đã được normalize thành "${hostId}"`);
    if (identity.playerId !== playerId)
      warnings.push(`Player ID đã được normalize thành "${playerId}"`);
    if (!hostId) warnings.push("Host ID đang trống sau khi normalize.");
    if (!playerId) warnings.push("Player ID đang trống sau khi normalize.");
    if (hasUnsafeIdChars(identity.hostId))
      warnings.push("Host ID có ký tự không hợp lệ (đã bị loại bỏ).");
    if (hasUnsafeIdChars(identity.playerId))
      warnings.push("Player ID có ký tự không hợp lệ (đã bị loại bỏ).");
    return warnings;
  }, [identity.hostId, identity.playerId, hostId, playerId]);

  const loadRooms = async () => {
    try {
      setLoading(true);
      setError(null);

      // Canonical lobby data (v2)
      const res = await apiJson<{ ok: true; data: RoomOverview[] }>(
        "/v2/overview/rooms"
      );
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

      if (!hostId) {
        setError("Host ID is required.");
        return;
      }

      // 1) create room (v2)
      const room = await v2CreateRoom({ type: "public", stake: 1, maxPlayers: 10, minPlayers: 2 });

      // 2) create (or reuse) game for that room with host (v2 room-game)
      await apiJson<{ ok: true; data: { gameId: string; reused: boolean } }>(
        `/v2/rooms/${room.id}/game`,
        {
          method: "POST",
          body: JSON.stringify({
            hostPlayerId: hostId,
            hostDisplayName: normalizeDisplayName(identity.hostName),
          }),
        }
      );

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

      await apiJson(`/v2/rooms/${roomId}/game/join`, {
        method: "POST",
        body: JSON.stringify({
          playerId,
          displayName: normalizeDisplayName(identity.playerName),
        }),
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

      await apiJson(`/v2/rooms/${roomId}/game/ready`, {
        method: "POST",
        body: JSON.stringify({ playerId: normalizePlayerId(pid) }),
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

      await apiJson(`/v2/rooms/${roomId}/game/start`, {
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

      await apiJson(`/v2/rooms/${roomId}/game/finish`, {
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
      <WalletPanel />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "1rem",
          flexWrap: "wrap",
        }}
      >
        <h1 style={{ margin: 0 }}>Lobby</h1>

        <button onClick={loadRooms} disabled={!canAct}>
          Refresh
        </button>

        <button onClick={createRoomOnly} disabled={!canAct}>
          Create Room (v2)
        </button>

        <button onClick={createRoomWithGame} disabled={!canAct}>
          Create Room + Game (Host) (v2)
        </button>

        <span style={{ opacity: 0.7 }}>Host:</span>
        <input
          value={identity.hostId}
          onChange={(e) => setIdentity((x) => ({ ...x, hostId: e.target.value }))}
          style={{ padding: "0.35rem 0.5rem" }}
        />
        <input
          value={identity.hostName}
          onChange={(e) => setIdentity((x) => ({ ...x, hostName: e.target.value }))}
          style={{ padding: "0.35rem 0.5rem" }}
        />

        <span style={{ opacity: 0.7 }}>Player:</span>
        <input
          value={identity.playerId}
          onChange={(e) => setIdentity((x) => ({ ...x, playerId: e.target.value }))}
          style={{ padding: "0.35rem 0.5rem" }}
        />
        <input
          value={identity.playerName}
          onChange={(e) => setIdentity((x) => ({ ...x, playerName: e.target.value }))}
          style={{ padding: "0.35rem 0.5rem" }}
        />

        <span style={{ marginLeft: "auto", opacity: 0.7 }}>
          Uses: <code>{API_BASE_URL}</code> → <code>/v2/overview/rooms</code>
        </span>
      </div>

      {idWarnings.length > 0 && (
        <div
          style={{
            background: "#fffbeb",
            border: "1px solid #f59e0b",
            padding: "0.75rem",
            borderRadius: 8,
            marginBottom: "0.75rem",
          }}
        >
          <strong style={{ display: "block", marginBottom: 6 }}>Identity warnings</strong>
          <ul style={{ paddingLeft: "1rem", margin: 0 }}>
            {idWarnings.map((w, i) => (
              <li key={i}>{w}</li>
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
                  No rooms yet.
                </td>
              </tr>
            )}

            {rooms.map((room) => (
              <tr key={room.id}>
                <td style={td}>
                  <div style={{ display: "grid", gap: 6 }}>
                    <div>
                      <strong>{room.id}</strong>
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>
                      <Link href={`/battle/${room.id}`}>Open battle</Link>
                    </div>
                  </div>
                </td>

                <td style={td}>{room.type}</td>
                <td style={td}>{room.stake}</td>

                <td style={td}>
                  {room.players?.length ? room.players.map((p) => p.id).join(", ") : "None"}
                </td>

                <td style={td}>{room.status}</td>

                <td style={td}>
                  {room.game ? (
                    <div style={{ display: "grid", gap: 4 }}>
                      <div>id: {room.game.id}</div>
                      <div>phase: {room.game.phase}</div>
                      <div>players: {room.game.playersCount}</div>
                    </div>
                  ) : (
                    "No game"
                  )}
                </td>

                <td style={td}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button onClick={() => joinRoomGame(room.id)} disabled={!canAct || !playerId}>
                      Join (Player)
                    </button>

                    <button onClick={() => ready(room.id, identity.hostId)} disabled={!canAct || !hostId}>
                      Ready (Host)
                    </button>

                    <button onClick={() => ready(room.id, identity.playerId)} disabled={!canAct || !playerId}>
                      Ready (Player)
                    </button>

                    <button onClick={() => start(room.id)} disabled={!canAct || !hostId}>
                      Start (Host)
                    </button>

                    <button onClick={() => finish(room.id)} disabled={!canAct || !hostId}>
                      Finish (Host)
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
