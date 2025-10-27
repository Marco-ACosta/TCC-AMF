"use client";

import { Chip, Stack } from "@mui/material";

type Props = {
  is_admin?: boolean;
  is_translator?: boolean;
  is_speaker?: boolean;
};

export default function RoleChips({
  is_admin,
  is_translator,
  is_speaker,
}: Props) {
  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      {is_admin && <Chip size="small" color="warning" label="Admin" />}
      {is_translator && <Chip size="small" color="primary" label="Tradutor" />}
      {is_speaker && (
        <Chip size="small" color="secondary" label="Palestrante" />
      )}
      {!is_admin && !is_translator && !is_speaker && (
        <Chip size="small" label="Usuário" />
      )}
    </Stack>
  );
}
