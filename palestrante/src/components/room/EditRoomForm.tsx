"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Snackbar } from "@mui/material";

import RoomService from "@/services/api/roomService";
import UserService from "@/services/api/userService";
import { SimpleUser, SpeakerRow, TranslatorRow } from "@/types/room";
import RoomForm from "./RoomForm";

export default function EditRoomForm({ code }: { code: string }) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [roomId, setRoomId] = useState<number | string | null>(null);
  const [translatorUsers, setTranslatorUsers] = useState<SimpleUser[]>([]);
  const [speakerUsers, setSpeakerUsers] = useState<SimpleUser[]>([]);

  const [initial, setInitial] = useState<{
    name?: string;
    description?: string | null;
    translators?: TranslatorRow[];
    speakers?: SpeakerRow[];
  } | null>(null);

  const [snack, setSnack] = useState<{
    open: boolean;
    msg: string;
    sev: "success" | "error";
  }>({
    open: false,
    msg: "",
    sev: "success",
  });
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const [tRes, sRes] = await Promise.all([
          (UserService as any).GetUsers("translator"),
          (UserService as any).GetUsers("speaker"),
        ]);
        const tData = Array.isArray(tRes) ? tRes : tRes?.Data ?? [];
        const sData = Array.isArray(sRes) ? sRes : sRes?.Data ?? [];

        const tUsers: SimpleUser[] = (tData as any[]).map((u) => ({
          id: u.id,
          name: u.name ?? u.email ?? String(u.id),
          languages: Array.isArray(u?.translator?.languages)
            ? u.translator.languages.map((l: any) => ({
                id: l.id,
                code: l.code,
                name: l.name,
              }))
            : [],
        }));

        const sUsers: SimpleUser[] = (sData as any[]).map((u) => ({
          id: u.id,
          name: u.name ?? u.email ?? String(u.id),
          languages: Array.isArray(u?.speaker?.languages)
            ? u.speaker.languages.map((l: any) => ({
                id: l.id,
                code: l.code,
                name: l.name,
              }))
            : [],
        }));

        const res = await RoomService.GetRoom(code);
        const raw: any = (res as any)?.Data ?? res;

        if (!alive) return;
        setTranslatorUsers(tUsers);
        setSpeakerUsers(sUsers);

        setRoomId(raw?.id ?? null);

        const preT: TranslatorRow[] = Array.isArray(raw?.translators)
          ? raw.translators.flatMap((t: any) =>
              Array.isArray(t?.pairs)
                ? t.pairs.map((p: any) => {
                    console.log("p", p);
                    return {
                      user_id: t?.id ?? t?.user_id,
                      from_language_id: p?.source?.id ?? p?.source?.code,
                      to_language_id: p?.target?.id ?? p?.target?.code,
                      _error: null,
                    };
                  })
                : []
            )
          : [];

        const preS: SpeakerRow[] = Array.isArray(raw?.speakers)
          ? raw.speakers.flatMap((s: any) =>
              Array.isArray(s?.languages)
                ? s.languages.map((l: any) => ({
                    user_id: s?.id ?? s?.user_id,
                    language_id: l?.id ?? l?.code,
                    _error: null,
                  }))
                : []
            )
          : [];

        setInitial({
          name: String(raw?.name ?? ""),
          description: String(raw?.description ?? ""),
          translators: preT,
          speakers: preS,
        });
      } catch (e: any) {
        const msg =
          e?.response?.data?.message || e?.message || "Falha ao carregar sala.";
        setSnack({ open: true, msg, sev: "error" });
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [code]);

  async function onSubmit(payload: {
    name: string;
    description: string | null;
    translators?: {
      user_id: number;
      from_language_id: number;
      to_language_id: number;
    }[];
    speakers?: { user_id: number; language_id: number }[];
  }) {
    if (!roomId) return;
    try {
      setSaving(true);
      await RoomService.UpdateRoom(roomId, payload);
      setSnack({ open: true, msg: "Sala atualizada!", sev: "success" });
      router.replace(`/admin/${encodeURIComponent(code)}`);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ?? e?.message ?? "Falha ao atualizar sala.";
      setSnack({ open: true, msg, sev: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <RoomForm
        key={String(roomId ?? code)}
        mode="edit"
        initial={initial ?? undefined}
        translatorUsers={translatorUsers}
        speakerUsers={speakerUsers}
        loading={loading}
        saving={saving}
        onCancel={() => router.back()}
        onSubmit={onSubmit}
      />

      <Snackbar
        open={snack.open}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        autoHideDuration={3000}>
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.sev}
          variant="filled"
          sx={{ width: "100%" }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </>
  );
}
