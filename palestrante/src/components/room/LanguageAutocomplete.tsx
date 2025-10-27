"use client";

import { Language } from "@/types/language";
import { Autocomplete, TextField } from "@mui/material";
import { SxProps } from "@mui/material/styles";
import { useMemo } from "react";

type Props = {
  label: string;
  languages: Language[];
  value_id?: number | string;
  onChangeId: (id?: number | string) => void;
  sx?: SxProps;
  disabled?: boolean;
};

export default function LanguageAutocomplete({
  label,
  languages,
  value_id,
  onChangeId,
  sx,
  disabled,
}: Props) {
  const options = useMemo(
    () =>
      languages.map((l) => ({
        id: l.id,
        code: l.code,
        label: l.code ? `${l.code} — ${l.name ?? ""}` : String(l.name ?? l.id),
      })),
    [languages]
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
