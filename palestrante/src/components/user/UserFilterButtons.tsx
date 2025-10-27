"use client";

import {
  Typography,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { UserTypeFilter } from "@/types/user";

type Props = {
  filter: UserTypeFilter;
  onChangeFilter: (f: UserTypeFilter) => void;
};

export default function UsersFilterButtons({ filter, onChangeFilter }: Props) {
  return (
    <div>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={2}
        sx={{ width: "100%" }}>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={filter}
          onChange={(_, v) => v && onChangeFilter(v)}
          aria-label="Filtro de tipo de usuário">
          <ToggleButton value="all">Todos</ToggleButton>
          <ToggleButton value="translator">Tradutores</ToggleButton>
          <ToggleButton value="speaker">Palestrantes</ToggleButton>
          <ToggleButton value="admin">Admins</ToggleButton>
        </ToggleButtonGroup>
      </Stack>
    </div>
  );
}
