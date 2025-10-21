"use client";

import { useEffect, useState } from "react";
import Screen from "@/components/base/Screen";
import Box from "@/components/base/Box";
import Link from "next/link";
import RoomService from "@/services/api/roomService";
import { RoomDetails } from "@/types/room";
import RoomInfoPanel from "@/components/room/RoomInfoPanel";
import SpeakersPanel from "@/components/room/SpeakersPanel";
import TranslatorsPanel from "@/components/room/TranslatorsPanel";
import { Button } from "@mui/material";

export default function RoomDetailsPage({
  params,
}: {
  params: { room: string };
}) {
  const room = params.room;

  const [details, setDetails] = useState<RoomDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setDetailsLoading(true);
        setDetailsError(null);

        const res = await RoomService.GetRoom(room);
        const raw = (res as any)?.Data ?? res;

        const vm: RoomDetails | null = raw
          ? {
              code: String(raw.code ?? room),
              name: String(raw.name ?? ""),
              description: String(raw.description ?? ""),
              speakers: Array.isArray(raw.speakers)
                ? raw.speakers.map((s: any) => ({
                    id: s.user_id ?? s.id ?? String(s.name ?? "speaker"),
                    name: String(s.name ?? ""),
                    bio: s.bio ?? null,
                    languages: Array.isArray(s.languages)
                      ? s.languages.map((l: any) => ({
                          id: l.id ?? l.code ?? String(l.name ?? "lang"),
                          code: l.code,
                          name: l.name,
                        }))
                      : [],
                  }))
                : [],
              translators: Array.isArray(raw.translators)
                ? raw.translators.map((t: any) => ({
                    id: t.user_id ?? t.id ?? String(t.name ?? "translator"),
                    name: String(t.name ?? ""),
                    pairs: Array.isArray(t.pairs)
                      ? t.pairs.map((p: any) => ({
                          source: {
                            id:
                              p?.source?.id ??
                              p?.source?.code ??
                              String(p?.source?.name ?? "source"),
                            code: p?.source?.code,
                            name: p?.source?.name,
                          },
                          target: {
                            id:
                              p?.target?.id ??
                              p?.target?.code ??
                              String(p?.target?.name ?? "target"),
                            code: p?.target?.code,
                            name: p?.target?.name,
                          },
                        }))
                      : [],
                  }))
                : [],
            }
          : null;

        if (!alive) return;
        setDetails(vm);
      } catch (e: any) {
        if (!alive) return;
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          "Falha ao carregar detalhes da sala.";
        setDetailsError(msg);
      } finally {
        if (alive) setDetailsLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [room]);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
  };

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
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 16,
            width: "100%",
            maxWidth: 980,
            margin: "0 auto",
            padding: 16,
          }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}>
            <div>
              <h2 style={{ margin: 0 }}>{details?.name ?? "Sala"}</h2>
              <div style={{ opacity: 0.7 }}>
                Código: <strong>{details?.code ?? room}</strong>
              </div>
            </div>

            <Link
              href={`/palestrante/${encodeURIComponent(room)}/transmicao`}
              prefetch>
              <Button
                variant="outlined"
                size="small"
                style={{
                  padding: "10px 16px",
                  borderRadius: 12,
                  background: "transparent",
                  cursor: "pointer",
                }}
                title="Entrar na chamada">
                Entrar na chamada
              </Button>
            </Link>
          </div>

          <RoomInfoPanel
            loading={detailsLoading}
            error={detailsError}
            details={details}
            onCopyCode={copyCode}
          />

          <SpeakersPanel
            loading={detailsLoading}
            speakers={details?.speakers}
          />

          <TranslatorsPanel
            loading={detailsLoading}
            translators={details?.translators}
          />
        </div>
      </Box.Center>
    </Screen>
  );
}
