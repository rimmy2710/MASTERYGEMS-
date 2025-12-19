import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { roomManager } from "../core/roomManager";
import { RoomType, StakeLevel } from "../types/room";

type Ok<T> = { ok: true; data: T };
type Err = { ok: false; error: string | { code?: string; message: string } };

function ok<T>(data: T): Ok<T> {
  return { ok: true, data };
}

function err(message: string, code?: string): Err {
  return { ok: false, error: code ? { code, message } : message };
}

/**
 * Rooms v2: wrap responses into { ok, data } (and { ok:false, error })
 * This plugin should be registered with prefix "/v2" in server.ts
 * Endpoints:
 *  - GET    /v2/rooms
 *  - POST   /v2/rooms
 *  - POST   /v2/rooms/:id/join
 *  - GET    /v2/rooms/:id/state
 */
const roomsV2Routes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/health", async () => ok({ status: "ok", module: "rooms-v2" }));

  fastify.get("/rooms", async () => {
    const rooms = roomManager.listRooms();
    return ok(rooms);
  });

  const createRoomSchema = z.object({
    type: z.union([z.literal("public"), z.literal("creator")]),
    stake: z.union([z.literal(1), z.literal(5), z.literal(10)]),
    maxPlayers: z.number().min(2).max(100),
    minPlayers: z.number().min(2),
  });

  fastify.post("/rooms", async (request, reply) => {
    const parsed = createRoomSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send(err("Invalid room payload", "INVALID_PAYLOAD"));
    }

    const { type, stake, maxPlayers, minPlayers } = parsed.data;
    const room = roomManager.createRoom({
      type: type as RoomType,
      stake: stake as StakeLevel,
      maxPlayers,
      minPlayers,
    });

    return reply.status(201).send(ok(room));
  });

  const joinRoomSchema = z.object({
    playerId: z.string().min(1),
  });

  fastify.post("/rooms/:id/join", async (request, reply) => {
    const parsed = joinRoomSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send(err("Invalid join payload", "INVALID_PAYLOAD"));
    }

    const roomId = (request.params as { id: string }).id;

    try {
      const room = roomManager.joinRoom(roomId, parsed.data.playerId);
      return ok({ room });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unable to join room";
      return reply.status(400).send(err(message, "JOIN_FAILED"));
    }
  });

  fastify.get("/rooms/:id/state", async (request, reply) => {
    const roomId = (request.params as { id: string }).id;
    const room = roomManager.getRoom(roomId);

    if (!room) {
      return reply.status(404).send(err("Room not found", "NOT_FOUND"));
    }

    return ok(room);
  });
};

export default roomsV2Routes;
