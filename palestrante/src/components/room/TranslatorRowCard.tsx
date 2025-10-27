"use client";

import { useMemo } from "react";
import RowCard from "./RowCard";
import UserAutocomplete from "./UserAutocomplete";
import LanguageAutocomplete from "./LanguageAutocomplete";
import { SimpleUser, TranslatorRow } from "@/types/room";

type Props = {
  row: TranslatorRow;
  users: SimpleUser[];
  onChange: (patch: Partial<TranslatorRow>) => void;
  onRemove: () => void;
  disabled?: boolean;
};

export default function TranslatorRowCard({
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
        label="Tradutor"
        users={users}
        value_id={row.user_id}
        onChangeId={(id) =>
          onChange({
            user_id: id,
            from_language_id: undefined,
            to_language_id: undefined,
          })
        }
        sx={{ minWidth: 260, flex: 1 }}
        disabled={disabled}
      />

      <LanguageAutocomplete
        label="Idioma origem"
        languages={langs}
        value_id={row.from_language_id}
        onChangeId={(id) => onChange({ from_language_id: id })}
        sx={{ minWidth: 240, flex: 1 }}
        disabled={disabled || !selectedUser || langs.length === 0}
      />

      <LanguageAutocomplete
        label="Idioma destino"
        languages={langs}
        value_id={row.to_language_id}
        onChangeId={(id) => onChange({ to_language_id: id })}
        sx={{ minWidth: 240, flex: 1 }}
        disabled={disabled || !selectedUser || langs.length === 0}
      />
    </RowCard>
  );
}
