"use client";

import { Stack, TextField } from "@mui/material";

export default function PasswordChangeForm({
  password,
  confirmPassword,
  onChangePassword,
  onChangeConfirmPassword,
  disabled,
}: {
  password: string;
  confirmPassword: string;
  onChangePassword: (v: string) => void;
  onChangeConfirmPassword: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <Stack spacing={2}>
      <TextField
        label="Nova senha"
        type="password"
        value={password}
        onChange={(e) => onChangePassword(e.target.value)}
        helperText="Mínimo de 8 caracteres."
        fullWidth
        disabled={disabled}
      />
      <TextField
        label="Confirmar nova senha"
        type="password"
        value={confirmPassword}
        onChange={(e) => onChangeConfirmPassword(e.target.value)}
        fullWidth
        disabled={disabled}
      />
    </Stack>
  );
}
