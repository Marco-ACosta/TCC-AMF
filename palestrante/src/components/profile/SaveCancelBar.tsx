"use client";

import { Stack, Button } from "@mui/material";

export default function SaveCancelBar({
  saving,
  onSave,
  onCancel,
  align = "space-between",
}: {
  saving?: boolean;
  onSave: () => void;
  onCancel: () => void;
  align?: "space-between" | "end" | "start";
}) {
  const justifyContent =
    align === "end"
      ? "flex-end"
      : align === "start"
      ? "flex-start"
      : "space-between";

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent={justifyContent}
      spacing={1}
      sx={{ mb: 1 }}>
      <Button variant="outlined" onClick={onCancel} disabled={!!saving}>
        Cancelar
      </Button>
      <Button variant="contained" onClick={onSave} disabled={!!saving}>
        {saving ? "Salvando..." : "Salvar"}
      </Button>
    </Stack>
  );
}
