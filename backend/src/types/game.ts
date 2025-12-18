// backend/src/types/game.ts

export type GameId = string;
export type RoomId = string;
export type PlayerId = string;

export type GamePhase = "lobby" | "running" | "finished";

export type StakeLevel = 1 | 5 | 10;

export interface GamePlayer {
  id: PlayerId;
  displayName?: string;
  joinedAt: number; // epoch ms
  isReady: boolean;
  isHost?: boolean;
}

export interface GameConfig {
  roomId: RoomId;
  stake: StakeLevel;
  minPlayers: number;
  maxPlayers: number;
}

export interface GameState {
  id: GameId;
  roomId: RoomId;
  phase: GamePhase;

  createdAt: number;
  startedAt?: number;
  finishedAt?: number;

  config: GameConfig;

  players: GamePlayer[];
  // Dành chỗ cho MVP: tiến hoá dần (pot, round, turn, etc.)
  meta?: Record<string, unknown>;
}

export type GameActionType =
  | "PLAYER_READY"
  | "PLAYER_UNREADY"
  | "START_GAME"
  | "FINISH_GAME";

export interface GameActionBase {
  type: GameActionType;
  playerId?: PlayerId; // START/FINISH có thể do host hoặc system
  at?: number; // epoch ms (nếu không truyền thì engine tự set)
}

export type GameAction =
  | (GameActionBase & { type: "PLAYER_READY"; playerId: PlayerId })
  | (GameActionBase & { type: "PLAYER_UNREADY"; playerId: PlayerId })
  | (GameActionBase & { type: "START_GAME"; playerId?: PlayerId })
  | (GameActionBase & { type: "FINISH_GAME"; playerId?: PlayerId });

export interface EngineResult<T> {
  ok: boolean;
  data?: T;
  error?: {
    code:
      | "NOT_FOUND"
      | "INVALID_STATE"
      | "INVALID_ACTION"
      | "PLAYER_EXISTS"
      | "PLAYER_NOT_FOUND"
      | "CAPACITY_FULL"
      | "MIN_PLAYERS_NOT_MET"
      | "NOT_AUTHORIZED";
    message: string;
  };
}

export function ok<T>(data: T): EngineResult<T> {
  return { ok: true, data };
}

export function err<T>(
  code: EngineResult<T>["error"]["code"],
  message: string
): EngineResult<T> {
  return { ok: false, error: { code, message } };
}
