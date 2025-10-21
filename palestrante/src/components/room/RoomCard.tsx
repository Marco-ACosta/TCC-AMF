"use client";

import Link from "next/link";
import { RoomItem } from "@/types/room";

type Props = { room: RoomItem; type: string };

export default function RoomCard({ room, type }: Props) {
  const href = room.code ? `/${type}/${encodeURIComponent(room.code)}` : "";

  const CardBody = (
    <div
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
      }}>
      <div>
        <strong style={{ fontSize: 16 }}>{room.name ?? "Sem nome"}</strong>
        <div style={{ fontSize: 12, opacity: 0.8 }}>
          {room.code ? `Código: ${room.code}` : "Sem código"}
        </div>
        {room.description ? (
          <p style={{ marginTop: 8 }}>{room.description}</p>
        ) : null}
      </div>

      {/* ID intencionalmente não exibido */}
    </div>
  );

  return (
    <li
      key={String(room.id)}
      style={{
        border: "1px solid #e0e0e0",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        width: "100%",
        transition: "box-shadow 0.2s, border-color 0.2s",
      }}>
      {room.code ? (
        <Link
          href={href}
          style={{ display: "block", textDecoration: "none", color: "inherit" }}
          aria-label={`Abrir sala ${room.name ?? room.code}`}>
          {CardBody}
        </Link>
      ) : (
        <div
          style={{ opacity: 0.6, cursor: "not-allowed" }}
          title="Esta sala não possui código para navegação.">
          {CardBody}
        </div>
      )}
    </li>
  );
}
