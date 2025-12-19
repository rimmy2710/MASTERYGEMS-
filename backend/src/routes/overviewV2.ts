// backend/src/routes/overviewV2.ts
import { FastifyPluginAsync } from "fastify";
import { roomManager } from "../core/roomManager";
import { gameEngine } from "../core/gameEngine";
import { Room } from "../types/room";
import { GameState } from "../types/game";

type GameSummary = {
  id: string;
  phase: GameState["phase"];
  createdAt: number;
  startedAt?: number;
  finishedAt?: number;
  playersCount: number;
  stake: number;
};

function pickActiveOrRecentGame(games: GameState[]): GameState | null {
  if (!games.length) return null;

  const running = games.filter((g) => g.phase === "running");
  if (running.length) return running.sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0))[0];

  const lobby = games.filter((g) => g.phase === "lobby");
  if (lobby.length) return lobby.sort((a, b) => b.createdAt - a.createdAt)[0];

  return games
    .filter((g) => g.phase === "finished")
    .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0))[0];
}

function toGameSummary(game: GameState): GameSummary {
  return {
    id: game.id,
    phase: game.phase,
    createdAt: game.createdAt,
    startedAt: game.startedAt,
    finishedAt: game.finishedAt,
    playersCount: game.players.length,
    stake: game.config.stake,
  };
}

type RoomOverview = Room & { game: GameSummary | null };

const overviewV2Routes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/v2/overview/health", async () => ({
    ok: true,
    data: { status: "ok", module: "overview-v2" },
  }));

  fastify.get("/v2/overview/rooms", async () => {
    const rooms = roomManager.listRooms();

    const data: RoomOverview[] = rooms.map((room) => {
      const gamesRes = gameEngine.listGamesByRoom(room.id);
      const games = gamesRes.ok ? gamesRes.data ?? [] : [];
      const picked = pickActiveOrRecentGame(games);
      return { ...room, game: picked ? toGameSummary(picked) : null };
    });

    return { ok: true, data };
  });

  fastify.get("/v2/overview/rooms/:id", async (request, reply) => {
    const roomId = (request.params as { id: string }).id;
    const room = roomManager.getRoom(roomId);
    if (!room) return reply.status(404).send({ ok: false, error: "Room not found" });

    const gamesRes = gameEngine.listGamesByRoom(room.id);
    const games = gamesRes.ok ? gamesRes.data ?? [] : [];
    const picked = pickActiveOrRecentGame(games);

    return {
      ok: true,
      data: {
        room,
        game: picked ? picked : null,
      },
    };
  });
};

export default overviewV2Routes;
