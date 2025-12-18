// backend/src/core/roomStore.ts
export type RoomId = string;
export type PlayerId = string;

export interface Room {
  id: RoomId;
  createdAt: number;
  players: PlayerId[];
}

export class RoomStore {
  private rooms = new Map<RoomId, Room>();

  createRoom(now = Date.now()): Room {
    const id = `r_${now}_${Math.random().toString(16).slice(2, 8)}`;
    const room: Room = { id, createdAt: now, players: [] };
    this.rooms.set(id, room);
    return room;
  }

  getRoom(id: RoomId): Room | undefined {
    return this.rooms.get(id);
  }

  joinRoom(id: RoomId, playerId: PlayerId): Room {
    const room = this.rooms.get(id);
    if (!room) {
      const err = new Error("ROOM_NOT_FOUND");
      (err as any).statusCode = 404;
      throw err;
    }
    if (!room.players.includes(playerId)) room.players.push(playerId);
    return room;
  }
}
