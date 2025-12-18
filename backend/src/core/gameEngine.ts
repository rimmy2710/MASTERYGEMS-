import { GameState, PlayerId } from "../types/game";

export class GameEngineError extends Error {
  constructor(public code: string, message: string, public statusCode = 400) {
    super(message);
  }
}

function isHexCommitHash(v: string): boolean {
  return typeof v === "string" && /^0x[0-9a-fA-F]{16,}$/.test(v);
}

export class GameEngine {
  private states = new Map<string, GameState>();

  ensureState(roomId: string, playerIds: PlayerId[], now = Date.now()): GameState {
    const existing = this.states.get(roomId);
    if (existing) return existing;

    const players: GameState["players"] = {};
    for (const id of playerIds) {
      players[id] = { id, joinedAt: now, isActive: true, hasCommitted: false };
    }

    const st: GameState = {
      roomId,
      phase: "COMMIT",
      roundIndex: 0,
      commitEndsAt: now + 2 * 60 * 1000,
      players,
      commits: {},
      updatedAt: now,
    };

    this.states.set(roomId, st);
    return st;
  }

  commitMove(roomId: string, playerId: string, commitHash: string, now = Date.now()): GameState {
    const st = this.states.get(roomId);
    if (!st) throw new GameEngineError("ROOM_STATE_NOT_FOUND", "Room game state not found", 404);
    if (st.phase !== "COMMIT") throw new GameEngineError("WRONG_PHASE", "Not in commit phase", 409);
    if (now > st.commitEndsAt) throw new GameEngineError("COMMIT_WINDOW_ENDED", "Commit window ended", 409);

    const p = st.players[playerId];
    if (!p) throw new GameEngineError("PLAYER_NOT_FOUND", "Player not in room", 404);
    if (!isHexCommitHash(commitHash)) throw new GameEngineError("INVALID_COMMIT_HASH", "Invalid commit hash", 400);
    if (p.hasCommitted) throw new GameEngineError("ALREADY_COMMITTED", "Already committed", 409);

    p.hasCommitted = true;
    p.lastCommitHash = commitHash;
    st.commits[playerId] = { hash: commitHash, committedAt: now };
    st.updatedAt = now;
    return st;
  }

  getState(roomId: string) {
    return this.states.get(roomId);
  }
}
