"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { copyToClipboard, getOrCreateIdentity, resetIdentity, setDisplayName } from "../../../lib/identity";

type ApiOk<T> = { ok: true; data: T };

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
    players: Array<{ id: string; joinedAt?: number }>;
    minPlayers?: number;
    maxPlayers?: number;
  };
  game: any | null;
};

function getPlayerIdsFromGame(game: any): string[] {
  const arr = Array.isArray(game?.players) ? game.players : [];
  return arr.map((p: any) => p?.id).filter(Boolean);
}

function getReadyIdsFromGame(game: any): string[] {
  const arr = Array.isArray(game?.players) ? game.players : [];
  return arr
    .filter((p: any) => p && (p.ready === true || p.isReady === true || p.status === "ready"))
    .map((p: any) => p.id)
    .filter(Boolean);
}

export default function BattlePage() {
  const params = useParams<{ id: string }>();
  const roomId = useMemo(() => params?.id?.toString() ?? "", [params]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [playerId, setPlayerIdState] = useState("");
  const [displayName, setDisplayNameState] = useState("");

  const [detail, setDetail] = useState<RoomDetail | null>(null);

  useEffect(() => {
    const id = getOrCreateIdentity();
    setPlayerIdState(id.playerId);
    setDisplayNameState(id.displayName || "");
  }, []);

  const refreshIdentity = () => {
    const id = getOrCreateIdentity();
    setPlayerIdState(id.playerId);
    setDisplayNameState(id.displayName || "");
  };

  const refresh = async () => {
    if (!roomId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<RoomDetail>(`/api/backend/v2/overview/rooms/${roomId}`);
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
      await apiPost<{ gameId: string; reused: boolean }>(`/api/backend/v2/rooms/${roomId}/game`, {});
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
      await apiPost<any>(`/api/backend/v2/rooms/${roomId}/game/join`, {
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
      await apiPost<any>(`/api/backend/v2/rooms/${roomId}/game/ready`, { playerId });
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
      await apiPost<any>(`/api/backend/v2/rooms/${roomId}/game/unready`, { playerId });
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
      await apiPost<any>(`/api/backend/v2/rooms/${roomId}/game/start`, playerId ? { playerId } : {});
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
      await apiPost<any>(`/api/backend/v2/rooms/${roomId}/game/finish`, playerId ? { playerId } : {});
      await refresh();
    } catch (e) {
      setError(safeMsg(e, "Failed to finish game"));
    } finally {
      setLoading(false);
    }
  };

  const onSaveName = () => {
    setDisplayName(displayName);
    refreshIdentity();
  };

  const onResetIdentity = () => {
    resetIdentity();
    refreshIdentity();
  };

  const room = detail?.room;
  const game = detail?.game;

  const phase = game?.phase ?? "none";
  const roomPlayers = room?.players?.map((p) => p.id) ?? [];

  const gamePlayerIds = getPlayerIdsFromGame(game);
  const readyIds = getReadyIdsFromGame(game);

  const minPlayers = room?.minPlayers ?? 2;

  const isInRoom = !!playerId && roomPlayers.includes(playerId);
  const isInGame = !!playerId && gamePlayerIds.includes(playerId);
  const isReady = !!playerId && readyIds.includes(playerId);

  const canJoin = !!roomId && !!playerId;
  const canReady = phase === "lobby" && isInGame;
  const canUnready = phase === "lobby" && isInGame && isReady;
  const canStart = phase === "lobby" && gamePlayerIds.length >= minPlayers && readyIds.length >= minPlayers;
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
        <h2 style={{ marginTop: 0 }}>You (Identity v0)</h2>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          <span>ID:</span>
          <code style={{ padding: "0.2rem 0.35rem", background: "#f3f4f6", borderRadius: 6 }}>{playerId || "…"}</code>
          <button onClick={() => copyToClipboard(playerId)} disabled={!playerId || loading}>Copy ID</button>

          <input
            value={displayName}
            onChange={(e) => setDisplayNameState(e.target.value)}
            placeholder="Display name (optional)"
            style={{ padding: "0.35rem 0.5rem" }}
          />
          <button onClick={onSaveName} disabled={loading}>Save Name</button>
          <button onClick={onResetIdentity} disabled={loading}>Reset Identity</button>
        </div>
        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
          Multi-player nhanh: mở Incognito / browser profile khác để có playerId khác.
        </div>
      </div>

      <div style={{ background: "#fff", padding: "1rem", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <h2 style={{ marginTop: 0 }}>Status</h2>
        <ul style={{ paddingLeft: "1rem", lineHeight: 1.6, margin: 0 }}>
          <li>Phase: <strong>{phase}</strong></li>
          <li>Room players: <strong>{roomPlayers.length}</strong></li>
          <li>Game players: <strong>{gamePlayerIds.length}</strong></li>
          <li>Ready: <strong>{readyIds.length}</strong> (min to start: {minPlayers})</li>
          <li>You: inRoom={String(isInRoom)} | inGame={String(isInGame)} | ready={String(isReady)}</li>
        </ul>
      </div>

      <div style={{ background: "#fff", padding: "1rem", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <h2 style={{ marginTop: 0 }}>Actions</h2>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button onClick={joinGame} disabled={loading || !canJoin}>Join Room+Game</button>
          <button onClick={ready} disabled={loading || !canReady}>Ready</button>
          <button onClick={unready} disabled={loading || !canUnready}>Unready</button>
          <button onClick={start} disabled={loading || !canStart}>Start</button>
          <button onClick={finish} disabled={loading || !canFinish}>Finish</button>
        </div>

        <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.4, marginTop: 10 }}>
          <ul style={{ paddingLeft: "1rem", margin: 0 }}>
            <li>Start bật khi: phase=lobby, gamePlayers và ready ≥ minPlayers.</li>
            <li>Ready/Unready bật khi bạn đã join game và phase=lobby.</li>
            <li>Không log env/URL nội bộ ra UI.</li>
          </ul>
        </div>
      </div>

      <div style={{ background: "#fff", padding: "1rem", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <h2 style={{ marginTop: 0 }}>Game (raw debug)</h2>
        <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
          {game ? JSON.stringify(game, null, 2) : "No game picked yet. Join or Create/Reuse Active Game."}
        </pre>
      </div>
    </section>
  );
}
