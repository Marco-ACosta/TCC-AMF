"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Screen from "@/components/base/Screen";
import Box from "@/components/base/Box";
import RoomService from "@/services/api/roomService";
import { RoomDetails } from "@/types/room";
import RoomInfoPanel from "@/components/room/RoomInfoPanel";
import SpeakersPanel from "@/components/room/SpeakersPanel";
import TranslatorsPanel from "@/components/room/TranslatorsPanel";
import {
  Button,
  Snackbar,
  Alert,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

export default function RoomDetailsPage({
  params,
}: {
  params: { room: string };
}) {
  const router = useRouter();
  const roomParam = params.room;

  const [details, setDetails] = useState<RoomDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const [snack, setSnack] = useState<{
    open: boolean;
    msg: string;
    sev: "success" | "error";
  }>({ open: false, msg: "", sev: "success" });

  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    target: RoomDetails | null;
  }>({ open: false, target: null });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setDetailsLoading(true);
        setDetailsError(null);

        const res = await RoomService.GetRoom(roomParam);
        const raw = (res as any)?.Data ?? res;

        const vm: RoomDetails | null = raw
          ? {
              id: String(raw.id ?? roomParam),
              code: String(raw.code ?? roomParam),
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
  }, [roomParam]);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setSnack({ open: true, msg: "Código copiado.", sev: "success" });
  };

  function askDelete() {
    if (!details) return;
    setConfirmState({ open: true, target: details });
  }

  async function confirmDelete() {
    const target = confirmState.target;
    if (!target?.id) return;

    try {
      await RoomService.DeleteRoom(target.id);
      setSnack({
        open: true,
        msg: "Sala excluída com sucesso.",
        sev: "success",
      });
      setConfirmState({ open: false, target: null });
      router.replace("/admin");
    } catch (e: any) {
      const msg =
        e?.response?.data?.message || e?.message || "Falha ao excluir a sala.";
      setSnack({ open: true, msg, sev: "error" });
      setConfirmState({ open: false, target: null });
    }
  }

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
                Código: <strong>{details?.code ?? roomParam}</strong>
              </div>
            </div>

            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                disabled={!details}
                onClick={() =>
                  details?.code &&
                  router.push(`/admin/${encodeURIComponent(details.code)}/edit`)
                }>
                Editar
              </Button>
              <Button
                color="error"
                variant="outlined"
                disabled={!details || detailsLoading}
                onClick={askDelete}>
                Excluir
              </Button>
            </Stack>
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

      <Dialog
        open={confirmState.open}
        onClose={() => setConfirmState({ open: false, target: null })}>
        <DialogTitle>Excluir sala?</DialogTitle>
        <DialogContent>
          Tem certeza que deseja excluir a sala{" "}
          <strong>{confirmState.target?.name}</strong>? Esta ação não pode ser
          desfeita.
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmState({ open: false, target: null })}>
            Cancelar
          </Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

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
    </Screen>
  );
}
