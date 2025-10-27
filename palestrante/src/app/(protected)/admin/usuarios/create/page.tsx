"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Screen from "@/components/base/Screen";
import Box from "@/components/base/Box";
import UserFormHeader from "@/components/user/UserFormHeader";
import UserForm from "@/components/user/UserForm";
import UserService from "@/services/api/userService";
import { UserCreatePayload } from "@/types/user";
import { Alert, Snackbar } from "@mui/material";

export default function UserCreatePage() {
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [snackOpen, setSnackOpen] = useState(false);

  async function handleCreate(payload: UserCreatePayload) {
    try {
      setSubmitting(true);
      setErrorMsg(null);
      await UserService.CreateUser(payload);
      setSnackOpen(true);
      setTimeout(() => router.push("/admin/usuarios"), 500);
    } catch (e: any) {
      const msg =
        e?.response?.data?.error ??
        e?.response?.data?.message ??
        e?.message ??
        "Falha ao criar usuário.";
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
          <UserFormHeader title="Novo usuário" />
          <UserForm
            mode="create"
            onSubmit={handleCreate}
            submitting={submitting}
            errorMsg={errorMsg}
          />
        </div>
      </Box.Center>

      <Snackbar
        open={snackOpen}
        autoHideDuration={2500}
        onClose={() => setSnackOpen(false)}>
        <Alert severity="success" variant="filled" sx={{ width: "100%" }}>
          Usuário criado com sucesso.
        </Alert>
      </Snackbar>
    </Screen>
  );
}
