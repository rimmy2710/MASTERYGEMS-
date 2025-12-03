import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { gameEngine } from "../core/gameEngine";
import { roomManager } from "../core/roomManager";
import { MoveOption } from "../types/game";
import { RoomType, StakeLevel } from "../types/room";

const roomsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/health", async () => ({ status: "ok", service: "masterygems-backend" }));

  fastify.get("/rooms", async () => {
    return roomManager.listRooms();
  });

  const createRoomSchema = z.object({
    type: z.union([z.literal("public"), z.literal("creator")]),
    stake: z.union([z.literal(1), z.literal(5), z.literal(10)]),
    maxPlayers: z.number().min(2).max(100),
    minPlayers: z.number().min(2)
  });

  fastify.post("/rooms", async (request, reply) => {
    const parseResult = createRoomSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: "Invalid room payload" });
    }

    const { type, stake, maxPlayers, minPlayers } = parseResult.data;
    const room = roomManager.createRoom({ type: type as RoomType, stake: stake as StakeLevel, maxPlayers, minPlayers });
    return reply.code(201).send(room);
  });

  const joinRoomSchema = z.object({
    playerId: z.string().min(1)
  });

  const commitSchema = z.object({
    playerId: z.string().min(1),
    commitHash: z.string().min(1)
  });

  const revealSchema = z.object({
    playerId: z.string().min(1),
    move: z.enum(["rock", "paper", "scissors"]),
    salt: z.string().min(1)
  });

  fastify.post("/rooms/:id/join", async (request, reply) => {
    const parseResult = joinRoomSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: "Invalid join payload" });
    }

    const roomId = (request.params as { id: string }).id;

    try {
      const room = roomManager.joinRoom(roomId, parseResult.data.playerId);
      return { room };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to join room";
      return reply.status(400).send({ error: message });
    }
  });

  fastify.get("/rooms/:id/state", async (request, reply) => {
    const roomId = (request.params as { id: string }).id;
    const room = roomManager.getRoom(roomId);

    if (!room) {
      return reply.status(404).send({ error: "Room not found" });
    }

    const game = gameEngine.getGameState(roomId);
    return { room, game };
  });

  fastify.post("/rooms/:id/commit", async (request, reply) => {
    const parseResult = commitSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: "Invalid commit payload" });
    }

    const roomId = (request.params as { id: string }).id;
    const room = roomManager.getRoom(roomId);
    if (!room) {
      return reply.status(404).send({ error: "Room not found" });
    }

    const { playerId, commitHash } = parseResult.data;

    try {
      const game = gameEngine.commitMove(roomId, playerId, commitHash);
      return { game };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to commit move";
      return reply.status(400).send({ error: message });
    }
  });

  fastify.post("/rooms/:id/reveal", async (request, reply) => {
    const parseResult = revealSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: "Invalid reveal payload" });
    }

    const roomId = (request.params as { id: string }).id;
    const room = roomManager.getRoom(roomId);
    if (!room) {
      return reply.status(404).send({ error: "Room not found" });
    }

    const { playerId, move, salt } = parseResult.data as { playerId: string; move: MoveOption; salt: string };

    try {
      const game = gameEngine.revealMove(roomId, playerId, move, salt);
      return { game };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to reveal move";
      return reply.status(400).send({ error: message });
    }
  });
};

export default roomsRoutes;
