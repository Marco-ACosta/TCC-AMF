"use client";

import { Button, Divider, Stack, Typography } from "@mui/material";
import TranslatorRowCard from "./TranslatorRowCard";
import { SimpleUser, TranslatorRow } from "@/types/room";

type Props = {
  users: SimpleUser[];
  rows: TranslatorRow[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onPatch: (index: number, patch: Partial<TranslatorRow>) => void;
  disabled?: boolean;
};

export default function TranslatorsSection({
  users,
  rows,
  onAdd,
  onRemove,
  onPatch,
  disabled,
}: Props) {
  return (
    <>
      <Divider />
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h6">Tradutores</Typography>
        <Button onClick={onAdd} disabled={disabled}>
          Adicionar tradutor
        </Button>
      </Stack>

      {rows.map((row, idx) => (
        <TranslatorRowCard
          key={idx}
          row={row}
          users={users}
          onChange={(patch) => onPatch(idx, patch)}
          onRemove={() => onRemove(idx)}
          disabled={disabled}
        />
      ))}
    </>
  );
}
