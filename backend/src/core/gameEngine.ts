// backend/src/core/gameEngine.ts

import { randomUUID } from "crypto";
import {
  EngineResult,
  GameAction,
  GameConfig,
  GameId,
  GamePlayer,
  GameState,
  PlayerId,
  RoomId,
  err,
  ok,
} from "../types/game";

type CreateGameInput = {
  roomId: RoomId;
  stake: GameConfig["stake"];
  minPlayers: number;
  maxPlayers: number;
  hostPlayerId?: PlayerId;
  hostDisplayName?: string;
};

type JoinGameInput = {
  gameId: GameId;
  playerId: PlayerId;
  displayName?: string;
};

export class GameEngine {
  private games = new Map<GameId, GameState>();

  createGame(input: CreateGameInput): EngineResult<GameState> {
    const now = Date.now();
    const id = randomUUID();

    const players: GamePlayer[] = [];

    if (input.hostPlayerId) {
      players.push({
        id: input.hostPlayerId,
        displayName: input.hostDisplayName,
        joinedAt: now,
        isReady: false,
        isHost: true,
      });
    }

    const game: GameState = {
      id,
      roomId: input.roomId,
      phase: "lobby",
      createdAt: now,
      config: {
        roomId: input.roomId,
        stake: input.stake,
        minPlayers: input.minPlayers,
        maxPlayers: input.maxPlayers,
      },
      players,
      meta: {},
    };

    this.games.set(id, game);
    return ok(this.clone(game));
  }

  getGame(gameId: GameId): EngineResult<GameState> {
    const game = this.games.get(gameId);
    if (!game) return err("NOT_FOUND", `Game not found: ${gameId}`);
    return ok(this.clone(game));
  }

  listGamesByRoom(roomId: RoomId): EngineResult<GameState[]> {
    const list = [...this.games.values()].filter((g) => g.roomId === roomId);
    return ok(list.map((g) => this.clone(g)));
  }

  joinGame(input: JoinGameInput): EngineResult<GameState> {
    const game = this.games.get(input.gameId);
    if (!game) return err("NOT_FOUND", `Game not found: ${input.gameId}`);

    if (game.phase !== "lobby") {
      return err("INVALID_STATE", "Cannot join: game is not in lobby phase");
    }

    const exists = game.players.some((p) => p.id === input.playerId);
    if (exists) return err("PLAYER_EXISTS", "Player already joined");

    if (game.players.length >= game.config.maxPlayers) {
      return err("CAPACITY_FULL", "Game is full");
    }

    game.players.push({
      id: input.playerId,
      displayName: input.displayName,
      joinedAt: Date.now(),
      isReady: false,
    });

    this.games.set(game.id, game);
    return ok(this.clone(game));
  }

  applyAction(gameId: GameId, action: GameAction): EngineResult<GameState> {
    const game = this.games.get(gameId);
    if (!game) return err("NOT_FOUND", `Game not found: ${gameId}`);

    const at = action.at ?? Date.now();

    switch (action.type) {
      case "PLAYER_READY": {
        if (game.phase !== "lobby") {
          return err("INVALID_STATE", "Ready is only allowed in lobby phase");
        }
        const p = this.findPlayer(game, action.playerId);
        if (!p) return err("PLAYER_NOT_FOUND", "Player not found");
        p.isReady = true;
        this.games.set(game.id, game);
        return ok(this.clone(game));
      }

      case "PLAYER_UNREADY": {
        if (game.phase !== "lobby") {
          return err("INVALID_STATE", "Unready is only allowed in lobby phase");
        }
        const p = this.findPlayer(game, action.playerId);
        if (!p) return err("PLAYER_NOT_FOUND", "Player not found");
        p.isReady = false;
        this.games.set(game.id, game);
        return ok(this.clone(game));
      }

      case "START_GAME": {
        if (game.phase !== "lobby") {
          return err("INVALID_STATE", "Game can only start from lobby phase");
        }

        const host = game.players.find((p) => p.isHost);
        if (host && action.playerId && action.playerId !== host.id) {
          return err("NOT_AUTHORIZED", "Only host can start the game");
        }

        if (game.players.length < game.config.minPlayers) {
          return err(
            "MIN_PLAYERS_NOT_MET",
            `Need at least ${game.config.minPlayers} players to start`
          );
        }

        // Optional rule: tất cả ready mới start
        const allReady = game.players.every((p) => p.isReady || p.isHost);
        if (!allReady) {
          return err("INVALID_STATE", "Not all players are ready");
        }

        game.phase = "running";
        game.startedAt = at;

        this.games.set(game.id, game);
        return ok(this.clone(game));
      }

      case "FINISH_GAME": {
        if (game.phase !== "running") {
          return err("INVALID_STATE", "Game can only finish from running phase");
        }

        const host = game.players.find((p) => p.isHost);
        if (host && action.playerId && action.playerId !== host.id) {
          return err("NOT_AUTHORIZED", "Only host can finish the game");
        }

        game.phase = "finished";
        game.finishedAt = at;

        this.games.set(game.id, game);
        return ok(this.clone(game));
      }

      default:
        return err("INVALID_ACTION", "Unknown action type");
    }
  }

  removeGame(gameId: GameId): EngineResult<{ removed: boolean }> {
    const existed = this.games.delete(gameId);
    return ok({ removed: existed });
  }

  // ===== helpers =====

  private findPlayer(game: GameState, playerId: PlayerId): GamePlayer | undefined {
    return game.players.find((p) => p.id === playerId);
  }

  private clone<T>(obj: T): T {
    // MVP: deep clone đơn giản để tránh mutate ra ngoài
    return JSON.parse(JSON.stringify(obj)) as T;
  }
}

// Singleton dùng chung (in-memory)
export const gameEngine = new GameEngine();
