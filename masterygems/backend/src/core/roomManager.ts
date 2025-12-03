import { Room, RoomType, StakeLevel, Player } from "../types/room";

class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private roomCounter = 1;

  listRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  getRoom(id: string): Room | undefined {
    return this.rooms.get(id);
  }

  createRoom(params: { type: RoomType; stake: StakeLevel; maxPlayers: number; minPlayers: number }): Room {
    const roomId = String(this.roomCounter++);
    const newRoom: Room = {
      id: roomId,
      type: params.type,
      stake: params.stake,
      maxPlayers: params.maxPlayers,
      minPlayers: params.minPlayers,
      players: [],
      status: "waiting",
      createdAt: Date.now()
    };

    this.rooms.set(roomId, newRoom);
    return newRoom;
  }

  joinRoom(roomId: string, playerId: string): Room {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    if (room.status !== "waiting") {
      throw new Error("Room is not available for joining");
    }

    if (room.players.some((player) => player.id === playerId)) {
      return room;
    }

    if (room.players.length >= room.maxPlayers) {
      throw new Error("Room is full");
    }

    const newPlayer: Player = { id: playerId, joinedAt: Date.now() };
    room.players.push(newPlayer);

    if (room.players.length >= room.minPlayers) {
      room.status = "in-progress";
    }

    return room;
  }
}

export const roomManager = new RoomManager();
