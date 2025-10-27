"use client";

import { Typography } from "@mui/material";

type Props = {
  count: number;
};

export default function UsersHeader({ count }: Props) {
  return (
    <div>
      <Typography style={{ textAlign: "left" }} typography={"h5"}>
        Usuários
      </Typography>
      <Typography typography={"caption"} style={{ opacity: 0.6 }}>
        {count > 0
          ? `${count} ${
              count === 1 ? `usuário encontrado` : `usuários encontrados`
            }`
          : "—"}
      </Typography>
    </div>
  );
}
