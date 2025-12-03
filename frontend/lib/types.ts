export type RoomType = "public" | "creator";
export type StakeLevel = 1 | 5 | 10;

export interface Player {
  id: string;
  joinedAt: number;
}

export interface Room {
  id: string;
  type: RoomType;
  stake: StakeLevel | number;
  maxPlayers: number;
  minPlayers: number;
  players: Player[];
  status: "waiting" | "in-progress" | "finished";
  createdAt: number;
}

export type MoveOption = "rock" | "paper" | "scissors";

export interface RoundState {
  roundNumber: number;
  status: "waiting" | "committing" | "revealing" | "finished";
  commits: Record<string, string>;
  reveals: {
    [playerId: string]: {
      move: MoveOption;
      salt: string;
    };
  };
}

export interface GameState {
  roomId: string;
  currentRound: number;
  rounds: RoundState[];
  scores: Record<string, number>;
  createdAt: number;
  updatedAt: number;
}

export interface RoomStateResponse {
  room: Room;
  game?: GameState | null;
}
