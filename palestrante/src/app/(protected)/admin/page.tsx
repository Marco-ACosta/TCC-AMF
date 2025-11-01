"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Stack,
} from "@mui/material";

export default function RoomsPage() {
  const router = useRouter();

  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [snack, setSnack] = useState<{
    open: boolean;
    msg: string;
    sev: "success" | "error";
  }>({ open: false, msg: "", sev: "success" });

  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    target: RoomItem | null;
  }>({ open: false, target: null });

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await RoomService.GetRooms?.();
      const data = Array.isArray(res) ? res : res?.Data ?? [];

      const normalized: RoomItem[] = (data as any[]).map((r) => ({
        id: r.id ?? r.room_id ?? r.code,
        name: String(r.name ?? "Sem nome"),
        code: r.code ?? r.room_code,
        description: r.description ?? r.desc ?? undefined,
      }));

      setRooms(normalized);
    } catch (e: any) {
      setError(
        e?.response?.data?.message ?? e?.message ?? "Falha ao carregar salas."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      await fetchRooms();
    })();
    return () => {
      alive = false;
    };
  }, [fetchRooms]);

  function handleCreate() {
    router.push("/admin/create");
  }

  function handleEdit(item: RoomItem) {
    const code = String(item.code ?? "").trim();
    if (!code) return;
    router.push(`/admin/${encodeURIComponent(code)}/edit`);
  }

  function handleOpen(item: RoomItem) {
    const code = String(item.code ?? "").trim();
    if (!code) return;
    router.push(`/admin/${encodeURIComponent(code)}`);
  }

  function askDelete(item: RoomItem) {
    setConfirmState({ open: true, target: item });
  }

  async function confirmDelete() {
    const target = confirmState.target;
    if (!target) return;

    const idNum =
      typeof target.id === "number" ? target.id : Number(String(target.id));

    if (Number.isNaN(idNum)) {
      setSnack({
        open: true,
        msg: "ID inválido para exclusão.",
        sev: "error",
      });
      setConfirmState({ open: false, target: null });
      return;
    }

    try {
      await RoomService.DeleteRoom(idNum);
      setRooms((prev) => prev.filter((r) => r.id !== target.id));
      setSnack({
        open: true,
        msg: "Sala excluída com sucesso.",
        sev: "success",
      });
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ?? e?.message ?? "Falha ao excluir a sala.";
      setSnack({ open: true, msg, sev: "error" });
    } finally {
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
          <div style={{ width: "100%" }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={1}>
              <RoomsHeader count={rooms.length} />
              <Button variant="contained" onClick={handleCreate}>
                Nova sala
              </Button>
            </Stack>
          </div>

          {loading && <LoadingBlock full />}
          {!!error && <ErrorBlock error={error} />}

          {!loading && !error && rooms.length === 0 && (
            <EmptyBlock message="Nenhuma sala encontrada." />
          )}

          {!loading && !error && rooms.length > 0 && (
            <RoomsList
              rooms={rooms}
              type="admin"
              onOpen={handleOpen}
              onEdit={handleEdit}
              onDelete={askDelete}
            />
          )}
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
