"use client";

import { Autocomplete, CircularProgress, TextField } from "@mui/material";

type ApiLanguage = { id: number | string; code?: string; name?: string };

export default function LanguagesMultiSelect({
  options,
  loading,
  selectedIds,
  onChangeSelectedIds,
  disabled,
}: {
  options: ApiLanguage[];
  loading?: boolean;
  selectedIds: number[];
  onChangeSelectedIds: (ids: number[]) => void;
  disabled?: boolean;
}) {
  const selected = options.filter((o) =>
    selectedIds.some((id) => Number(id) === Number(o.id))
  );

  return (
    <Autocomplete
      multiple
      options={options}
      value={selected}
      loading={!!loading}
      getOptionLabel={(opt) =>
        opt?.name
          ? opt.code
            ? `${opt.name} (${opt.code})`
            : String(opt.name)
          : String(opt.code ?? opt.id ?? "")
      }
      isOptionEqualToValue={(o, v) => Number(o.id) === Number(v.id)}
      onChange={(_, value) => {
        const ids = value?.map((v) => Number(v.id)) ?? [];
        onChangeSelectedIds(ids);
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Selecione um ou mais idiomas"
          placeholder="Idiomas"
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      disabled={disabled}
    />
  );
}
