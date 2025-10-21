"use client";

import { useEffect, useState } from "react";
import Screen from "@/components/base/Screen";
import Box from "@/components/base/Box";
import RoomService from "@/services/api/roomService";

import RoomsHeader from "@/components/room/RoomsHeader";
import RoomsList from "@/components/room/RoomsList";
import {
  LoadingBlock,
  ErrorBlock,
  EmptyBlock,
} from "@/components/base/LoadState";

import { RoomItem } from "@/types/room";

export default function RoomsPage() {
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await RoomService.GetRooms();
        const data = Array.isArray(res) ? res : res?.Data ?? [];

        if (!alive) return;

        const normalized: RoomItem[] = (data as any[]).map((r) => ({
          id: r.id ?? r.room_id ?? r.code ?? Math.random(),
          name: String(r.name ?? "Sem nome"),
          code: r.code ?? r.room_code,
          description: r.description ?? r.desc ?? undefined,
        }));

        setRooms(normalized);
      } catch (e: any) {
        if (!alive) return;
        setError(
          e?.response?.data?.message ?? e?.message ?? "Falha ao carregar salas."
        );
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <Screen>
      <Box.Center
        style={{
          alignContent: "center",
          justifyContent: "center",
          height: "100%",
          width: "100%",
        }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            height: "100%",
            width: "100%",
            maxWidth: 960,
            margin: "0 auto",
            padding: 16,
            gap: 12,
          }}>
          <RoomsHeader count={rooms.length} />

          {loading && <LoadingBlock />}
          {!!error && <ErrorBlock error={error} />}

          {!loading && !error && rooms.length === 0 && (
            <EmptyBlock message="Nenhuma sala encontrada." />
          )}

          {!loading && !error && rooms.length > 0 && (
            <RoomsList rooms={rooms} type={"palestrante"} />
          )}
        </div>
      </Box.Center>
    </Screen>
  );
}
