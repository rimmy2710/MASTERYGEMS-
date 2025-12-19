import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { gameEngine } from "../core/gameEngine";

type Ok<T> = { ok: true; data: T };
type Err = { ok: false; error: string | { code?: string; message: string } };

function ok<T>(data: T): Ok<T> {
  return { ok: true, data };
}

function err(message: string, code?: string): Err {
  return { ok: false, error: code ? { code, message } : message };
}

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

/**
 * Games v2: standardized envelope { ok, data } and { ok:false, error }
 * This plugin should be registered with prefix "/v2" in server.ts
 *
 * Endpoints:
 *  - GET  /v2/games/health
 *  - POST /v2/games
 *  - GET  /v2/games/:gameId
 *  - GET  /v2/rooms/:roomId/games
 *  - POST /v2/games/:gameId/join
 *  - POST /v2/games/:gameId/action
 */
const gamesV2Routes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/games/health", async () => ok({ status: "ok", module: "games-v2" }));

  fastify.post("/games", async (request, reply) => {
    const parsed = createGameSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send(err("Invalid payload", "INVALID_PAYLOAD"));
    }

    const res = gameEngine.createGame(parsed.data);
    if (!res.ok) return reply.status(400).send(res); // already {ok:false,...}

    return reply.status(201).send(res); // already {ok:true,data}
  });

  fastify.get("/games/:gameId", async (request, reply) => {
    const gameId = (request.params as any).gameId as string;

    const res = gameEngine.getGame(gameId);
    if (!res.ok) return reply.status(404).send(res);

    return reply.send(res);
  });

  fastify.get("/rooms/:roomId/games", async (request, reply) => {
    const roomId = (request.params as any).roomId as string;

    const res = gameEngine.listGamesByRoom(roomId);
    // Ensure envelope even if implementation changes later
    if (res && typeof res === "object" && "ok" in (res as any)) {
      return reply.send(res as any);
    }
    return reply.send(ok(res as any));
  });

  fastify.post("/games/:gameId/join", async (request, reply) => {
    const gameId = (request.params as any).gameId as string;
    const parsed = joinGameSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send(err("Invalid payload", "INVALID_PAYLOAD"));
    }

    const res = gameEngine.joinGame({ gameId, ...parsed.data });
    if (!res.ok) {
      const code = res.error?.code;
      const status = code === "NOT_FOUND" ? 404 : code === "CAPACITY_FULL" ? 409 : 400;
      return reply.status(status).send(res);
    }

    return reply.send(res);
  });

  fastify.post("/games/:gameId/action", async (request, reply) => {
    const gameId = (request.params as any).gameId as string;
    const parsed = actionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send(err("Invalid payload", "INVALID_PAYLOAD"));
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

export default gamesV2Routes;
