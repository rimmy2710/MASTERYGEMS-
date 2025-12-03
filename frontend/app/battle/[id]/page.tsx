"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { commitMove, getRoomState, joinRoom, revealMove } from "../../../lib/api";
import { RoomStateResponse, MoveOption } from "../../../lib/types";

export default function BattlePage() {
  const params = useParams<{ id: string }>();
  const roomId = useMemo(() => params?.id?.toString() ?? "", [params]);

  const [roomState, setRoomState] = useState<RoomStateResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [playerId, setPlayerId] = useState<string>("");
  const [commitHash, setCommitHash] = useState<string>("");
  const [move, setMove] = useState<MoveOption>("rock");
  const [salt, setSalt] = useState<string>("");

  const loadRoomState = async () => {
    if (!roomId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getRoomState(roomId);
      setRoomState(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load room");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoomState();
  }, [roomId]);

  const handleJoin = async () => {
    if (!playerId) return;
    try {
      setLoading(true);
      await joinRoom(roomId, playerId);
      await loadRoomState();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join room");
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!playerId || !commitHash) return;
    try {
      setLoading(true);
      await commitMove(roomId, playerId, commitHash);
      await loadRoomState();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to commit move");
    } finally {
      setLoading(false);
    }
  };

  const handleReveal = async () => {
    if (!playerId || !salt) return;
    try {
      setLoading(true);
      await revealMove(roomId, playerId, move, salt);
      await loadRoomState();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reveal move");
    } finally {
      setLoading(false);
    }
  };

  const currentRound = roomState?.game?.rounds?.find(
    (round) => round.roundNumber === roomState.game?.currentRound
  );

  const scores = roomState?.game?.scores ?? {};

  return (
    <section style={{ display: "grid", gap: "1.5rem" }}>
      <div>
        <h1 style={{ marginTop: 0 }}>Battle: {roomId}</h1>
        {loading && <p>Loading...</p>}
        {error && (
          <p style={{ color: "#b91c1c", marginTop: "0.5rem" }}>
            {error}
          </p>
        )}
      </div>

      <div style={{ backgroundColor: "#ffffff", padding: "1rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <h2 style={{ marginTop: 0 }}>Room Info</h2>
        {roomState ? (
          <ul style={{ paddingLeft: "1rem", lineHeight: 1.6 }}>
            <li>ID: {roomState.room.id}</li>
            <li>Type: {roomState.room.type}</li>
            <li>Stake: {roomState.room.stake}</li>
            <li>Players: {roomState.room.players.map((p) => p.id).join(", ") || "None"}</li>
            <li>Status: {roomState.room.status}</li>
          </ul>
        ) : (
          <p>No room data.</p>
        )}
      </div>

      <div style={{ backgroundColor: "#ffffff", padding: "1rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <h2 style={{ marginTop: 0 }}>Game Info</h2>
        {roomState?.game ? (
          <div style={{ display: "grid", gap: "0.5rem" }}>
            <div>Current Round: {roomState.game.currentRound}</div>
            <div>
              <strong>Scores:</strong>
              <ul style={{ paddingLeft: "1rem", marginTop: "0.25rem" }}>
                {Object.keys(scores).length === 0 && <li>No scores yet.</li>}
                {Object.entries(scores).map(([player, score]) => (
                  <li key={player}>
                    {player}: {score}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <strong>Current Reveals:</strong>
              <ul style={{ paddingLeft: "1rem", marginTop: "0.25rem" }}>
                {currentRound && Object.keys(currentRound.reveals).length > 0 ? (
                  Object.entries(currentRound.reveals).map(([player, info]) => (
                    <li key={player}>
                      {player}: {info.move} (salt: {info.salt})
                    </li>
                  ))
                ) : (
                  <li>No reveals yet.</li>
                )}
              </ul>
            </div>
          </div>
        ) : (
          <p>No game data yet.</p>
        )}
      </div>

      <div style={{ backgroundColor: "#ffffff", padding: "1rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <h2 style={{ marginTop: 0 }}>Actions</h2>
        <div style={{ display: "grid", gap: "1rem" }}>
          <div style={{ display: "grid", gap: "0.5rem" }}>
            <h3 style={{ margin: 0 }}>Join Room</h3>
            <label style={{ display: "grid", gap: "0.25rem" }}>
              Player ID
              <input
                type="text"
                value={playerId}
                onChange={(e) => setPlayerId(e.target.value)}
                placeholder="player-123"
                style={{ padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "4px" }}
              />
            </label>
            <button onClick={handleJoin} disabled={loading || !playerId}>
              Join
            </button>
          </div>

          <div style={{ display: "grid", gap: "0.5rem" }}>
            <h3 style={{ margin: 0 }}>Commit Move</h3>
            <label style={{ display: "grid", gap: "0.25rem" }}>
              Player ID
              <input
                type="text"
                value={playerId}
                onChange={(e) => setPlayerId(e.target.value)}
                placeholder="player-123"
                style={{ padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "4px" }}
              />
            </label>
            <label style={{ display: "grid", gap: "0.25rem" }}>
              Commit Hash
              <input
                type="text"
                value={commitHash}
                onChange={(e) => setCommitHash(e.target.value)}
                placeholder="example-commit-hash"
                style={{ padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "4px" }}
              />
            </label>
            <button onClick={handleCommit} disabled={loading || !playerId || !commitHash}>
              Commit
            </button>
          </div>

          <div style={{ display: "grid", gap: "0.5rem" }}>
            <h3 style={{ margin: 0 }}>Reveal Move</h3>
            <label style={{ display: "grid", gap: "0.25rem" }}>
              Player ID
              <input
                type="text"
                value={playerId}
                onChange={(e) => setPlayerId(e.target.value)}
                placeholder="player-123"
                style={{ padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "4px" }}
              />
            </label>
            <label style={{ display: "grid", gap: "0.25rem" }}>
              Move
              <select
                value={move}
                onChange={(e) => setMove(e.target.value as MoveOption)}
                style={{ padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "4px" }}
              >
                <option value="rock">Rock</option>
                <option value="paper">Paper</option>
                <option value="scissors">Scissors</option>
              </select>
            </label>
            <label style={{ display: "grid", gap: "0.25rem" }}>
              Salt
              <input
                type="text"
                value={salt}
                onChange={(e) => setSalt(e.target.value)}
                placeholder="random-salt"
                style={{ padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "4px" }}
              />
            </label>
            <button onClick={handleReveal} disabled={loading || !playerId || !salt}>
              Reveal
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
