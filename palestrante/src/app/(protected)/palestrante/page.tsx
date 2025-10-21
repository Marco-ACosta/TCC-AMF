"use client";

import Box from "@/components/base/Box";
import Screen from "@/components/base/Screen";
import RoomService from "@/services/api/roomService";
import { useEffect, useState } from "react";
import Link from "next/link";

type Room = {
  id: string | number;
  name: string;
  code?: string;
  description?: string;
};

export default function RoomScreen() {
  const [rooms, setRooms] = useState<Room[]>([]);
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
        setRooms(data as Room[]);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Falha ao carregar salas.");
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
          }}>
          <h1>Salas</h1>

          {loading && <p>Carregando…</p>}

          {!!error && <p style={{ color: "red", marginTop: 8 }}>{error}</p>}

          {!loading && !error && rooms.length === 0 && (
            <p style={{ opacity: 0.8 }}>Nenhuma sala encontrada.</p>
          )}

          {!loading && !error && rooms.length > 0 && (
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                width: "100%",
              }}>
              {rooms.map((r) => {
                const href = r.code
                  ? `/palestrante/${encodeURIComponent(r.code)}`
                  : "";
                const Card = (
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                    }}>
                    <div>
                      <strong style={{ fontSize: 16 }}>
                        {r.name ?? "Sem nome"}
                      </strong>
                      <div style={{ fontSize: 12, opacity: 0.8 }}>
                        {r.code ? `Código: ${r.code}` : "Sem código"}
                      </div>
                      {r.description ? (
                        <p style={{ marginTop: 8 }}>{r.description}</p>
                      ) : null}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        opacity: 0.7,
                        alignSelf: "flex-start",
                      }}>
                      ID: {String(r.id)}
                    </div>
                  </div>
                );

                return (
                  <li
                    key={String((r as any).id ?? Math.random())}
                    style={{
                      border: "1px solid #e0e0e0",
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 12,
                      width: "100%",
                      transition: "box-shadow 0.2s, border-color 0.2s",
                    }}>
                    {r.code ? (
                      <Link
                        href={href}
                        style={{
                          display: "block",
                          textDecoration: "none",
                          color: "inherit",
                        }}
                        aria-label={`Abrir sala ${r.name ?? r.code}`}>
                        {Card}
                      </Link>
                    ) : (
                      <div
                        style={{
                          opacity: 0.6,
                          cursor: "not-allowed",
                        }}
                        title="Esta sala não possui código para navegação.">
                        {Card}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Box.Center>
    </Screen>
  );
}
