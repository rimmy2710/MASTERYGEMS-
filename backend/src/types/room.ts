export type RoomType = "public" | "creator";

export type StakeLevel = 1 | 5 | 10;

export interface Player {
  id: string;
  joinedAt: number;
}

export type RoomStatus = "waiting" | "in-progress" | "finished";

export interface Room {
  id: string;
  type: RoomType;
  stake: StakeLevel;
  maxPlayers: number;
  minPlayers: number;
  players: Player[];
  status: RoomStatus;
  createdAt: number;
}
