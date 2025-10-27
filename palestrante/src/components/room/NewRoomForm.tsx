"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Snackbar } from "@mui/material";

import RoomService from "@/services/api/roomService";
import UserService from "@/services/api/userService";
import { SimpleUser } from "@/types/room";
import RoomForm from "./RoomForm";

export default function NewRoomForm() {
  const router = useRouter();

  const [translatorUsers, setTranslatorUsers] = useState<SimpleUser[]>([]);
  const [speakerUsers, setSpeakerUsers] = useState<SimpleUser[]>([]);
  const [saving, setSaving] = useState(false);
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
                id: l.id ?? l.code,
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
                id: l.id ?? l.code,
                code: l.code,
                name: l.name,
              }))
            : [],
        }));

        if (!alive) return;
        setTranslatorUsers(tUsers);
        setSpeakerUsers(sUsers);
      } catch {
        if (!alive) return;
        setTranslatorUsers([]);
        setSpeakerUsers([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

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
    try {
      setSaving(true);
      const res = await RoomService.CreateRoom(payload);
      const raw = (res as any)?.Data ?? res;
      const code = raw?.code ?? "";
      setSnack({ open: true, msg: "Sala criada!", sev: "success" });
      if (code) router.replace(`/admin/${encodeURIComponent(code)}`);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ?? e?.message ?? "Falha ao criar sala.";
      setSnack({ open: true, msg, sev: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <RoomForm
        mode="create"
        translatorUsers={translatorUsers}
        speakerUsers={speakerUsers}
        onCancel={() => router.back()}
        onSubmit={onSubmit}
        saving={saving}
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
