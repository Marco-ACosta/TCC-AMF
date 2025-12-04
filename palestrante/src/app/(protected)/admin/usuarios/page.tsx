"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Screen from "@/components/base/Screen";
import Box from "@/components/base/Box";
import {
  LoadingBlock,
  ErrorBlock,
  EmptyBlock,
} from "@/components/base/LoadState";

import UsersHeader from "@/components/user/UsersHeader";
import UsersList from "@/components/user/UsersList";

import { UserItem, UserTypeFilter } from "@/types/user";
import UserService from "@/services/api/userService";

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
import UsersFilterButtons from "@/components/user/UserFilterButtons";

export default function UsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<UserTypeFilter>("all");

  const [snack, setSnack] = useState<{
    open: boolean;
    msg: string;
    sev: "success" | "error";
  }>({ open: false, msg: "", sev: "success" });

  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    target: UserItem | null;
  }>({ open: false, target: null });

  const fetchUsers = useCallback(async (f: UserTypeFilter) => {
    try {
      setLoading(true);
      setError(null);

      const typeParam =
        f === "translator" || f === "speaker" || f === "admin" ? f : undefined;

      const res = await UserService.GetUsers(typeParam);
      const data = res.Data;
      const list: UserItem[] = (data as any[]).map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        is_admin: !!u.is_admin,
        is_speaker: !!u.is_speaker,
        is_translator: !!u.is_translator,
        translator: u.translator ?? null,
        speaker: u.speaker ?? null,
        created_at: u.created_at,
        updated_at: u.updated_at,
      }));

      const normalized = f === "admin" ? list.filter((u) => u.is_admin) : list;

      setUsers(normalized);
    } catch (e: any) {
      setError(
        e?.response?.data?.message ??
          e?.message ??
          "Falha ao carregar usuários."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await fetchUsers(filter);
    })();
  }, [fetchUsers, filter]);

  function handleCreate() {
    router.push("/admin/usuarios/create");
  }

  function handleEdit(item: UserItem) {
    router.push(`/admin/usuarios/${encodeURIComponent(String(item.id))}/edit`);
  }

  function askDelete(item: UserItem) {
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
      await UserService.DeleteUser(idNum);
      setUsers((prev) => prev.filter((u) => u.id !== target.id));
      setSnack({
        open: true,
        msg: "Usuário excluído com sucesso.",
        sev: "success",
      });
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ??
        e?.message ??
        "Falha ao excluir o usuário.";
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
          justifyContent: "start",
          height: "100%",
          width: "100%",
        }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxWidth: 960,
            width: "100%",
            margin: "0 auto",
            padding: 16,
            gap: 12,
          }}>
          <Stack
            direction="row"
            spacing={3}
            sx={{ width: "100%" }}
            justifyContent="space-between">
            <UsersHeader count={users.length} />
            <div>
              <Button variant="contained" onClick={handleCreate}>
                Novo usuário
              </Button>
            </div>
          </Stack>
          <UsersFilterButtons
            filter={filter}
            onChangeFilter={(f) => setFilter(f)}
          />

          {loading && <LoadingBlock full />}
          {!!error && <ErrorBlock error={error} />}

          {!loading && !error && users.length === 0 && (
            <EmptyBlock message="Nenhum usuário encontrado." />
          )}

          {!loading && !error && users.length > 0 && (
            <UsersList users={users} onEdit={handleEdit} onDelete={askDelete} />
          )}
        </div>
      </Box.Center>

      <Dialog
        open={confirmState.open}
        onClose={() => setConfirmState({ open: false, target: null })}>
        <DialogTitle>Excluir usuário?</DialogTitle>
        <DialogContent>
          Tem certeza que deseja excluir o usuário{" "}
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
