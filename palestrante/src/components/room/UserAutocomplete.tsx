"use client";

import { SimpleUser } from "@/types/room";
import { Autocomplete, TextField } from "@mui/material";
import { SxProps } from "@mui/material/styles";
import { useMemo } from "react";

type Props = {
  label: string;
  users: SimpleUser[];
  value_id?: number | string;
  onChangeId: (id?: number | string) => void;
  sx?: SxProps;
  disabled?: boolean;
};

export default function UserAutocomplete({
  label,
  users,
  value_id,
  onChangeId,
  sx,
  disabled,
}: Props) {
  const options = useMemo(
    () => users.map((u) => ({ id: u.id, label: u.name })),
    [users]
  );
  const value = useMemo(
    () =>
      value_id != null
        ? options.find((o) => String(o.id) === String(value_id)) ?? null
        : null,
    [options, value_id]
  );

  return (
    <Autocomplete
      options={options}
      value={value}
      getOptionLabel={(o) => o.label}
      isOptionEqualToValue={(a, b) => String(a.id) === String(b.id)}
      onChange={(_, v) => onChangeId(v?.id)}
      renderInput={(params) => <TextField {...params} label={label} />}
      sx={sx}
      disabled={disabled}
    />
  );
}
