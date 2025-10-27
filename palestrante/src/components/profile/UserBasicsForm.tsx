"use client";

import { Stack, TextField } from "@mui/material";

export default function UserBasicsForm({
  name,
  email,
  bio,
  onChangeName,
  onChangeEmail,
  onChangeBio,
  disabled,
}: {
  name: string;
  email: string;
  bio?: string;
  onChangeName: (v: string) => void;
  onChangeEmail: (v: string) => void;
  onChangeBio?: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <Stack spacing={2}>
      <TextField
        label="Nome"
        value={name}
        onChange={(e) => onChangeName(e.target.value)}
        fullWidth
        disabled={disabled}
      />
      <TextField
        label="E-mail"
        type="email"
        value={email}
        onChange={(e) => onChangeEmail(e.target.value)}
        fullWidth
        disabled={disabled}
      />
      {bio && onChangeBio && (
        <TextField
          label="Descrição"
          value={bio}
          onChange={(e) => onChangeBio(e.target.value)}
          fullWidth
          multiline
          minRows={2}
          disabled={disabled}
        />
      )}
    </Stack>
  );
}
