"use client";

import { RoomItem } from "@/types/room";
import RoomCard from "./RoomCard";

export default function RoomsList({
  rooms,
  type,
  onOpen,
  onEdit,
  onDelete,
}: {
  rooms: RoomItem[];
  type: string;
  onOpen?: (room: RoomItem) => void;
  onEdit?: (room: RoomItem) => void;
  onDelete?: (room: RoomItem) => void;
}) {
  return (
    <ul style={{ listStyle: "none", padding: 0, width: "100%" }}>
      {rooms.map((r) => (
        <RoomCard
          key={String(r.id ?? r.code)}
          room={r}
          type={type}
          onOpen={onOpen}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
