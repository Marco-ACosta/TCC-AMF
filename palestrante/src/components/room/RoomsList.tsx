"use client";

import { RoomItem } from "@/types/room";
import RoomCard from "./RoomCard";

export default function RoomsList({
  rooms,
  type,
}: {
  rooms: RoomItem[];
  type: string;
}) {
  return (
    <ul style={{ listStyle: "none", padding: 0, width: "100%" }}>
      {rooms.map((r) => (
        <RoomCard key={String(r.id)} room={r} type={type} />
      ))}
    </ul>
  );
}
