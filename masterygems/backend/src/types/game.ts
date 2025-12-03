export type MoveOption = "rock" | "paper" | "scissors";

export type RoundStatus = "waiting" | "committing" | "revealing" | "finished";

export interface RoundState {
  roundNumber: number;
  status: RoundStatus;
  commits: {
    [playerId: string]: string;
  };
  reveals: {
    [playerId: string]: {
      move: MoveOption;
      salt: string;
    };
  };
}

export interface GameScoreBoard {
  [playerId: string]: number;
}

export interface GameState {
  roomId: string;
  currentRound: number;
  rounds: RoundState[];
  scores: GameScoreBoard;
  createdAt: number;
  updatedAt: number;
}
