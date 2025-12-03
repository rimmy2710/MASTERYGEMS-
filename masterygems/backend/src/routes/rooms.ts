import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { roomManager } from "../core/roomManager";
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

    return room;
  });

  fastify.post("/rooms/:id/commit", async (_request, reply) => {
    return reply.status(501).send({ error: "Not implemented yet", code: 501 });
  });

  fastify.post("/rooms/:id/reveal", async (_request, reply) => {
    return reply.status(501).send({ error: "Not implemented yet", code: 501 });
  });
};

export default roomsRoutes;
