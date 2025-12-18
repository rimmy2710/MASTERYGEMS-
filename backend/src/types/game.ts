export type GamePhase = "COMMIT" | "REVEAL" | "RESOLVED";
export type PlayerId = string;

export interface PlayerState {
  id: PlayerId;
  joinedAt: number;
  isActive: boolean;
  hasCommitted: boolean;
  lastCommitHash?: string;
}

export interface CommitRecord {
  hash: string;
  committedAt: number;
}

export interface GameState {
  roomId: string;
  phase: GamePhase;
  roundIndex: number;
  commitEndsAt: number; // epoch ms
  players: Record<PlayerId, PlayerState>;
  commits: Record<PlayerId, CommitRecord>;
  updatedAt: number;
}
