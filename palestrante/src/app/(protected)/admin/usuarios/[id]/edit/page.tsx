"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Screen from "@/components/base/Screen";
import Box from "@/components/base/Box";
import { LoadingBlock, ErrorBlock } from "@/components/base/LoadState";
import UserFormHeader from "@/components/user/UserFormHeader";
import UserForm from "@/components/user/UserForm";
import UserService from "@/services/api/userService";
import { UserItem, UserUpdatePayload } from "@/types/user";
import { Alert, Snackbar } from "@mui/material";
import { LocalStorage } from "@/storage/LocalStorage";

export default function UserEditPage() {
  const router = useRouter();
  const params = useParams();
  const idParam = params?.id ? String(params.id) : "";

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [snackOpen, setSnackOpen] = useState(false);

  const meId = LocalStorage.userId.get();

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await UserService.GetUsers();
      const data = Array.isArray(res) ? res : res?.Data ?? [];
      const found = (data as any[]).find((u: any) => String(u.id) === idParam);
      if (!found) {
        setError("Usuário não encontrado.");
        setUser(null);
        return;
      }
      const mapped: UserItem = {
        id: found.id,
        name: found.name,
        email: found.email,
        is_admin: !!found.is_admin,
        is_speaker: !!found.is_speaker,
        is_translator: !!found.is_translator,
        translator: found.translator ?? null,
        speaker: found.speaker ?? null,
        created_at: found.created_at,
        updated_at: found.updated_at,
      };
      setUser(mapped);
    } catch (e: any) {
      setError(
        e?.response?.data?.message ?? e?.message ?? "Falha ao carregar usuário."
      );
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [idParam]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const isSelf = useMemo(() => String(meId ?? "") === idParam, [meId, idParam]);

  async function handleSave(payload: UserUpdatePayload) {
    try {
      setSubmitting(true);
      setErrorMsg(null);

      if (isSelf) {
        await UserService.UpdateSelf(payload);
      } else {
        await UserService.UpdateUser(payload, idParam);
      }

      setSnackOpen(true);
      setTimeout(() => router.push("/admin/usuarios"), 500);
    } catch (e: any) {
      const msg =
        e?.response?.data?.error ??
        e?.response?.data?.message ??
        e?.message ??
        "Falha ao salvar alterações.";
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
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
            maxWidth: 720,
            width: "100%",
            margin: "0 auto",
            padding: 16,
          }}>
          <UserFormHeader title="Editar usuário" />

          {loading && <LoadingBlock full />}
          {!!error && !loading && <ErrorBlock error={error} />}

          {!loading && !error && user && (
            <UserForm
              mode="edit"
              initial={user}
              onSubmit={handleSave}
              submitting={submitting}
              errorMsg={!isSelf ? errorMsg ?? "Editando um terceiro" : errorMsg}
            />
          )}
        </div>
      </Box.Center>

      <Snackbar
        open={snackOpen}
        autoHideDuration={2500}
        onClose={() => setSnackOpen(false)}>
        <Alert severity="success" variant="filled" sx={{ width: "100%" }}>
          Alterações salvas com sucesso.
        </Alert>
      </Snackbar>
    </Screen>
  );
}
