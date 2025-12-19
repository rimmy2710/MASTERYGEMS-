"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type ApiOk<T> = { ok: true; data: T };
type ApiErr = { ok: false; error: any };

function isApiOk<T>(x: any): x is ApiOk<T> {
  return x && typeof x === "object" && x.ok === true && "data" in x;
}

function safeMsg(err: unknown, fallback: string) {
  if (err instanceof Error) return err.message || fallback;
  if (typeof err === "string") return err;
  return fallback;
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path, { method: "GET" });
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {}

  if (!res.ok) {
    const msg = (json && (json.error?.message || json.error)) || text || `HTTP ${res.status}`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }

  // backend mostly returns {ok:true,data}, keep legacy compatibility anyway
  return isApiOk<T>(json) ? json.data : (json as T);
}

async function apiPost<T>(path: string, body?: any): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {}

  if (!res.ok) {
    const msg = (json && (json.error?.message || json.error)) || text || `HTTP ${res.status}`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }

  return isApiOk<T>(json) ? json.data : (json as T);
}

type RoomDetail = {
  room: {
    id: string;
    type: string;
    stake: number;
    status: string;
    players: Array<{ id: string }>;
    minPlayers?: number;
    maxPlayers?: number;
  };
  game: any | null; // full game state per overview.ts
};

export default function BattlePage() {
  const params = useParams<{ id: string }>();
  const roomId = useMemo(() => params?.id?.toString() ?? "", [params]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [playerId, setPlayerId] = useState("");
  const [displayName, setDisplayName] = useState("");

  const [detail, setDetail] = useState<RoomDetail | null>(null);

  // Light identity (not wallet): keep playerId in localStorage to avoid retyping
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("mg.playerId");
      if (saved && !playerId) setPlayerId(saved);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      if (playerId) window.localStorage.setItem("mg.playerId", playerId);
    } catch {}
  }, [playerId]);

  const refresh = async () => {
    if (!roomId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<RoomDetail>(`/api/backend/overview/rooms/${roomId}`);
      setDetail(data);
    } catch (e) {
      setError(safeMsg(e, "Failed to load room detail"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const ensureGame = async () => {
    if (!roomId) return;
    setLoading(true);
    setError(null);
    try {
      await apiPost<{ gameId: string; reused: boolean }>(`/api/backend/rooms/${roomId}/game`, {});
      await refresh();
    } catch (e) {
      setError(safeMsg(e, "Failed to create/reuse active game"));
    } finally {
      setLoading(false);
    }
  };

  const joinGame = async () => {
    if (!roomId || !playerId) return;
    setLoading(true);
    setError(null);
    try {
      await apiPost<any>(`/api/backend/rooms/${roomId}/game/join`, {
        playerId,
        displayName: displayName || undefined,
      });
      await refresh();
    } catch (e) {
      setError(safeMsg(e, "Failed to join room/game"));
    } finally {
      setLoading(false);
    }
  };

  const ready = async () => {
    if (!roomId || !playerId) return;
    setLoading(true);
    setError(null);
    try {
      await apiPost<any>(`/api/backend/rooms/${roomId}/game/ready`, { playerId });
      await refresh();
    } catch (e) {
      setError(safeMsg(e, "Failed to ready"));
    } finally {
      setLoading(false);
    }
  };

  const unready = async () => {
    if (!roomId || !playerId) return;
    setLoading(true);
    setError(null);
    try {
      await apiPost<any>(`/api/backend/rooms/${roomId}/game/unready`, { playerId });
      await refresh();
    } catch (e) {
      setError(safeMsg(e, "Failed to unready"));
    } finally {
      setLoading(false);
    }
  };

  const start = async () => {
    if (!roomId) return;
    setLoading(true);
    setError(null);
    try {
      // playerId optional by backend schema; send if present for auth checks
      await apiPost<any>(`/api/backend/rooms/${roomId}/game/start`, playerId ? { playerId } : {});
      await refresh();
    } catch (e) {
      setError(safeMsg(e, "Failed to start game"));
    } finally {
      setLoading(false);
    }
  };

  const finish = async () => {
    if (!roomId) return;
    setLoading(true);
    setError(null);
    try {
      await apiPost<any>(`/api/backend/rooms/${roomId}/game/finish`, playerId ? { playerId } : {});
      await refresh();
    } catch (e) {
      setError(safeMsg(e, "Failed to finish game"));
    } finally {
      setLoading(false);
    }
  };

  const room = detail?.room;
  const game = detail?.game;
  const players = room?.players?.map((p) => p.id) ?? [];

  // Minimal phase-aware UX (best effort; depends on game schema)
  const phase = game?.phase ?? "none";
  const canJoin = !!roomId && !!playerId;
  const canReady = canJoin && phase === "lobby";
  const canStart = phase === "lobby";
  const canFinish = phase === "running";

  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      <header style={{ display: "grid", gap: "0.25rem" }}>
        <h1 style={{ margin: 0 }}>Battle: {roomId || "(no roomId)"}</h1>
        {loading && <div>Loading...</div>}
        {error && <div style={{ color: "#b91c1c" }}>{error}</div>}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button onClick={refresh} disabled={loading || !roomId}>Refresh</button>
          <button onClick={ensureGame} disabled={loading || !roomId}>Create/Reuse Active Game</button>
        </div>
      </header>

      <div style={{ background: "#fff", padding: "1rem", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <h2 style={{ marginTop: 0 }}>Room</h2>
        {room ? (
          <ul style={{ paddingLeft: "1rem", lineHeight: 1.6 }}>
            <li>ID: {room.id}</li>
            <li>Type: {room.type}</li>
            <li>Stake: {room.stake}</li>
            <li>Status: {room.status}</li>
            <li>Players: {players.length ? players.join(", ") : "None"}</li>
            <li>Min/Max: {room.minPlayers ?? "-"} / {room.maxPlayers ?? "-"}</li>
          </ul>
        ) : (
          <div>No room data.</div>
        )}
      </div>

      <div style={{ background: "#fff", padding: "1rem", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <h2 style={{ marginTop: 0 }}>Game</h2>
        <div style={{ marginBottom: "0.5rem" }}>Phase: <strong>{phase}</strong></div>
        <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
          {game ? JSON.stringify(game, null, 2) : "No game picked yet. Join or Create/Reuse Active Game."}
        </pre>
      </div>

      <div style={{ background: "#fff", padding: "1rem", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <h2 style={{ marginTop: 0 }}>Actions</h2>

        <div style={{ display: "grid", gap: "0.75rem", maxWidth: 560 }}>
          <label style={{ display: "grid", gap: "0.25rem" }}>
            Player ID (temporary)
            <input
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
              placeholder="p1"
              style={{ padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: 6 }}
            />
          </label>

          <label style={{ display: "grid", gap: "0.25rem" }}>
            Display Name (optional)
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Rimmy"
              style={{ padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: 6 }}
            />
          </label>

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button onClick={joinGame} disabled={loading || !canJoin}>Join Room+Game</button>
            <button onClick={ready} disabled={loading || !canReady}>Ready</button>
            <button onClick={unready} disabled={loading || !canReady}>Unready</button>
            <button onClick={start} disabled={loading || !canStart}>Start</button>
            <button onClick={finish} disabled={loading || !canFinish}>Finish</button>
          </div>

          <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.4 }}>
            <ul style={{ paddingLeft: "1rem", margin: 0 }}>
              <li>Battle đã migrate sang room-game lifecycle (join/ready/unready/start/finish).</li>
              <li>Commit/Reveal UI tạm thời không nằm trong scope ngày 19/12.</li>
              <li>Player ID chỉ là tạm thời (localStorage: <code>mg.playerId</code>), chưa phải wallet/session.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
