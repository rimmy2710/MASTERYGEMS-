"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createRoom, getRooms } from "../../lib/api";
import { Room } from "../../lib/types";

export default function LobbyPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRooms();
      setRooms(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    try {
      setLoading(true);
      setError(null);
      await createRoom({ type: "public", stake: 1, maxPlayers: 10, minPlayers: 2 });
      await loadRooms();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
        <h1 style={{ margin: 0 }}>Lobby</h1>
        <button onClick={loadRooms} disabled={loading}>
          Refresh
        </button>
        <button onClick={handleCreateRoom} disabled={loading}>
          Create Test Room
        </button>
      </div>
      {loading && <p>Loading...</p>}
      {error && (
        <p style={{ color: "#b91c1c", marginTop: "0.5rem" }}>
          {error}
        </p>
      )}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "#ffffff" }}>
          <thead>
            <tr>
              <th style={{ borderBottom: "1px solid #e5e7eb", textAlign: "left", padding: "0.5rem" }}>
                ID
              </th>
              <th style={{ borderBottom: "1px solid #e5e7eb", textAlign: "left", padding: "0.5rem" }}>
                Type
              </th>
              <th style={{ borderBottom: "1px solid #e5e7eb", textAlign: "left", padding: "0.5rem" }}>
                Stake
              </th>
              <th style={{ borderBottom: "1px solid #e5e7eb", textAlign: "left", padding: "0.5rem" }}>
                Players
              </th>
              <th style={{ borderBottom: "1px solid #e5e7eb", textAlign: "left", padding: "0.5rem" }}>
                Status
              </th>
              <th style={{ borderBottom: "1px solid #e5e7eb", textAlign: "left", padding: "0.5rem" }}>
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {rooms.length === 0 && !loading ? (
              <tr>
                <td colSpan={6} style={{ padding: "0.75rem" }}>
                  No rooms available.
                </td>
              </tr>
            ) : (
              rooms.map((room) => (
                <tr key={room.id}>
                  <td style={{ padding: "0.75rem", borderBottom: "1px solid #e5e7eb" }}>{room.id}</td>
                  <td style={{ padding: "0.75rem", borderBottom: "1px solid #e5e7eb" }}>{room.type}</td>
                  <td style={{ padding: "0.75rem", borderBottom: "1px solid #e5e7eb" }}>{room.stake}</td>
                  <td style={{ padding: "0.75rem", borderBottom: "1px solid #e5e7eb" }}>
                    {room.players.length} / {room.maxPlayers}
                  </td>
                  <td style={{ padding: "0.75rem", borderBottom: "1px solid #e5e7eb" }}>{room.status}</td>
                  <td style={{ padding: "0.75rem", borderBottom: "1px solid #e5e7eb" }}>
                    <Link href={`/battle/${room.id}`} style={{ color: "#2563eb" }}>
                      Open
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
