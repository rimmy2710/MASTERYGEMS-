import { GameState, MoveOption, RoundState } from "../types/game";

class GameEngine {
  private games: Map<string, GameState> = new Map();

  getGameState(roomId: string): GameState | undefined {
    return this.games.get(roomId);
  }

  ensureGameState(roomId: string): GameState {
    const existing = this.games.get(roomId);
    if (existing) {
      return existing;
    }

    const now = Date.now();
    const initialRound: RoundState = {
      roundNumber: 1,
      status: "committing",
      commits: {},
      reveals: {}
    };

    const game: GameState = {
      roomId,
      currentRound: 1,
      rounds: [initialRound],
      scores: {},
      createdAt: now,
      updatedAt: now
    };

    this.games.set(roomId, game);
    return game;
  }

  commitMove(roomId: string, playerId: string, commitHash: string): GameState {
    const game = this.ensureGameState(roomId);
    const round = game.rounds[game.currentRound - 1];

    if (round.status !== "committing") {
      throw new Error("Round is not open for commit");
    }

    round.commits[playerId] = commitHash;
    game.updatedAt = Date.now();
    return game;
  }

  revealMove(roomId: string, playerId: string, move: MoveOption, salt: string): GameState {
    const game = this.ensureGameState(roomId);
    const round = game.rounds[game.currentRound - 1];

    if (round.status !== "committing" && round.status !== "revealing") {
      throw new Error("Round is not open for reveal");
    }

    if (!round.commits[playerId]) {
      throw new Error("Player has not committed");
    }

    // TODO: verify that the commit hash matches the revealed move and salt.
    const isFirstReveal = Object.keys(round.reveals).length === 0;
    round.reveals[playerId] = { move, salt };

    if (isFirstReveal && round.status === "committing") {
      round.status = "revealing";
    }

    game.updatedAt = Date.now();
    return game;
  }

  finalizeRound(roomId: string): GameState {
    const game = this.ensureGameState(roomId);
    const round = game.rounds[game.currentRound - 1];

    if (round.status === "finished") {
      return game;
    }

    const revealedEntries = Object.entries(round.reveals).map(([playerId, reveal]) => ({
      playerId,
      move: reveal.move
    }));

    if (revealedEntries.length < 2) {
      round.status = "finished";
      game.updatedAt = Date.now();
      return game;
    }

    const movesPresent = new Set<MoveOption>(revealedEntries.map((entry) => entry.move));

    if (movesPresent.size === 2) {
      let winningMove: MoveOption | null = null;
      if (movesPresent.has("rock") && movesPresent.has("scissors")) {
        winningMove = "rock";
      } else if (movesPresent.has("scissors") && movesPresent.has("paper")) {
        winningMove = "scissors";
      } else if (movesPresent.has("paper") && movesPresent.has("rock")) {
        winningMove = "paper";
      }

      if (winningMove) {
        for (const entry of revealedEntries) {
          if (entry.move === winningMove) {
            game.scores[entry.playerId] = (game.scores[entry.playerId] || 0) + 5;
          }
        }
      }
    }

    round.status = "finished";
    game.updatedAt = Date.now();
    return game;
  }
}

export const gameEngine = new GameEngine();
