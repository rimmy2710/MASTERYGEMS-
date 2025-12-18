// backend/src/routes/games.ts

import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { gameEngine } from "../core/gameEngine";

const stakeSchema = z.union([z.literal(1), z.literal(5), z.literal(10)]);

const createGameSchema = z.object({
  roomId: z.string().min(1),
  stake: stakeSchema,
  minPlayers: z.number().int().min(2).max(100),
  maxPlayers: z.number().int().min(2).max(100),
  hostPlayerId: z.string().min(1).optional(),
  hostDisplayName: z.string().min(1).optional(),
});

const joinGameSchema = z.object({
  playerId: z.string().min(1),
  displayName: z.string().min(1).optional(),
});

const actionSchema = z.object({
  type: z.union([
    z.literal("PLAYER_READY"),
    z.literal("PLAYER_UNREADY"),
    z.literal("START_GAME"),
    z.literal("FINISH_GAME"),
  ]),
  playerId: z.string().min(1).optional(),
  at: z.number().int().optional(),
});

const gamesRoutes: FastifyPluginAsync = async (fastify) => {
  // Health riêng cho module games (để biết route đã được load)
  fastify.get("/games/health", async () => ({
    status: "ok",
    module: "games",
  }));

  // Create game
  fastify.post("/games", async (request, reply) => {
    const parsed = createGameSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ ok: false, error: "Invalid payload" });
    }

    const res = gameEngine.createGame(parsed.data);
    if (!res.ok) return reply.status(400).send(res);

    return reply.status(201).send(res);
  });

  // Get game by id
  fastify.get("/games/:gameId", async (request, reply) => {
    const gameId = (request.params as any).gameId as string;

    const res = gameEngine.getGame(gameId);
    if (!res.ok) return reply.status(404).send(res);

    return reply.send(res);
  });

  // List games by room
  fastify.get("/rooms/:roomId/games", async (request) => {
    const roomId = (request.params as any).roomId as string;
    return gameEngine.listGamesByRoom(roomId);
  });

  // Join game
  fastify.post("/games/:gameId/join", async (request, reply) => {
    const gameId = (request.params as any).gameId as string;
    const parsed = joinGameSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ ok: false, error: "Invalid payload" });
    }

    const res = gameEngine.joinGame({ gameId, ...parsed.data });
    if (!res.ok) {
      const code = res.error?.code;
      const status =
        code === "NOT_FOUND" ? 404 : code === "CAPACITY_FULL" ? 409 : 400;
      return reply.status(status).send(res);
    }

    return reply.send(res);
  });

  // Apply action
  fastify.post("/games/:gameId/action", async (request, reply) => {
    const gameId = (request.params as any).gameId as string;
    const parsed = actionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ ok: false, error: "Invalid payload" });
    }

    const res = gameEngine.applyAction(gameId, parsed.data as any);
    if (!res.ok) {
      const code = res.error?.code;
      const status = code === "NOT_FOUND" ? 404 : code === "NOT_AUTHORIZED" ? 403 : 400;
      return reply.status(status).send(res);
    }

    return reply.send(res);
  });
};

export default gamesRoutes;
