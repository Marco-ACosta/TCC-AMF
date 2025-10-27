"use client";

import { IconButton, Stack, Typography } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  error?: string | null;
  onRemove: () => void;
  disabled?: boolean;
};

export default function RowCard({
  children,
  error,
  onRemove,
  disabled,
}: Props) {
  return (
    <Stack spacing={1} sx={{ border: "1px solid #eee", borderRadius: 2, p: 1 }}>
      <Stack direction="row" spacing={1} alignItems="flex-start">
        <Stack direction="row" spacing={1} sx={{ flex: 1 }}>
          {children}
        </Stack>
        <IconButton aria-label="remover" onClick={onRemove} disabled={disabled}>
          <DeleteIcon />
        </IconButton>
      </Stack>
      {error && (
        <Typography variant="caption" color="error">
          {error}
        </Typography>
      )}
    </Stack>
  );
}
