// backend/src/routes/roomGame.ts

import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { roomManager } from "../core/roomManager";
import { gameEngine } from "../core/gameEngine";

const createRoomGameSchema = z.object({
  hostPlayerId: z.string().min(1).optional(),
  hostDisplayName: z.string().min(1).optional(),
});

const joinRoomAndGameSchema = z.object({
  playerId: z.string().min(1),
  displayName: z.string().min(1).optional(),
});

const startRoomGameSchema = z.object({
  playerId: z.string().min(1).optional(),
});

const readySchema = z.object({
  playerId: z.string().min(1),
});

function findActiveGameId(roomId: string): string | null {
  const gamesRes = gameEngine.listGamesByRoom(roomId);
  const games = gamesRes.ok ? gamesRes.data ?? [] : [];
  const active = games.find((g) => g.phase === "running" || g.phase === "lobby") ?? null;
  return active ? active.id : null;
}

const roomGameRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/room-game/health", async () => ({
    status: "ok",
    module: "room-game",
  }));

  // Create (or reuse) an active game for a room
  fastify.post("/rooms/:id/game", async (request, reply) => {
    const roomId = (request.params as { id: string }).id;
    const room = roomManager.getRoom(roomId);

    if (!room) {
      return reply.status(404).send({ ok: false, error: "Room not found" });
    }

    const parsed = createRoomGameSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.status(400).send({ ok: false, error: "Invalid payload" });
    }

    // Keep room/game players aligned: ensure host is also in room
    if (parsed.data.hostPlayerId) {
      try {
        roomManager.joinRoom(roomId, parsed.data.hostPlayerId);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unable to join room as host";
        return reply.status(400).send({ ok: false, error: `Host join failed: ${msg}` });
      }
    }

    const activeId = findActiveGameId(roomId);
    if (activeId) {
      return reply.send({ ok: true, data: { gameId: activeId, reused: true } });
    }

    const res = gameEngine.createGame({
      roomId,
      stake: room.stake,
      minPlayers: room.minPlayers,
      maxPlayers: room.maxPlayers,
      hostPlayerId: parsed.data.hostPlayerId,
      hostDisplayName: parsed.data.hostDisplayName,
    });

    if (!res.ok) return reply.status(400).send(res);

    return reply.status(201).send({
      ok: true,
      data: { gameId: res.data!.id, reused: false },
    });
  });

  // Join room + join active game (or create one)
  fastify.post("/rooms/:id/game/join", async (request, reply) => {
    const roomId = (request.params as { id: string }).id;

    const parsed = joinRoomAndGameSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ ok: false, error: "Invalid payload" });
    }

    const room = roomManager.getRoom(roomId);
    if (!room) {
      return reply.status(404).send({ ok: false, error: "Room not found" });
    }

    // Join room (stable logic)
    try {
      roomManager.joinRoom(roomId, parsed.data.playerId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unable to join room";
      return reply.status(400).send({ ok: false, error: msg });
    }

    let activeId = findActiveGameId(roomId);

    if (!activeId) {
      const created = gameEngine.createGame({
        roomId,
        stake: room.stake,
        minPlayers: room.minPlayers,
        maxPlayers: room.maxPlayers,
        hostPlayerId: undefined,
      });
      if (!created.ok) return reply.status(400).send(created);
      activeId = created.data!.id;
    }

    const joined = gameEngine.joinGame({
      gameId: activeId,
      playerId: parsed.data.playerId,
      displayName: parsed.data.displayName,
    });

    if (!joined.ok) {
      if (joined.error?.code === "PLAYER_EXISTS") {
        return reply.send({ ok: true, data: { roomId, gameId: activeId, room, game: joined.data } });
      }
      const code = joined.error?.code;
      const status = code === "CAPACITY_FULL" ? 409 : code === "NOT_FOUND" ? 404 : 400;
      return reply.status(status).send(joined);
    }

    return reply.send({ ok: true, data: { roomId, gameId: activeId, room, game: joined.data } });
  });

  // Ready via room
  fastify.post("/rooms/:id/game/ready", async (request, reply) => {
    const roomId = (request.params as { id: string }).id;

    const parsed = readySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ ok: false, error: "Invalid payload" });
    }

    const room = roomManager.getRoom(roomId);
    if (!room) return reply.status(404).send({ ok: false, error: "Room not found" });

    const activeId = findActiveGameId(roomId);
    if (!activeId) return reply.status(404).send({ ok: false, error: "No active game for this room" });

    const res = gameEngine.applyAction(activeId, {
      type: "PLAYER_READY",
      playerId: parsed.data.playerId,
    });

    if (!res.ok) {
      const code = res.error?.code;
      const status = code === "NOT_FOUND" ? 404 : 400;
      return reply.status(status).send(res);
    }

    return reply.send({ ok: true, data: { roomId, gameId: activeId, game: res.data } });
  });

  // Unready via room
  fastify.post("/rooms/:id/game/unready", async (request, reply) => {
    const roomId = (request.params as { id: string }).id;

    const parsed = readySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ ok: false, error: "Invalid payload" });
    }

    const room = roomManager.getRoom(roomId);
    if (!room) return reply.status(404).send({ ok: false, error: "Room not found" });

    const activeId = findActiveGameId(roomId);
    if (!activeId) return reply.status(404).send({ ok: false, error: "No active game for this room" });

    const res = gameEngine.applyAction(activeId, {
      type: "PLAYER_UNREADY",
      playerId: parsed.data.playerId,
    });

    if (!res.ok) {
      const code = res.error?.code;
      const status = code === "NOT_FOUND" ? 404 : 400;
      return reply.status(status).send(res);
    }

    return reply.send({ ok: true, data: { roomId, gameId: activeId, game: res.data } });
  });

  // Start active game for room
  fastify.post("/rooms/:id/game/start", async (request, reply) => {
    const roomId = (request.params as { id: string }).id;
    const room = roomManager.getRoom(roomId);

    if (!room) {
      return reply.status(404).send({ ok: false, error: "Room not found" });
    }

    const parsed = startRoomGameSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.status(400).send({ ok: false, error: "Invalid payload" });
    }

    const activeId = findActiveGameId(roomId);
    if (!activeId) {
      return reply.status(404).send({ ok: false, error: "No active game for this room" });
    }

    const started = gameEngine.applyAction(activeId, {
      type: "START_GAME",
      playerId: parsed.data.playerId,
    });

    if (!started.ok) {
      const code = started.error?.code;
      const status = code === "NOT_AUTHORIZED" ? 403 : code === "NOT_FOUND" ? 404 : 400;
      return reply.status(status).send(started);
    }

    return reply.send({ ok: true, data: { roomId, gameId: activeId, game: started.data } });
  });

  // Finish active game for room (NEW)
  fastify.post("/rooms/:id/game/finish", async (request, reply) => {
    const roomId = (request.params as { id: string }).id;

    const parsed = startRoomGameSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.status(400).send({ ok: false, error: "Invalid payload" });
    }

    const activeId = findActiveGameId(roomId);
    if (!activeId) {
      return reply.status(404).send({ ok: false, error: "No active game for this room" });
    }

    const finished = gameEngine.applyAction(activeId, {
      type: "FINISH_GAME",
      playerId: parsed.data.playerId,
    });

    if (!finished.ok) {
      const code = finished.error?.code;
      const status = code === "NOT_AUTHORIZED" ? 403 : code === "NOT_FOUND" ? 404 : 400;
      return reply.status(status).send(finished);
    }

    return reply.send({ ok: true, data: { roomId, gameId: activeId, game: finished.data } });
  });
};

export default roomGameRoutes;
