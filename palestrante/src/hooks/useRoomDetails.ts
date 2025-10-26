"use client";

import { useCallback, useEffect, useState } from "react";
import { RoomDetails } from "@/types/room";
import RoomService from "@/services/api/roomService";

type UseRoomDetailsReturn = {
  details: RoomDetails | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
};

export function useRoomDetails(room_code: string): UseRoomDetailsReturn {
  const [details, setDetails] = useState<RoomDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState<number>(0);

  const reload = useCallback(() => setTick((v) => v + 1), []);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await RoomService.getRoomDetails(room_code);
        if (!alive) return;
        setDetails(data);
      } catch (e: any) {
        if (!alive) return;
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          "Falha ao carregar detalhes da sala.";
        setError(msg);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [room_code, tick]);

  return { details, loading, error, reload };
}
