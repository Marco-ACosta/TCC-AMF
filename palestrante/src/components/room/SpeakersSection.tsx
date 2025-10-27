"use client";

import { Button, Divider, Stack, Typography } from "@mui/material";
import SpeakerRowCard from "./SpeakerRowCard";
import { SimpleUser, SpeakerRow } from "@/types/room";

type Props = {
  users: SimpleUser[];
  rows: SpeakerRow[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onPatch: (index: number, patch: Partial<SpeakerRow>) => void;
  disabled?: boolean;
};

export default function SpeakersSection({
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
        <Typography variant="h6">Palestrantes</Typography>
        <Button onClick={onAdd} disabled={disabled}>
          Adicionar palestrante
        </Button>
      </Stack>

      {rows.map((row, idx) => (
        <SpeakerRowCard
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
