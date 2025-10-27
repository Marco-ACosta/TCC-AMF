"use client";

import { useMemo } from "react";
import RowCard from "./RowCard";
import UserAutocomplete from "./UserAutocomplete";
import LanguageAutocomplete from "./LanguageAutocomplete";
import { SimpleUser, SpeakerRow } from "@/types/room";

type Props = {
  row: SpeakerRow;
  users: SimpleUser[];
  onChange: (patch: Partial<SpeakerRow>) => void;
  onRemove: () => void;
  disabled?: boolean;
};

export default function SpeakerRowCard({
  row,
  users,
  onChange,
  onRemove,
  disabled,
}: Props) {
  const selectedUser = useMemo(
    () => users.find((u) => String(u.id) === String(row.user_id ?? "")),
    [users, row.user_id]
  );
  const langs = selectedUser?.languages ?? [];

  return (
    <RowCard onRemove={onRemove} error={row._error} disabled={disabled}>
      <UserAutocomplete
        label="Palestrante"
        users={users}
        value_id={row.user_id}
        onChangeId={(id) => onChange({ user_id: id, language_id: undefined })}
        sx={{ minWidth: 260, flex: 1 }}
        disabled={disabled}
      />

      <LanguageAutocomplete
        label="Idioma"
        languages={langs}
        value_id={row.language_id}
        onChangeId={(id) => onChange({ language_id: id })}
        sx={{ minWidth: 240, flex: 1 }}
        disabled={disabled || !selectedUser || langs.length === 0}
      />
    </RowCard>
  );
}
